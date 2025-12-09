from flask import Blueprint, render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, current_user, login_required
from app.extensions import db, oauth
from app.models import User, Post
from app.forms import LoginForm, RegisterForm, UpdateAccountForm
from app.utils import save_picture 
import secrets

auth_bp = Blueprint('auth', __name__)

# [NEW] Constants for Redirects
# This is where your React App lives. Change port if needed.
FRONTEND_URL = "http://localhost:5173" 

# --- Standard Login Routes ---
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and user.password == form.password.data:
            login_user(user, remember=form.remember.data)
            return redirect(url_for('main.index'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
            
    return render_template('login.html', title='Login', form=form)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = RegisterForm()
    if form.validate_on_submit():
        fake_email = f"{form.username.data}@friendus.local"
        
        user = User(
            username=form.username.data, 
            email=fake_email, 
            password=form.password.data
        )
        db.session.add(user)
        db.session.commit()
        
        flash(f'Account created for {form.username.data}!', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('register.html', title='Register', form=form)

@auth_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))

# --- Google OAuth Routes ---

@auth_bp.route('/google')
def google_login():
    """Redirects user to Google for authentication."""
    if current_user.is_authenticated:
        # If already logged in, send them back to React dashboard
        return redirect(f"{FRONTEND_URL}/dashboard")
        
    # Redirect URI: http://127.0.0.1:5000/auth/callback
    redirect_uri = url_for('auth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/callback')
def google_callback():
    """Handles the return from Google."""
    try:
        token = oauth.google.authorize_access_token()
        resp = oauth.google.get('userinfo')
        user_info = resp.json()
    except Exception as e:
        print(f"OAuth Error: {e}")
        # On failure, redirect to React Login with error param
        return redirect(f"{FRONTEND_URL}/login?error=auth_failed")

    email = user_info.get('email')
    name = user_info.get('name')
    
    # 1. Check if user already exists
    user = User.query.filter_by(email=email).first()

    if user:
        login_user(user)
    else:
        # 2. Create new account
        base_username = name.replace(" ", "")
        username = base_username
        if User.query.filter_by(username=username).first():
            username = f"{base_username}_{secrets.token_hex(3)}"
            
        random_password = secrets.token_urlsafe(16)
        
        new_user = User(
            username=username, 
            email=email,
            password=random_password 
        )
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)

    # [CRITICAL] Redirect to React Dashboard
    # This sets the session cookie in the browser for the frontend
    return redirect(f"{FRONTEND_URL}/dashboard")

# --- Account / Profile Routes ---
# (Kept unchanged from your upload)
@auth_bp.route('/profile/<string:username>', methods=['GET', 'POST'])
@login_required
def profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(author=user).order_by(Post.timestamp.desc()).all()
    
    form = UpdateAccountForm()
    
    if user == current_user:
        if form.validate_on_submit():
            if form.picture.data:
                picture_file = save_picture(form.picture.data)
                current_user.image_file = picture_file
            
            current_user.username = form.username.data
            db.session.commit()
            
            flash('Your account has been updated!', 'success')
            return redirect(url_for('auth.profile', username=current_user.username))
        
        elif request.method == 'GET':
            form.username.data = current_user.username
            form.email.data = current_user.email

    return render_template('profile.html', title='Profile', user=user, posts=posts, form=form)