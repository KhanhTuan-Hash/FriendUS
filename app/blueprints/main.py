import os
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from sqlalchemy import func, or_ # [NEW] Import để query OR cho tìm kiếm 
from app.extensions import db
from app.models import Post, Review, Location, User, FriendRequest
from app.forms import PostForm

main_bp = Blueprint('main', __name__)

@main_bp.route('/', methods=['GET', 'POST'])
@main_bp.route('/index', methods=['GET', 'POST'])
@login_required
def index():
    form = PostForm()
    if form.validate_on_submit():
        filename = None
        if form.media.data:
            file = form.media.data
            filename = secure_filename(file.filename)
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
            if not os.path.exists(upload_folder): os.makedirs(upload_folder)
            file.save(os.path.join(upload_folder, filename))

        # [UPDATED] Xử lý Tags (List -> String)
        tags_str = ''
        if form.tags.data:
            tags_str = ','.join(form.tags.data)

        # Tạo post với tags
        post = Post(
            body=form.body.data, 
            author=current_user, 
            media_filename=filename,
            tags=tags_str 
        )
        db.session.add(post)
        db.session.commit()
        return redirect(url_for('main.index'))
    
    posts = Post.query.order_by(Post.timestamp.desc()).all()
    avg_rating = func.coalesce(func.avg(Review.rating), 0).label('average_rating')
    suggestions = db.session.query(Location, avg_rating).outerjoin(Review, Location.id == Review.location_id).group_by(Location.id).order_by(avg_rating.desc()).limit(5).all() 
    return render_template('index.html', title='Home', form=form, posts=posts, suggestions=suggestions)

# --- FRIEND SYSTEM ROUTES ---

@main_bp.route('/friends', methods=['GET', 'POST'])
@login_required
def friends():
    # 1. Xử lý Tìm kiếm
    search_query = request.args.get('q')
    search_results = []
    if search_query:
        # Tìm User theo username hoặc email (trừ bản thân)
        search_results = User.query.filter(
            (User.username.ilike(f'%{search_query}%')) | (User.email.ilike(f'%{search_query}%')),
            User.id != current_user.id
        ).all()

    # 2. Lấy danh sách bạn bè & Lời mời
    my_friends = current_user.friends.all()
    pending_requests = current_user.received_requests
    
    return render_template('friends.html', 
                           title='My Friends', 
                           friends=my_friends, 
                           requests=pending_requests,
                           search_results=search_results,
                           search_query=search_query)

@main_bp.route('/friend/add/<int:user_id>')
@login_required
def send_friend_request(user_id):
    user = User.query.get_or_404(user_id)
    current_user.send_request(user)
    flash(f'Friend request sent to {user.username}!', 'success')
    return redirect(request.referrer or url_for('main.friends'))

@main_bp.route('/friend/accept/<int:req_id>')
@login_required
def accept_friend_request(req_id):
    current_user.accept_request(req_id)
    flash('Friend request accepted!', 'success')
    return redirect(url_for('main.friends'))

@main_bp.route('/friend/reject/<int:req_id>')
@login_required
def reject_friend_request(req_id):
    req = FriendRequest.query.get_or_404(req_id)
    if req.receiver_id == current_user.id:
        db.session.delete(req)
        db.session.commit()
        flash('Request declined.', 'info')
    return redirect(url_for('main.friends'))

@main_bp.route('/friend/unfriend/<int:user_id>')
@login_required
def unfriend(user_id):
    user = User.query.get_or_404(user_id)
    current_user.remove_friend(user)
    flash(f'You unfriended {user.username}.', 'info')
    return redirect(request.referrer or url_for('main.friends'))