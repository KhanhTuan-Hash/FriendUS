from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Room, Message, Activity, Constraint, Transaction
from app.forms import CreateRoomForm, ActivityForm, ConstraintForm, TransactionForm
from app.utils import check_conflicts

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['GET', 'POST'])
@login_required
def chat():
    form = CreateRoomForm()
    if form.validate_on_submit():
        new_room = Room(name=form.name.data, description=form.description.data, creator=current_user)
        # Handle Password creation
        if form.password.data:
            new_room.set_password(form.password.data)
            
        new_room.members.append(current_user)
        db.session.add(new_room)
        db.session.commit()
        return redirect(url_for('chat.chat_room', room_name=new_room.name))

    all_rooms = Room.query.all()
    my_rooms = current_user.rooms.all()
    return render_template('chat_lobby.html', title='Chat Lobby', form=form, all_rooms=all_rooms, my_rooms=my_rooms)

@chat_bp.route('/chat/join_private', methods=['POST'])
@login_required
def join_private_room():
    room_id = request.form.get('room_id')
    password = request.form.get('password')
    room = Room.query.get_or_404(room_id)
    
    if room.check_password(password):
        if current_user not in room.members:
            room.members.append(current_user)
            db.session.commit()
            flash(f'Successfully joined {room.name}!', 'success')
        return redirect(url_for('chat.chat_room', room_name=room.name))
    else:
        flash('Incorrect password.', 'danger')
        return redirect(url_for('chat.chat'))

# [IMPORTANT FIX] Added <string:room_name> below
@chat_bp.route('/chat/<string:room_name>', methods=['GET'])
@login_required
def chat_room(room_name):
    room = Room.query.filter_by(name=room_name).first_or_404()
    
    # Check access for private rooms
    if current_user not in room.members:
        if room.password_hash: 
            flash('This room is private. Please enter the password.', 'warning')
            return redirect(url_for('chat.chat'))
        else:
            room.members.append(current_user)
            db.session.commit()
            flash(f'Joined room: {room.name}', 'info')

    # ... (Your existing Planner & Finance code goes here) ...
    # This part is fine, just ensure the route definition above is correct.
    
    # --- Simplified for brevity, keep your original logic here ---
    act_form = ActivityForm()
    cons_form = ConstraintForm()
    activities = Activity.query.filter_by(room_id=room.id).all()
    timeline_data = [{'name': a.name, 'start': a.start_time, 'end': a.end_time} for a in activities]
    my_constraints = Constraint.query.filter_by(user_id=current_user.id, room_id=room.id).all()
    conflicts = check_conflicts(activities, my_constraints)
    
    trans_form = TransactionForm()
    trans_form.receiver.choices = [(m.id, m.username) for m in room.members if m.id != current_user.id] or [(0, 'No others')]
    pending_trans = Transaction.query.filter_by(room_id=room.id, receiver_id=current_user.id, status='pending').all()
    history_trans = Transaction.query.filter(Transaction.room_id == room.id).filter(
        (Transaction.sender_id == current_user.id) | (Transaction.receiver_id == current_user.id)
    ).order_by(Transaction.timestamp.desc()).all()

    return render_template('chat_room.html', title=f'{room.name}', 
                           room=room, act_form=act_form, cons_form=cons_form, 
                           activities=activities, timeline_data=timeline_data,
                           constraints=my_constraints, conflicts=conflicts,
                           trans_form=trans_form, pending_trans=pending_trans, history_trans=history_trans)

# [IMPORTANT FIX] Added <int:room_id> below
@chat_bp.route('/chat/delete/<int:room_id>', methods=['POST'])
@login_required
def delete_chat_room(room_id):
    room = Room.query.get_or_404(room_id)
    if room.creator != current_user or room.name == 'general':
        flash('Cannot delete this room.', 'danger')
        return redirect(url_for('chat.chat'))
        
    db.session.delete(room)
    db.session.commit()
    flash('Room deleted.', 'success')
    return redirect(url_for('chat.chat'))