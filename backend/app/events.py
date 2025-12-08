from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_login import current_user
from app.extensions import db, socketio
from app.models import Message

# Global state for online users
online_users_in_rooms = {}

def get_users_in_room(room_name):
    if room_name in online_users_in_rooms:
        return list(set(online_users_in_rooms[room_name].values()))
    return []

def register_socketio_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        if not current_user.is_authenticated: return False

    @socketio.on('join')
    def handle_join(data):
        if not current_user.is_authenticated: return
        room_name = data['room']
        
        if room_name not in online_users_in_rooms: 
            online_users_in_rooms[room_name] = {}
        
        # Clean up old connections for this user
        current_sids = [sid for sid, user in online_users_in_rooms[room_name].items() if user == current_user.username]
        for old_sid in current_sids:
            del online_users_in_rooms[room_name][old_sid]

        online_users_in_rooms[room_name][request.sid] = current_user.username
        join_room(room_name)
        
        emit('status', {'msg': f'{current_user.username} has joined.'}, to=room_name)
        
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