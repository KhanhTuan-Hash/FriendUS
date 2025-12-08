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
        new_room.members.append(current_user)
        db.session.add(new_room)
        db.session.commit()
        return redirect(url_for('chat.chat_room', room_name=new_room.name))

    all_rooms = Room.query.all()
    my_rooms = current_user.rooms.all()
    return render_template('chat_lobby.html', title='Chat Lobby', form=form, all_rooms=all_rooms, my_rooms=my_rooms)

@chat_bp.route('/chat/<string:room_name>', methods=['GET'])
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
    
    timeline_data = []
    for act in activities:
        timeline_data.append({
            'name': act.name,
            'start': act.start_time,
            'end': act.end_time
        })

    my_constraints = Constraint.query.filter_by(user_id=current_user.id, room_id=room.id).all()
    conflicts = check_conflicts(activities, my_constraints)

    # --- FINANCE DATA ---
    trans_form = TransactionForm()
    trans_form.receiver.choices = [(m.id, m.username) for m in room.members if m.id != current_user.id]
    if not trans_form.receiver.choices: trans_form.receiver.choices = [(0, 'No other members')]

    pending_trans = Transaction.query.filter_by(room_id=room.id, receiver_id=current_user.id, status='pending').all()
    history_trans = Transaction.query.filter(Transaction.room_id == room.id).filter(
        (Transaction.sender_id == current_user.id) | (Transaction.receiver_id == current_user.id)
    ).order_by(Transaction.timestamp.desc()).all()

    return render_template('chat_room.html', title=f'Trip: {room.name}', 
                           room=room,
                           act_form=act_form, cons_form=cons_form, 
                           activities=activities, 
                           timeline_data=timeline_data,
                           constraints=my_constraints, conflicts=conflicts,
                           trans_form=trans_form, pending_trans=pending_trans, history_trans=history_trans)

@chat_bp.route('/chat/delete/<int:room_id>', methods=['POST'])
@login_required
def delete_chat_room(room_id):
    room_to_delete = Room.query.get_or_404(room_id)
    
    if room_to_delete.name == 'general':
          flash('The general room cannot be deleted.', 'danger')
          return redirect(url_for('chat.chat'))
    
    if room_to_delete.creator != current_user:
        flash('You do not have permission to delete this room.', 'danger')
        return redirect(url_for('chat.chat'))
        
    try:
        Message.query.filter_by(room=room_to_delete.name).delete()
        db.session.delete(room_to_delete)
        db.session.commit()
        flash(f'Room "{room_to_delete.name}" has been deleted.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting room: {e}', 'danger')
        
    return redirect(url_for('chat.chat'))