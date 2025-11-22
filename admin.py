from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user
from functools import wraps

# Import models
from ext import db
from models import User, Room, Message, Transaction, Activity

# Define the Blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# --- CUSTOM DECORATOR ---
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash("You do not have server/admin access.", "danger")
            return redirect(url_for('client.index'))
        return f(*args, **kwargs)
    return decorated_function

# --- ADMIN DASHBOARD ---
@admin_bp.route('/dashboard')
@login_required
@admin_required
def dashboard():
    # Server View: See global stats
    user_count = User.query.count()
    room_count = Room.query.count()
    msg_count = Message.query.count()
    trans_count = Transaction.query.count()
    
    # Get recent system activity
    recent_users = User.query.order_by(User.id.desc()).limit(10).all()
    
    return render_template('admin_dashboard.html', 
                           user_count=user_count, 
                           room_count=room_count, 
                           msg_count=msg_count, 
                           trans_count=trans_count,
                           recent_users=recent_users)

# --- SERVER DEBUG FEATURES ---
@admin_bp.route('/debug/users')
@login_required
@admin_required
def debug_users():
    """View raw user data for debugging"""
    users = User.query.all()
    return render_template('debug_users.html', users=users)

@admin_bp.route('/debug/transactions')
@login_required
@admin_required
def debug_transactions():
    """View all transactions globally"""
    transactions = Transaction.query.all()
    return render_template('debug_transactions.html', transactions=transactions)

# --- POWERFUL ACTIONS (Admin Only) ---

@admin_bp.route('/delete_room/<int:room_id>', methods=['POST'])
@login_required
@admin_required
def force_delete_room(room_id):
    """Admin can delete ANY room, regardless of creator"""
    room = Room.query.get_or_404(room_id)
    if room.name == 'general':
        flash("Even Admins cannot delete the General room.", "warning")
        return redirect(url_for('admin.dashboard'))
    
    try:
        Message.query.filter_by(room=room.name).delete()
        Activity.query.filter_by(room_id=room.id).delete()
        # Clean up transactions linked to room if any (optional)
        db.session.delete(room)
        db.session.commit()
        flash(f"Room {room.name} force deleted by Admin.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Error deleting room: {e}", "danger")
        
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/make_admin/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def make_admin(user_id):
    user = User.query.get_or_404(user_id)
    user.is_admin = True
    db.session.commit()
    flash(f"User {user.username} is now an Admin.", "success")
    return redirect(url_for('admin.debug_users'))