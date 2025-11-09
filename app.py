import os
import json
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, flash, request
from flask_bootstrap import Bootstrap5
from flask_login import login_user, logout_user, current_user, login_required
from flask_socketio import SocketIO, send, emit, join_room, leave_room

# Import extensions and models
from ext import db, login_manager
from models import User, Post, Location, Review 

# Import forms
from forms import RegisterForm, LoginForm, PostForm, UpdateAccountForm, ReviewForm 

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
    if Location.query.first():
        return # Database already populated

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
        if user and user.password == form.password.data: # NOTE: In a real app, hash passwords!
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

# --- MAP/LOCATION ROUTES (UPDATED) ---

@app.route('/map')
@login_required
def map():
    # Redirect to the main map search page
    return redirect(url_for('map_search'))

@app.route('/map/search')
@login_required
def map_search():
    query = request.args.get('query')
    # --- ADD THESE LINES to get lat/lon from URL ---
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    # --- END OF ADDED LINES ---
    
    locations = []
    
    if query:
        locations = Location.query.filter(Location.name.ilike(f'%{query}%')).all()
    else:
        locations = Location.query.all()
    
    # --- THIS IS THE KEY CHANGE ---
    # Serialize location data for JavaScript (Leaflet)
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

    # Pass the JSON string and map defaults to the template
    return render_template('map.html', 
                           title='Map Search', 
                           query=query,
                           locations_json=json.dumps(locations_data),
                           # --- ADD THESE LINES to pass defaults ---
                           default_lat=lat,
                           default_lon=lon
                           # --- END OF ADDED LINES ---
                           )

# Note: The '/map_embed' route is no longer needed, as Leaflet
# will render the map directly in the 'map.html' template.

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

# --- CHAT ROUTES (NEW) ---

@app.route('/chat')
@login_required
def chat():
    # Renders the chat interface
    return render_template('chat.html', title='Group Chat')

# --- SOCKETIO EVENT HANDLERS (NEW) ---

@socketio.on('connect')
def handle_connect():
    """Event handler for when a user connects."""
    if current_user.is_authenticated:
        join_room('general')
        emit('status', 
             {'msg': f'{current_user.username} has joined the chat.'}, 
             to='general')
    else:
        # Handle unauthenticated connection if necessary
        pass

@socketio.on('disconnect')
def handle_disconnect():
    """Event handler for when a user disconnects."""
    if current_user.is_authenticated:
        leave_room('general')
        emit('status', 
             {'msg': f'{current_user.username} has left the chat.'}, 
             to='general')

@socketio.on('send_message')
def handle_send_message(data):
    """Event handler for when a user sends a message."""
    if current_user.is_authenticated:
        message_content = data.get('msg')
        if message_content:
            emit('receive_message', {
                'msg': message_content,
                'username': current_user.username,
                'timestamp': datetime.utcnow().strftime('%Y-%m-%d %H:%M')
            }, to='general')

# --- Run the App ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        populate_db() 
    # Use socketio.run() to enable WebSockets and the web server
    socketio.run(app, debug=True)