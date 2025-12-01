import os
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from sqlalchemy import func
from app.extensions import db
from app.models import Post, Review, Location
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

        post = Post(body=form.body.data, author=current_user, media_filename=filename)
        db.session.add(post)
        db.session.commit()
        return redirect(url_for('main.index'))
    
    posts = Post.query.order_by(Post.timestamp.desc()).all()
    avg_rating = func.coalesce(func.avg(Review.rating), 0).label('average_rating')
    suggestions = db.session.query(Location, avg_rating).outerjoin(Review, Location.id == Review.location_id).group_by(Location.id).order_by(avg_rating.desc()).limit(5).all() 
    return render_template('index.html', title='Home', form=form, posts=posts, suggestions=suggestions)