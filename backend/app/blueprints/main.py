# File: backend/app/blueprints/main.py
from flask import Blueprint, jsonify, current_app, url_for, request
from backend.app.models import Post, Review, Location
from backend.app.extensions import db
from sqlalchemy import func
import os
from werkzeug.utils import secure_filename

main_bp = Blueprint('main', __name__)

# --- ROUTE TRANG CHỦ BACKEND (Sửa lỗi crash tại đây) ---
@main_bp.route('/')
def index():
    # Thay vì render_template('index.html'), ta trả về JSON
    return jsonify({
        "status": "success",
        "message": "Đây là Backend API Server. Vui lòng truy cập trang web tại http://localhost:5173",
        "service": "FriendUS API"
    })

# --- API LẤY DATA CHO REACT ---
@main_bp.route('/api/feed', methods=['GET'])
def get_feed():
    try:
        posts = Post.query.order_by(Post.timestamp.desc()).all()
        posts_data = [{
            'id': p.id,
            'body': p.body,
            'timestamp': p.timestamp.isoformat() if p.timestamp else None,
            'media_url': url_for('static', filename='uploads/' + p.media_filename, _external=True) if p.media_filename else None,
            'author': {'username': p.author.username, 'avatar': '👤'} if p.author else {'username': 'Anonymous', 'avatar': '👤'}
        } for p in posts]

        # Logic lấy suggestions (giữ nguyên logic của bạn)
        avg_rating = func.coalesce(func.avg(Review.rating), 0).label('average_rating')
        suggestions = db.session.query(Location, avg_rating)\
            .outerjoin(Review, Location.id == Review.location_id)\
            .group_by(Location.id).order_by(avg_rating.desc()).limit(5).all()
            
        suggestions_data = [{'id': loc.id, 'name': loc.name, 'rating': round(r, 1)} for loc, r in suggestions]

        return jsonify({'posts': posts_data, 'suggestions': suggestions_data})
    except Exception as e:
        print(f"Lỗi: {e}")
        return jsonify({'posts': [], 'suggestions': []}) # Trả về rỗng để không crash app

# --- API TẠO BÀI VIẾT ---
@main_bp.route('/api/posts', methods=['POST'])
def create_post():
    try:
        body = request.form.get('body', '')
        file = request.files.get('media')
        filename = None
        
        if file:
            filename = secure_filename(file.filename)
            upload_path = os.path.join(current_app.root_path, 'static', 'uploads')
            os.makedirs(upload_path, exist_ok=True)
            file.save(os.path.join(upload_path, filename))

        # Lưu DB (Mô phỏng user ID 1 nếu chưa login)
        # new_post = Post(body=body, media_filename=filename, author_id=1)
        # db.session.add(new_post)
        # db.session.commit()
        
        # Trả về dữ liệu giả lập để React hiển thị ngay
        return jsonify({
            'message': 'Success',
            'post': {
                'id': 999,
                'body': body,
                'timestamp': 'Just now',
                'media_url': url_for('static', filename='uploads/' + filename, _external=True) if filename else None,
                'author': {'username': 'You', 'avatar': '👤'}
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500