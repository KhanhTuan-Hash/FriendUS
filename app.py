import os
import json
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_bootstrap import Bootstrap5
from flask_login import login_user, logout_user, current_user, login_required
from flask_socketio import SocketIO, send, emit, join_room, leave_room

# Import extensions and models
from ext import db, login_manager
# UPDATED: Import all models, including the new Room model
from models import User, Post, Location, Review, Message, Room 

# Import forms
# UPDATED: Import the new CreateRoomForm
from forms import RegisterForm, LoginForm, PostForm, UpdateAccountForm, ReviewForm, CreateRoomForm

# --- App Setup ---
app = Flask(__name__)

# --- Config ---
app.config['SECRET_KEY'] = 'a-very-secret-key-that-you-should-change'
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'friendus.db')

# --- Initialize Extensions ---
db.init_app(app)
login_manager.init_app(app)
bootstrap = Bootstrap5(app) 
# Initialize SocketIO
socketio = SocketIO(app)

# --- Login Manager Helper ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Function to populate database with locations ---
def populate_db():
    if not Location.query.first():
        loc1 = Location(
            name="Eiffel Tower",
            description="Iconic wrought-iron landmark in Paris, France.",
            latitude=48.8584, longitude=2.2945,
            hours="9:00 AM - 10:45 PM", phone="+33 892 70 12 39", website="https://www.toureiffel.paris"
        )
        loc2 = Location(
            name="Colosseum",
            description="Ancient oval amphitheatre in the centre of Rome, Italy.",
            latitude=41.8902, longitude=12.4922,
            hours="8:30 AM - 7:00 PM", phone="+39 06 3996 7700", website="https://colosseo.it"
        )
        loc3 = Location(
            name="Ho Chi Minh City University of Technology",
            description="A member of Vietnam National University, Ho Chi Minh City.",
            latitude=10.7729, longitude=106.6584,
            hours="7:00 AM - 5:00 PM", phone="+84 28 3864 7256", website="https://hcmut.edu.vn"
        )
        db.session.add_all([loc1, loc2, loc3])
        db.session.commit()
        print("Database populated with locations.")
    
    # --- NEW: Populate a default 'general' room ---
    if not Room.query.filter_by(name='general').first():
        # Note: We don't set a creator for the 'general' room
        # so no one can delete it.
        general_room = Room(name='general', description='A general chat room for all users.')
        db.session.add(general_room)
        db.session.commit()
        print("Created 'general' room.")

# --- Routes ---

@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    form = PostForm()
    if form.validate_on_submit():
        post = Post(
            body=form.body.data, 
            author=current_user,
            latitude=form.latitude.data,
            longitude=form.longitude.data
        )
        db.session.add(post)
        db.session.commit()
        flash('Your post is now live!', 'success')
        return redirect(url_for('index'))
    
    posts = Post.query.order_by(Post.timestamp.desc()).all()
    suggestions = Location.query.limit(3).all()
    
    return render_template('index.html', title='Home', form=form, posts=posts, suggestions=suggestions)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.password == form.password.data:
            login_user(user, remember=form.remember.data)
            flash('You are now logged in!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
            
    return render_template('login.html', title='Login', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    form = RegisterForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data, password=form.password.data)
        db.session.add(user)
        db.session.commit()
        flash(f'Account created for {form.username.data}!', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html', title='Register', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/profile/<username>')
@login_required
def profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(author=user).order_by(Post.timestamp.desc()).all()
    return render_template('profile.html', title='Profile', user=user, posts=posts)

@app.route('/account', methods=['GET', 'POST'])
@login_required
def account():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        current_user.username = form.username.data
        current_user.email = form.email.data
        db.session.commit()
        flash('Your account has been updated!', 'success')
        return redirect(url_for('account'))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
        
    return render_template('account.html', title='Account', form=form)

# --- MAP/LOCATION ROUTES ---

@app.route('/map')
@login_required
def map():
    return redirect(url_for('map_search'))

@app.route('/map/search')
@login_required
def map_search():
    query = request.args.get('query')
    # Get lat/lon from query params for default view
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    locations = []
    
    if query:
        locations = Location.query.filter(Location.name.ilike(f'%{query}%')).all()
    else:
        locations = Location.query.all()
        
    # Serialize location data for JavaScript
    locations_data = []
    for loc in locations:
        locations_data.append({
            'id': loc.id,
            'name': loc.name,
            'desc': loc.description,
            'lat': loc.latitude,
            'lon': loc.longitude,
            'url': url_for('location_detail', location_id=loc.id)
        })
    
    return render_template('map.html', 
                           title='Map Search', 
                           query=query,
                           # Pass data for Leaflet.js
                           locations_data=locations_data,
                           default_lat=lat,
                           default_lon=lon
                           )

@app.route('/location/<int:location_id>', methods=['GET', 'POST'])
@login_required
def location_detail(location_id):
    location = Location.query.get_or_404(location_id)
    form = ReviewForm()
    
    if form.validate_on_submit():
        review = Review(
            body=form.body.data,
            rating=int(form.rating.data),
            author=current_user,
            location=location
        )
        db.session.add(review)
        db.session.commit()
        flash('Your review has been submitted!', 'success')
        return redirect(url_for('location_detail', location_id=location.id))
    
    reviews = Review.query.filter_by(location=location).order_by(Review.timestamp.desc()).all()
    
    return render_template('location_detail.html', title=location.name, location=location, form=form, reviews=reviews)

# --- CHAT ROUTES (UPDATED) ---

@app.route('/chat', methods=['GET', 'POST'])
@login_required
def chat():
    form = CreateRoomForm()
    if form.validate_on_submit():
        # --- MODIFIED: Add the creator ---
        new_room = Room(name=form.name.data, 
                        description=form.description.data, 
                        creator=current_user) # <-- ADDED THIS
        
        new_room.members.append(current_user)
        db.session.add(new_room)
        db.session.commit()
        flash(f'Room "{form.name.data}" has been created!', 'success')
        return redirect(url_for('chat_room', room_name=new_room.name))

    all_rooms = Room.query.all()
    my_rooms = current_user.rooms.all()
    
    return render_template('chat_lobby.html', title='Chat Lobby', 
                           form=form, all_rooms=all_rooms, my_rooms=my_rooms)

@app.route('/chat/<string:room_name>')
@login_required
def chat_room(room_name):
    room = Room.query.filter_by(name=room_name).first_or_404()
    
    # Add user to room members if not already in it
    if current_user not in room.members:
        room.members.append(current_user)
        db.session.commit()
        flash(f'You have joined the "{room.name}" room.', 'info')
        
    return render_template('chat_room.html', title=f'Chat - {room.name}', room=room)


# --- NEW: ROUTE TO DELETE A CHAT ROOM ---
@app.route('/chat/delete/<int:room_id>', methods=['POST'])
@login_required
def delete_chat_room(room_id):
    room_to_delete = Room.query.get_or_404(room_id)
    
    # Check if the current user is the creator
    # Also protect the 'general' room from being deleted
    if room_to_delete.name == 'general':
         flash('The general room cannot be deleted.', 'danger')
         return redirect(url_for('chat'))

    if room_to_delete.creator != current_user:
        flash('You do not have permission to delete this room.', 'danger')
        return redirect(url_for('chat'))
        
    try:
        # 1. Delete all messages from the room
        Message.query.filter_by(room=room_to_delete.name).delete()
        
        # 2. Clear all members from the association table
        room_to_delete.members = []
        
        # 3. Delete the room itself
        db.session.delete(room_to_delete)
        
        # 4. Commit changes
        db.session.commit()
        
        flash(f'Room "{room_to_delete.name}" has been deleted.', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting room: {e}', 'danger')

    return redirect(url_for('chat'))

# --- SOCKETIO EVENT HANDLERS ---

# We use this to track users in rooms
online_users_in_rooms = {}

def get_users_in_room(room_name):
    """Helper function to get list of usernames in a room."""
    if room_name in online_users_in_rooms:
        return list(online_users_in_rooms[room_name].values())
    return []

@socketio.on('connect')
def handle_connect():
    if current_user.is_authenticated:
        print(f'Client connected: {current_user.username} ({request.sid})')
    else:
        return False # Reject connection

@socketio.on('join')
def handle_join(data):
    if not current_user.is_authenticated:
        return
        
    room_name = data['room']
    
    if room_name not in online_users_in_rooms:
        online_users_in_rooms[room_name] = {}
    online_users_in_rooms[room_name][request.sid] = current_user.username
    
    join_room(room_name)
    
    emit('status', 
         {'msg': f'{current_user.username} has joined the chat.'}, 
         to=room_name)
    
    try:
        messages = Message.query.filter_by(room=room_name).order_by(Message.timestamp.asc()).limit(50).all()
        history = []
        for msg in messages:
            history.append({
                'msg': msg.body,
                'username': msg.author.username,
                'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M')
            })
        emit('load_history', history, to=request.sid)
    except Exception as e:
        print(f"Error loading chat history: {e}")

    emit('user_list', 
         {'users': get_users_in_room(room_name)}, 
         to=room_name)

@socketio.on('send_message')
def handle_send_message(data):
    if current_user.is_authenticated:
        msg_body = data['msg']
        room_name = data['room']
        
        try:
            new_msg = Message(
                body=msg_body,
                room=room_name,
                author=current_user
            )
            db.session.add(new_msg)
            db.session.commit()
            
            emit('receive_message', {
                'msg': new_msg.body,
                'username': new_msg.author.username,
                'timestamp': new_msg.timestamp.strftime('%Y-%m-%d %H:%M')
            }, to=room_name)
            
        except Exception as e:
            print(f"Error saving message: {e}")
            db.session.rollback()

@socketio.on('leave')
def handle_leave(data):
    if not current_user.is_authenticated:
        return
        
    room_name = data['room']
    leave_room(room_name)
    
    if room_name in online_users_in_rooms and request.sid in online_users_in_rooms[room_name]:
        username = online_users_in_rooms[room_name].pop(request.sid)
        
        emit('status', 
             {'msg': f'{username} has left the chat.'}, 
             to=room_name)
        
        emit('user_list', 
             {'users': get_users_in_room(room_name)}, 
             to=room_name)

@socketio.on('disconnect')
def handle_disconnect():
    if not current_user.is_authenticated:
        return
        
    print(f'Client disconnected: {request.sid}')
    for room_name, users in online_users_in_rooms.items():
        if request.sid in users:
            username = users.pop(request.sid)
            
            emit('status', 
                 {'msg': f'{username} has left the chat.'}, 
                 to=room_name)
            
            emit('user_list', 
                 {'users': get_users_in_room(room_name)}, 
                 to=room_name)
            break

# --- Run the App ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        populate_db() 
    # Use socketio.run() to run the app
    socketio.run(app, host='0.0.0.0', debug=True, allow_unsafe_werkzeug=True)
