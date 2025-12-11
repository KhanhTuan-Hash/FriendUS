from flask import Blueprint, redirect, url_for, flash, jsonify, request
from flask_login import current_user, login_required
from app.extensions import db
from app.models import Room, Activity, Constraint
from app.forms import ActivityForm, ConstraintForm
import random
from datetime import datetime, timedelta

planner_bp = Blueprint('planner', __name__)

# --- AI LOGIC INTEGRATED HERE ---
# Instead of a separate service, we handle the logic within the main app context.

MOCK_AI_DATA = {
    'food': [
        {'name': 'Pho 10 Ly Quoc Su', 'address': '10 Ly Quoc Su, Hanoi', 'intent': 'Eat traditional Pho'},
        {'name': 'Bun Cha Huong Lien', 'address': '24 Le Van Huu, Hanoi', 'intent': 'Try Obama Combo'},
        {'name': 'Cafe Giang', 'address': '39 Nguyen Huu Huan, Hanoi', 'intent': 'Drink Egg Coffee'},
        {'name': 'Banh Mi 25', 'address': '25 Hang Ca, Hanoi', 'intent': 'Quick breakfast'},
        {'name': 'Pizza 4P\'s', 'address': 'Trang Tien, Hanoi', 'intent': 'Fancy dinner'},
    ],
    'attraction': [
        {'name': 'Hoan Kiem Lake', 'address': 'Hoan Kiem Dist, Hanoi', 'intent': 'Walking tour'},
        {'name': 'Temple of Literature', 'address': '58 Quoc Tu Giam, Hanoi', 'intent': 'Cultural visit'},
        {'name': 'Thang Long Imperial Citadel', 'address': '19C Hoang Dieu, Hanoi', 'intent': 'History tour'},
        {'name': 'Hanoi Opera House', 'address': '1 Trang Tien, Hanoi', 'intent': 'Architecture view'},
    ],
    'transport': [
        {'name': 'GrabCar Premium', 'address': 'Pickup at hotel', 'intent': 'Move to next location'},
        {'name': 'Cyclo Tour', 'address': 'Old Quarter', 'intent': 'Sightseeing ride'},
    ]
}

@planner_bp.route('/ai_suggest', methods=['POST'])
@login_required
def ai_suggest():
    """
    Internal AI Endpoint. 
    Handles suggestion generation based on user context/prompt.
    """
    try:
        data = request.json
        # NOTE: If room_id is needed to check existing constraints, it should be passed here.
        prompt = data.get('message', '').lower()
        
        # Simple Keyword Heuristics (Mimics AI)
        suggestions = []
        
        categories = []
        if 'eat' in prompt or 'food' in prompt or 'hungry' in prompt or 'dinner' in prompt or 'cơm' in prompt:
            categories.append('food')
        if 'visit' in prompt or 'see' in prompt or 'tour' in prompt or 'culture' in prompt or 'đi' in prompt:
            categories.append('attraction')
        if 'go' in prompt or 'car' in prompt or 'ride' in prompt or 'xe' in prompt:
            categories.append('transport')
            
        if not categories:
            # Default suggestion
            categories = ['food', 'attraction']

        # Generate Random Suggestions (up to 4 total)
        for cat in categories:
            items = random.sample(MOCK_AI_DATA[cat], k=min(len(MOCK_AI_DATA[cat]), 2))
            for item in items:
                suggestions.append({
                    "name": item['name'],
                    "step_intent": item['intent'],
                    "address": item['address']
                })
        
        # Filter to ensure we don't return too many for the UI
        suggestions = suggestions[:4]

        return jsonify({
            "status": "success",
            "data": suggestions
        })

    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# --- EXISTING ROUTES (unchanged) ---

@planner_bp.route('/room/<int:room_id>/add_activity', methods=['POST'])
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
    return redirect(url_for('chat.chat_room', room_name=room.name))

@planner_bp.route('/room/<int:room_id>/add_constraint', methods=['POST'])
@login_required
def add_room_constraint(room_id):
    room = Room.query.get_or_404(room_id)
    form = ConstraintForm()
    
    if form.validate_on_submit():
        new_cons = Constraint(
            type=form.type.data, 
            intensity=form.intensity.data, 
            value=form.value.data,
            user=current_user, 
            room_id=room.id
        )
        db.session.add(new_cons)
        db.session.commit()
        flash('Constraint added successfully.', 'success')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Error in {field}: {error}", 'danger')
                
    return redirect(url_for('chat.chat_room', room_name=room.name))

@planner_bp.route('/delete_activity/<int:id>')
@login_required
def delete_activity(id):
    act = Activity.query.get_or_404(id)
    room_name = act.room.name
    db.session.delete(act)
    db.session.commit()
    return redirect(url_for('chat.chat_room', room_name=room_name))

@planner_bp.route('/delete_constraint/<int:id>')
@login_required
def delete_constraint(id):
    cons = Constraint.query.get_or_404(id)
    room_name = cons.room.name
    if cons.user_id == current_user.id:
        db.session.delete(cons)
        db.session.commit()
    return redirect(url_for('chat.chat_room', room_name=room_name))