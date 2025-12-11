from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc, or_
from datetime import datetime
from app.extensions import db
from app.models import User, Room, Message, Transaction, Activity

chat_bp = Blueprint('chat', __name__, url_prefix='/api')

# ==========================================
# 1. CONVERSATION LIST (Chat.tsx)
# ==========================================

@chat_bp.route('/conversations', methods=['GET'])
@login_required
def get_conversations():
    """
    Returns list of chats for the sidebar.
    Logic: 
    - Fetch rooms current_user is in.
    - Determine correct Name/Avatar (Group vs Individual).
    - Find last message for preview.
    """
    user_rooms = current_user.rooms
    results = []

    for room in user_rooms:
        # Logic to find the last message
        last_msg = room.messages.order_by(Message.timestamp.desc()).first()
        
        # Logic for Name/Avatar
        # If type is 'individual', we show the OTHER person's name, not the room name
        chat_name = room.name
        avatar = room.avatar
        
        if room.type == 'individual':
            # Find the member who isn't me
            other_member = next((m for m in room.members if m.id != current_user.id), None)
            if other_member:
                chat_name = other_member.display_name or other_member.username
                avatar = other_member.avatar
        
        results.append({
            "id": room.id,
            "name": chat_name,
            "avatar": avatar,
            "type": room.type,
            "lastMessage": last_msg.content if last_msg else "No messages yet",
            "time": last_msg.timestamp.strftime("%I:%M %p") if last_msg else "",
            "unread": 0, # Note: Your schema needs a 'last_read_at' in room_members to calc this
            "participants": [m.username for m in room.members]
        })

    # Sort by time (newest first)
    results.sort(key=lambda x: x['time'], reverse=True) 
    return jsonify(results)

@chat_bp.route('/conversations', methods=['POST'])
@login_required
def create_conversation():
    """
    Handle Create Chat modal.
    Payload: { name: str, type: 'group'|'individual', participants: [username] }
    """
    data = request.json
    participant_usernames = data.get('participants', [])
    
    # 1. Create Room
    new_room = Room(
        name=data.get('name'),
        type=data.get('type', 'group'),
        creator_id=current_user.id,
        created_at=datetime.utcnow()
    )
    
    # 2. Add Participants
    participants = User.query.filter(User.username.in_(participant_usernames)).all()
    new_room.members.extend(participants)
    
    # Ensure creator is in the room
    if current_user not in new_room.members:
        new_room.members.append(current_user)
        
    db.session.add(new_room)
    db.session.commit()
    
    # Return format matching ChatConversation interface
    return jsonify({
        "id": new_room.id,
        "name": new_room.name,
        "avatar": new_room.avatar,
        "type": new_room.type,
        "lastMessage": "You created this group",
        "time": "Just now",
        "unread": 0,
        "participants": [p.username for p in new_room.members]
    })

# ==========================================
# 2. MESSAGING (ChatDetail.tsx)
# ==========================================

@chat_bp.route('/chat/<int:room_id>/messages', methods=['GET'])
@login_required
def get_messages(room_id):
    """ Fetch history. Maps 'Message' model to 'Message' interface. """
    room = Room.query.get_or_404(room_id)
    
    # Security: Ensure user is member
    if current_user not in room.members:
        return jsonify({"error": "Unauthorized"}), 403

    messages = room.messages.order_by(Message.timestamp.asc()).all()
    
    return jsonify([{
        "id": m.id,
        "sender": m.sender.username if m.sender else "System",
        "content": m.content,
        "time": m.timestamp.strftime("%I:%M %p"),
        "isMe": m.user_id == current_user.id,
        "isSystem": m.is_system
    } for m in messages])

@chat_bp.route('/chat/<int:room_id>/messages', methods=['POST'])
@login_required
def send_message(room_id):
    """ Handle Send button. """
    room = Room.query.get_or_404(room_id)
    data = request.json
    
    new_msg = Message(
        content=data['content'],
        user_id=current_user.id,
        room_id=room.id,
        timestamp=datetime.utcnow(),
        is_system=False
    )
    
    db.session.add(new_msg)
    db.session.commit()
    
    return jsonify({
        "id": new_msg.id,
        "sender": current_user.username,
        "content": new_msg.content,
        "time": new_msg.timestamp.strftime("%I:%M %p"),
        "isMe": True
    })

@chat_bp.route('/chat/<int:room_id>/leave', methods=['POST'])
@login_required
def leave_chat(room_id):
    room = Room.query.get_or_404(room_id)
    if current_user in room.members:
        room.members.remove(current_user)
        
        # Optional: Add system message that user left
        sys_msg = Message(
            content=f"{current_user.username} left the chat",
            room_id=room.id,
            is_system=True
        )
        db.session.add(sys_msg)
        db.session.commit()
        
    return jsonify({"success": True})

# ==========================================
# 3. HELPERS (Search & Finance)
# ==========================================

@chat_bp.route('/users/search', methods=['GET'])
@login_required
def search_users():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
        
    users = User.query.filter(User.username.ilike(f'%{query}%')).limit(10).all()
    
    return jsonify([{
        "username": u.username,
        "avatar": u.avatar or u.username[0].upper() # Fallback for avatar
    } for u in users])

# --- Finance Tab Data ---
@chat_bp.route('/chat/<int:room_id>/finance', methods=['GET'])
@login_required
def get_finance_data(room_id):
    """ Maps Transaction model to FinanceItem interface """
    transactions = Transaction.query.filter_by(room_id=room_id).all()
    
    results = []
    for t in transactions:
        # Determine if it's 'debt' (I owe) or 'lend' (Owed to me)
        # Frontend Interface: { person: string, amount: number, type: 'debt'|'lend' }
        
        if t.payer_id == current_user.id:
            # I paid, so this is money lent to someone else
            trans_type = 'lend'
            person = t.debtor.username if t.debtor else "Unknown"
        elif t.debtor_id == current_user.id:
            # Someone paid for me, this is my debt
            trans_type = 'debt'
            person = t.payer.username if t.payer else "Unknown"
        else:
            # Not involved me directly (group split calculation might be more complex)
            continue
            
        results.append({
            "id": t.id,
            "person": person,
            "amount": t.amount,
            "description": t.description,
            "type": trans_type,
            "settled": t.is_settled
        })
        
    return jsonify(results)

# --- Planner Tab Data ---
@chat_bp.route('/chat/<int:room_id>/planner', methods=['GET'])
@login_required
def get_planner_data(room_id):
    """ Maps Activity model to PlannerActivity interface """
    activities = Activity.query.filter_by(room_id=room_id).all()
    
    return jsonify([{
        "id": a.id,
        "time": a.time, # Assuming string "09:00" stored in DB as per model
        "title": a.title,
        "location": a.location,
        "completed": a.completed,
        "date": a.date, # Assuming string "2025-12-08"
        "description": a.description
    } for a in activities])

@chat_bp.route('/chat/<int:room_id>/planner', methods=['POST'])
@login_required
def add_activity(room_id):
    data = request.json
    new_activity = Activity(
        title=data['title'],
        date=data['date'],
        time=data['time'],
        location=data['location'],
        description=data.get('description'),
        completed=False,
        room_id=room_id
    )
    db.session.add(new_activity)
    db.session.commit()
    
    return jsonify({"success": True, "id": new_activity.id})