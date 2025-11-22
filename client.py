from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.utils import secure_filename
import os
from sqlalchemy import func

# Import models and forms
from ext import db
from models import User, Post, Location, Review, Message, Room, Transaction, Outsider, Activity, Constraint
from forms import PostForm, ReviewForm, CreateRoomForm, TransactionForm, ActivityForm, ConstraintForm, UpdateAccountForm

# Define the Blueprint
client_bp = Blueprint('client', __name__)

# --- HELPER FUNCTIONS ---
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

# --- ROUTES ---

@client_bp.route('/', methods=['GET', 'POST'])
@client_bp.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    form = PostForm()
    if form.validate_on_submit():
        filename = None
        if form.media.data:
            file = form.media.data
            filename = secure_filename(file.filename)
            # Access current_app to get root path
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_folder): os.makedirs(upload_folder)
            file.save(os.path.join(upload_folder, filename))

        post = Post(body=form.body.data, author=current_user, media_filename=filename)
        db.session.add(post)
        db.session.commit()
        return redirect(url_for('client.index'))
    
    posts = Post.query.order_by(Post.timestamp.desc()).all()
    avg_rating = func.coalesce(func.avg(Review.rating), 0).label('average_rating')
    suggestions = db.session.query(Location, avg_rating).outerjoin(Review, Location.id == Review.location_id).group_by(Location.id).order_by(avg_rating.desc()).limit(5).all() 
    return render_template('index.html', title='Home', form=form, posts=posts, suggestions=suggestions)

@client_bp.route('/profile/<username>')
@login_required
def profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(author=user).order_by(Post.timestamp.desc()).all()
    return render_template('profile.html', title='Profile', user=user, posts=posts)

@client_bp.route('/account', methods=['GET', 'POST'])
@login_required
def account():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        current_user.username = form.username.data
        current_user.email = form.email.data
        db.session.commit()
        flash('Account updated!', 'success')
        return redirect(url_for('client.account'))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
    return render_template('account.html', title='Account', form=form)

# --- MAP FEATURES ---
@client_bp.route('/map/search')
@login_required
def map_search():
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
            'url': url_for('client.location_detail', location_id=loc.id),
            'rating': float(rating)
        })
    
    return render_template('map.html', title='Map Search', 
                           query=query_name, query_type=query_type,
                           query_price=query_price, query_rating=query_rating,
                           locations_data=locations_data, default_lat=lat, default_lon=lon)

@client_bp.route('/location/<int:location_id>', methods=['GET', 'POST'])
@login_required
def location_detail(location_id):
    location = Location.query.get_or_404(location_id)
    form = ReviewForm()
    is_favorited = current_user.favorite_locations.filter(Location.id == location.id).count() > 0
    
    if form.validate_on_submit():
        review = Review(body=form.body.data, rating=int(form.rating.data), author=current_user, location=location)
        db.session.add(review)
        db.session.commit()
        return redirect(url_for('client.location_detail', location_id=location.id))
    
    reviews = Review.query.filter_by(location=location).order_by(Review.timestamp.desc()).all()
    return render_template('location_detail.html', title=location.name, location=location, form=form, reviews=reviews, is_favorited=is_favorited)

@client_bp.route('/location/favorite/<int:location_id>', methods=['POST'])
@login_required
def add_favorite(location_id):
    location = Location.query.get_or_404(location_id)
    if not current_user.favorite_locations.filter(Location.id == location.id).count() > 0:
        current_user.favorite_locations.append(location)
        db.session.commit()
        flash(f'Added {location.name} to favorites!', 'success')
    return redirect(url_for('client.location_detail', location_id=location_id))

# --- CHAT & FINANCE CLIENT FEATURES ---
@client_bp.route('/chat', methods=['GET', 'POST'])
@login_required
def chat():
    form = CreateRoomForm()
    if form.validate_on_submit():
        new_room = Room(name=form.name.data, description=form.description.data, creator=current_user)
        new_room.members.append(current_user)
        db.session.add(new_room)
        db.session.commit()
        return redirect(url_for('client.chat_room', room_name=new_room.name))

    all_rooms = Room.query.all()
    my_rooms = current_user.rooms.all()
    return render_template('chat_lobby.html', title='Chat Lobby', form=form, all_rooms=all_rooms, my_rooms=my_rooms)

@client_bp.route('/chat/<string:room_name>', methods=['GET'])
@login_required
def chat_room(room_name):
    room = Room.query.filter_by(name=room_name).first_or_404()
    
    if current_user not in room.members:
        room.members.append(current_user)
        db.session.commit()
        flash(f'Joined room: {room.name}', 'info')

    act_form = ActivityForm()
    cons_form = ConstraintForm()
    activities = Activity.query.filter_by(room_id=room.id).all()
    
    timeline_data = []
    for act in activities:
        timeline_data.append({'name': act.name, 'start': act.start_time, 'end': act.end_time})

    my_constraints = Constraint.query.filter_by(user_id=current_user.id, room_id=room.id).all()
    conflicts = check_conflicts(activities, my_constraints)

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

# Add other Activity/Finance POST routes here...
# (Simplified for brevity - assumes add_room_activity, add_room_constraint, add_room_transaction are moved here)