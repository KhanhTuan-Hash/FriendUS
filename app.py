import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_bootstrap import Bootstrap5
from flask_login import login_user, logout_user, current_user, login_required
from flask_socketio import SocketIO, send, emit, join_room, leave_room

# Import extensions and models
from ext import db, login_manager
from models import User, Message, Room, Transaction

# Import Blueprints
from client import client_bp
from admin import admin_bp

from forms import RegisterForm, LoginForm

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

# --- Register Blueprints ---
# Client routes are at root: /index, /chat
app.register_blueprint(client_bp)
# Admin routes are prefixed: /admin/dashboard, /admin/debug
app.register_blueprint(admin_bp)

# --- Login Manager Helper ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- SHARED AUTH ROUTES (Login/Register) ---
# We keep these in app.py as they are the entry gate for both programs

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated: 
        return redirect(url_for('client.index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        
        # --- SECURITY FIX: Check Hash instead of string ---
        # Old: if user and user.password == form.password.data:
        if user and check_password_hash(user.password, form.password.data):
        # --------------------------------------------------
            
            login_user(user, remember=form.remember.data)
            if user.is_admin:
                return redirect(url_for('admin.dashboard'))
            return redirect(url_for('client.index'))
        else: 
            flash('Login Unsuccessful.', 'danger')
    return render_template('login.html', title='Login', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated: return redirect(url_for('client.index'))
    form = RegisterForm()
    if form.validate_on_submit():
        # --- SECURITY FIX: Hash the password ---
        hashed_password = generate_password_hash(form.password.data)
        
        # Save the HASH, not the real password
        user = User(username=form.username.data, email=form.email.data, password=hashed_password)
        # ---------------------------------------
        
        db.session.add(user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('client.index'))

# --- SOCKETIO (Real-time layer) ---
# SocketIO is best kept in the main app context to avoid circular imports 
online_users_in_rooms = {}

def get_users_in_room(room_name):
    if room_name in online_users_in_rooms:
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
    
    current_sids = [sid for sid, user in online_users_in_rooms[room_name].items() if user == current_user.username]
    for old_sid in current_sids:
        del online_users_in_rooms[room_name][old_sid]

    online_users_in_rooms[room_name][request.sid] = current_user.username
    join_room(room_name)
    
    emit('status', {'msg': f'{current_user.username} has joined.'}, to=room_name)
    
    # Load History
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

# --- DB POPULATION (Helpers) ---
def populate_db():
    # Create default General room
    if not Room.query.filter_by(name='general').first():
        general_room = Room(name='general', description='A general chat room for all users.')
        db.session.add(general_room)
        db.session.commit()
    
    # OPTIONAL: Create default Admin if none exists
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@example.com', password='password', is_admin=True)
        db.session.add(admin)
        db.session.commit()
        print("Created default Admin user (email: admin@example.com, pass: password)")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        populate_db() 

    print("Server is running at http://127.0.0.1:5000")
    socketio.run(app, host='0.0.0.0', debug=True, allow_unsafe_werkzeug=True)