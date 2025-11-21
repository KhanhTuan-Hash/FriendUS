from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_bootstrap import Bootstrap5
from flask_login import login_user, logout_user, current_user, login_required
from flask_socketio import SocketIO, send, emit, join_room, leave_room
import osmnx as ox
import geopandas as gpd
from sqlalchemy import func

# Import extensions and models
from ext import db, login_manager
from models import User, Post, Location, Review, Message, Room, Transaction, Outsider, Activity, Constraint

from forms import RegisterForm, LoginForm, PostForm, UpdateAccountForm, ReviewForm, CreateRoomForm, TransactionForm, ActivityForm, ConstraintForm

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
socketio = SocketIO(app)

# --- Login Manager Helper ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ... [Keep create_location_on_click and populate_db as they were] ...

@app.route('/api/create_location_on_click', methods=['POST'])
@login_required
def create_location_on_click():
    data = request.json
    existing = Location.query.filter(
        Location.latitude.between(data['lat'] - 0.0001, data['lat'] + 0.0001),
        Location.longitude.between(data['lon'] - 0.0001, data['lon'] + 0.0001)
    ).first()
    
    if existing:
        return jsonify({'url': url_for('location_detail', location_id=existing.id)})

    new_loc = Location(
        name=data['name'] if data['name'] else "Dropped Pin",
        description=f"Address: {data['address']}",
        latitude=data['lat'],
        longitude=data['lon'],
        type="Custom",
        price_range=0
    )
    
    db.session.add(new_loc)
    db.session.commit()
    return jsonify({'url': url_for('location_detail', location_id=new_loc.id)})

def populate_db():
    if not Room.query.filter_by(name='general').first():
        general_room = Room(name='general', description='A general chat room for all users.')
        db.session.add(general_room)
        db.session.commit()
        print("Created 'general' room.")

# --- FINANCE LOGIC (PAIRWISE) ---
def simplify_debts(transactions):
    pair_balances = {} 

    for t in transactions:
        s_name = t.sender.username
        
        if t.receiver:
            r_name = t.receiver.username
        elif t.outsider:
            r_name = f"{t.outsider.name} (Outside)"
        else:
            continue 

        amount = float(t.amount)
        p1, p2 = sorted((s_name, r_name))
        key = (p1, p2)
        
        if key not in pair_balances: pair_balances[key] = 0.0

        if t.type == 'debt':
            if s_name == p1: pair_balances[key] += amount
            else: pair_balances[key] -= amount
        elif t.type == 'repayment':
            if s_name == p1: pair_balances[key] -= amount
            else: pair_balances[key] += amount

    direct_edges = []
    for (p1, p2), bal in pair_balances.items():
        if bal > 0:
            direct_edges.append({'from': p1, 'to': p2, 'amount': bal, 'label': f"{bal:,.0f}"})
        elif bal < 0:
            direct_edges.append({'from': p2, 'to': p1, 'amount': abs(bal), 'label': f"{abs(bal):,.0f}"})

    return direct_edges

# --- PLANNER LOGIC ---
def check_conflicts(activities, constraints):
    conflicts = {} 
    for act in activities:
        act_conflicts = []
        for cons in constraints:
            if cons.type == 'price':
                try:
                    limit = float(cons.value)
                    if act.price > limit:
                        msg = f"Over budget (${limit})"
                        act_conflicts.append({'msg': msg, 'level': 'critical' if cons.intensity == 'rough' else 'warning'})
                except ValueError: pass
            
            if cons.type == 'time':
                if act.start_time and act.start_time < cons.value:
                    msg = f"Too early (Before {cons.value})"
                    act_conflicts.append({'msg': msg, 'level': 'critical' if cons.intensity == 'rough' else 'warning'})

        if act_conflicts:
            conflicts[act.id] = act_conflicts
            
    return conflicts

# --- Routes ---

# ... [Keep index, login, register, logout, profile, account, map, location routes exactly as before] ...
@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    form = PostForm()
    if form.validate_on_submit():
        filename = None
        if form.media.data:
            file = form.media.data
            filename = secure_filename(file.filename)
            upload_folder = os.path.join(app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_folder): os.makedirs(upload_folder)
            file.save(os.path.join(upload_folder, filename))

        post = Post(body=form.body.data, author=current_user, media_filename=filename)
        db.session.add(post)
        db.session.commit()
        return redirect(url_for('index'))
    
    posts = Post.query.order_by(Post.timestamp.desc()).all()
    avg_rating = func.coalesce(func.avg(Review.rating), 0).label('average_rating')
    suggestions = db.session.query(Location, avg_rating).outerjoin(Review, Location.id == Review.location_id).group_by(Location.id).order_by(avg_rating.desc()).limit(5).all() 
    return render_template('index.html', title='Home', form=form, posts=posts, suggestions=suggestions)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated: return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.password == form.password.data:
            login_user(user, remember=form.remember.data)
            return redirect(url_for('index'))
        else: flash('Login Unsuccessful.', 'danger')
    return render_template('login.html', title='Login', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated: return redirect(url_for('index'))
    form = RegisterForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data, password=form.password.data)
        db.session.add(user)
        db.session.commit()
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
        flash('Account updated!', 'success')
        return redirect(url_for('account'))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
    return render_template('account.html', title='Account', form=form)

@app.route('/map')
@login_required
def map():
    return redirect(url_for('map_search'))

@app.route('/map/search')
@login_required
def map_search():
    # ... (Existing map search code) ...
    query_name = request.args.get('query')
    query_type = request.args.get('type')
    query_price = request.args.get('price', type=int)
    query_rating = request.args.get('rating', type=int)
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    avg_rating = func.coalesce(func.avg(Review.rating), 0).label('average_rating')
    query = db.session.query(Location, avg_rating).outerjoin(Review, Location.id == Review.location_id).group_by(Location.id)

    if query_name: query = query.filter(Location.name.ilike(f'%{query_name}%'))
    if query_type: query = query.filter(Location.type == query_type)
    if query_price: query = query.filter(Location.price_range == query_price)
    if query_rating: query = query.having(avg_rating >= query_rating)

    locations_data = []
    for loc, rating in query.all():
        locations_data.append({
            'id': loc.id, 'name': loc.name, 'desc': loc.description,
            'lat': loc.latitude, 'lon': loc.longitude,
            'url': url_for('location_detail', location_id=loc.id),
            'rating': float(rating)
        })
    
    return render_template('map.html', title='Map Search', 
                           query=query_name, query_type=query_type,
                           query_price=query_price, query_rating=query_rating,
                           locations_data=locations_data, default_lat=lat, default_lon=lon)

@app.route('/location/<int:location_id>', methods=['GET', 'POST'])
@login_required
def location_detail(location_id):
    location = Location.query.get_or_404(location_id)
    form = ReviewForm()
    is_favorited = current_user.favorite_locations.filter(Location.id == location.id).count() > 0
    
    if form.validate_on_submit():
        review = Review(body=form.body.data, rating=int(form.rating.data), author=current_user, location=location)
        db.session.add(review)
        db.session.commit()
        return redirect(url_for('location_detail', location_id=location.id))
    
    reviews = Review.query.filter_by(location=location).order_by(Review.timestamp.desc()).all()
    return render_template('location_detail.html', title=location.name, location=location, form=form, reviews=reviews, is_favorited=is_favorited)

# --- CHAT & MERGED FEATURES ---

# --- FIX FOR LEGACY NAVIGATION LINKS ---
@app.route('/finance')
@login_required
def finance_dashboard():
    # Redirect old Finance link to the Chat Lobby
    flash('Finance features are now inside each Chat Room. Please join a room to view them.', 'info')
    return redirect(url_for('chat'))

@app.route('/chat/delete/<int:room_id>', methods=['POST'])
@login_required
def delete_chat_room(room_id):
    room_to_delete = Room.query.get_or_404(room_id)
    
    # Prevent deleting the default room
    if room_to_delete.name == 'general':
          flash('The general room cannot be deleted.', 'danger')
          return redirect(url_for('chat'))
    
    # Only the creator can delete
    if room_to_delete.creator != current_user:
        flash('You do not have permission to delete this room.', 'danger')
        return redirect(url_for('chat'))
        
    try:
        # Delete messages associated with this room
        Message.query.filter_by(room=room_to_delete.name).delete()
        
        # Delete the room itself
        db.session.delete(room_to_delete)
        db.session.commit()
        flash(f'Room "{room_to_delete.name}" has been deleted.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting room: {e}', 'danger')
        
    return redirect(url_for('chat'))

@app.route('/chat', methods=['GET', 'POST'])
@login_required
def chat():
    form = CreateRoomForm()
    if form.validate_on_submit():
        new_room = Room(name=form.name.data, description=form.description.data, creator=current_user)
        new_room.members.append(current_user)
        db.session.add(new_room)
        db.session.commit()
        return redirect(url_for('chat_room', room_name=new_room.name))

    all_rooms = Room.query.all()
    my_rooms = current_user.rooms.all()
    return render_template('chat_lobby.html', title='Chat Lobby', form=form, all_rooms=all_rooms, my_rooms=my_rooms)

@app.route('/chat/<string:room_name>', methods=['GET'])
@login_required
def chat_room(room_name):
    room = Room.query.filter_by(name=room_name).first_or_404()
    
    # Auto-join
    if current_user not in room.members:
        room.members.append(current_user)
        db.session.commit()
        flash(f'Joined room: {room.name}', 'info')

    # --- PLANNER DATA ---
    act_form = ActivityForm()
    cons_form = ConstraintForm()
    activities = Activity.query.filter_by(room_id=room.id).all()
    my_constraints = Constraint.query.filter_by(user_id=current_user.id, room_id=room.id).all()
    conflicts = check_conflicts(activities, my_constraints)

    # --- FINANCE DATA ---
    trans_form = TransactionForm()
    # Limit choices to room members only
    trans_form.receiver.choices = [(m.id, m.username) for m in room.members if m.id != current_user.id]
    if not trans_form.receiver.choices: trans_form.receiver.choices = [(0, 'No other members')]

    # Filter transactions by ROOM
    pending_trans = Transaction.query.filter_by(room_id=room.id, receiver_id=current_user.id, status='pending').all()
    history_trans = Transaction.query.filter(Transaction.room_id == room.id).filter(
        (Transaction.sender_id == current_user.id) | (Transaction.receiver_id == current_user.id)
    ).order_by(Transaction.timestamp.desc()).all()

    return render_template('chat_room.html', title=f'Trip: {room.name}', 
                           room=room,
                           # Planner
                           act_form=act_form, cons_form=cons_form, activities=activities, 
                           constraints=my_constraints, conflicts=conflicts,
                           # Finance
                           trans_form=trans_form, pending_trans=pending_trans, history_trans=history_trans)

# --- NEW ACTION ROUTES FOR CHAT FEATURES ---

@app.route('/room/<int:room_id>/add_activity', methods=['POST'])
@login_required
def add_room_activity(room_id):
    room = Room.query.get_or_404(room_id)
    form = ActivityForm()
    if form.validate_on_submit():
        new_act = Activity(
            name=form.name.data, location=form.location.data, price=form.price.data,
            start_time=form.start_time.data, end_time=form.end_time.data,
            rating=form.rating.data if form.rating.data else 0, room=room
        )
        db.session.add(new_act)
        db.session.commit()
        flash('Activity added!', 'success')
    else:
        flash('Error adding activity.', 'danger')
    return redirect(url_for('chat_room', room_name=room.name))

@app.route('/room/<int:room_id>/add_constraint', methods=['POST'])
@login_required
def add_room_constraint(room_id):
    room = Room.query.get_or_404(room_id)
    form = ConstraintForm()
    if form.validate_on_submit():
        new_cons = Constraint(
            type=form.type.data, intensity=form.intensity.data, value=form.value.data,
            user=current_user, room_id=room.id
        )
        db.session.add(new_cons)
        db.session.commit()
    return redirect(url_for('chat_room', room_name=room.name))

@app.route('/room/<int:room_id>/add_transaction', methods=['POST'])
@login_required
def add_room_transaction(room_id):
    room = Room.query.get_or_404(room_id)
    form = TransactionForm()
    # Re-populate choices for validation
    form.receiver.choices = [(m.id, m.username) for m in room.members if m.id != current_user.id]
    if not form.receiver.choices: form.receiver.choices = [(0, 'No members')]

    if form.validate_on_submit():
        new_trans = Transaction(
            amount=form.amount.data, description=form.description.data, type=form.type.data,
            sender_id=current_user.id, status='pending', room_id=room.id 
        )
        if form.is_outside.data and form.outsider_name.data:
            o_name = form.outsider_name.data.strip()
            outsider = Outsider.query.filter_by(name=o_name, creator_id=current_user.id).first()
            if not outsider:
                outsider = Outsider(name=o_name, creator_id=current_user.id)
                db.session.add(outsider)
                db.session.commit()
            new_trans.outsider_id = outsider.id
            new_trans.status = 'confirmed' 
        else:
            new_trans.receiver_id = form.receiver.data
        
        db.session.add(new_trans)
        db.session.commit()
        flash('Transaction recorded.', 'success')
    else:
        flash('Invalid transaction data.', 'danger')
    return redirect(url_for('chat_room', room_name=room.name))

@app.route('/finance/confirm/<int:trans_id>', methods=['POST'])
@login_required
def confirm_transaction(trans_id):
    trans = Transaction.query.get_or_404(trans_id)
    # Redirect back to the room the transaction belongs to
    room_name = trans.room.name
    if trans.receiver_id != current_user.id:
        return redirect(url_for('chat_room', room_name=room_name))
    trans.status = 'confirmed'
    db.session.commit()
    return redirect(url_for('chat_room', room_name=room_name))

@app.route('/finance/delete/<int:trans_id>', methods=['POST'])
@login_required
def delete_transaction(trans_id):
    trans = Transaction.query.get_or_404(trans_id)
    room_name = trans.room.name
    if trans.sender_id == current_user.id:
        db.session.delete(trans)
        db.session.commit()
    return redirect(url_for('chat_room', room_name=room_name))

# --- FIX FOR LEGACY PLANNER LINKS ---
@app.route('/planner/<int:room_id>')
@login_required
def planner(room_id):
    # Find the room
    room = Room.query.get_or_404(room_id)
    # Redirect to the new Chat Room view (where the planner now lives)
    flash('The Planner is now located inside the Chat Room tabs.', 'info')
    return redirect(url_for('chat_room', room_name=room.name))

@app.route('/planner/delete_activity/<int:id>')
@login_required
def delete_activity(id):
    act = Activity.query.get_or_404(id)
    room_name = act.room.name
    db.session.delete(act)
    db.session.commit()
    return redirect(url_for('chat_room', room_name=room_name))

@app.route('/planner/delete_constraint/<int:id>')
@login_required
def delete_constraint(id):
    cons = Constraint.query.get_or_404(id)
    room_name = cons.room.name # Access room via relationship
    if cons.user_id == current_user.id:
        db.session.delete(cons)
        db.session.commit()
    return redirect(url_for('chat_room', room_name=room_name))

@app.route('/api/finance_graph')
@login_required
def api_finance_graph():
    # FILTER BY ROOM ID
    room_id = request.args.get('room_id', type=int)
    if not room_id: return jsonify({'nodes': [], 'edges': []})

    transactions = Transaction.query.filter_by(room_id=room_id).filter(
        (Transaction.status == 'confirmed') | (Transaction.status == 'pending')
    ).all()
    
    edges = simplify_debts(transactions)
    nodes_set = set()
    for e in edges:
        nodes_set.add(e['from'])
        nodes_set.add(e['to'])
    nodes = [{'id': n, 'label': n, 'shape': 'dot', 'size': 20} for n in nodes_set]
    return jsonify({'nodes': nodes, 'edges': edges})

# --- SOCKETIO ---
online_users_in_rooms = {}

def get_users_in_room(room_name):
    if room_name in online_users_in_rooms:
        # ERROR WAS HERE: It was returning every connection, including duplicates.
        # FIX: Use set() to remove duplicate usernames, then convert back to list.
        return list(set(online_users_in_rooms[room_name].values()))
    return []

@socketio.on('connect')
def handle_connect():
    if not current_user.is_authenticated: return False

@socketio.on('join')
def handle_join(data):
    if not current_user.is_authenticated: return
    room_name = data['room']
    
    if room_name not in online_users_in_rooms: 
        online_users_in_rooms[room_name] = {}
    
    # --- FIX: Remove any old connections for this specific user in this room ---
    # This cleans up "ghost" connections from page refreshes
    current_sids = [sid for sid, user in online_users_in_rooms[room_name].items() if user == current_user.username]
    for old_sid in current_sids:
        del online_users_in_rooms[room_name][old_sid]
    # -------------------------------------------------------------------------

    online_users_in_rooms[room_name][request.sid] = current_user.username
    join_room(room_name)
    
    emit('status', {'msg': f'{current_user.username} has joined.'}, to=room_name)
    
    # ... (rest of the function stays the same) ...
    try:
        messages = Message.query.filter_by(room=room_name).order_by(Message.timestamp.asc()).limit(50).all()
        history = [{'msg': m.body, 'username': m.author.username, 'timestamp': m.timestamp.strftime('%Y-%m-%d %H:%M')} for m in messages]
        emit('load_history', history, to=request.sid)
    except Exception as e: print(f"Error history: {e}")
    
    emit('user_list', {'users': get_users_in_room(room_name)}, to=room_name)

@socketio.on('send_message')
def handle_send_message(data):
    if current_user.is_authenticated:
        try:
            new_msg = Message(body=data['msg'], room=data['room'], author=current_user)
            db.session.add(new_msg)
            db.session.commit()
            emit('receive_message', {
                'msg': new_msg.body, 'username': new_msg.author.username,
                'timestamp': new_msg.timestamp.strftime('%Y-%m-%d %H:%M')
            }, to=data['room'])
        except Exception: db.session.rollback()

@socketio.on('leave')
def handle_leave(data):
    if not current_user.is_authenticated: return
    room_name = data['room']
    leave_room(room_name)
    if room_name in online_users_in_rooms and request.sid in online_users_in_rooms[room_name]:
        username = online_users_in_rooms[room_name].pop(request.sid)
        emit('status', {'msg': f'{username} has left.'}, to=room_name)
        emit('user_list', {'users': get_users_in_room(room_name)}, to=room_name)

@socketio.on('disconnect')
def handle_disconnect():
    if not current_user.is_authenticated: return
    for room_name, users in online_users_in_rooms.items():
        if request.sid in users:
            username = users.pop(request.sid)
            emit('status', {'msg': f'{username} has left.'}, to=room_name)
            emit('user_list', {'users': get_users_in_room(room_name)}, to=room_name)
            break

@socketio.on('typing')
def handle_typing(data):
    if current_user.is_authenticated:
        emit('typing_status', {'username': current_user.username, 'isTyping': True}, to=data['room'], include_self=False)

@socketio.on('stopped_typing')
def handle_stopped_typing(data):
    if current_user.is_authenticated:
        emit('typing_status', {'username': current_user.username, 'isTyping': False}, to=data['room'], include_self=False)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        populate_db() 

    # Print the clickable link
    print("----------------------------------------------------------------")
    print("Server is running! Click the link below to open:")
    print("http://127.0.0.1:5000")
    print("----------------------------------------------------------------")

    socketio.run(app, host='0.0.0.0', debug=True, allow_unsafe_werkzeug=True)