from flask import Blueprint, render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, current_user, login_required
from app.extensions import db, oauth
from app.models import User, Post
from app.forms import LoginForm, RegisterForm, UpdateAccountForm
import secrets

auth_bp = Blueprint('auth', __name__)

# --- Standard Login Routes ---
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        # [MODIFIED] Check DB by Username, not Email
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
        # [MODIFIED] Auto-generate fake email to satisfy Database requirement
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
        return redirect(url_for('main.index'))
    # Redirect URI: http://127.0.0.1:5000/auth/callback
    redirect_uri = url_for('auth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/callback')
def google_callback():
    """Handles the return from Google."""
    try:
        token = oauth.google.authorize_access_token()
        resp = oauth.google.get('https://www.googleapis.com/oauth2/v3/userinfo')
        user_info = resp.json()
    except Exception as e:
        flash(f'Google authentication failed: {str(e)}', 'danger')
        return redirect(url_for('auth.login'))

    email = user_info.get('email')
    name = user_info.get('name')
    
    # 1. Check if user already exists (by Email)
    user = User.query.filter_by(email=email).first()

    if user:
        # User exists, log them in
        login_user(user)
        flash('Logged in successfully via Google!', 'success')
        return redirect(url_for('main.index'))
    else:
        # 2. User does not exist, create new account
        # Generate unique username based on Google name
        base_username = name.replace(" ", "")
        username = base_username
        if User.query.filter_by(username=username).first():
            username = f"{base_username}_{secrets.token_hex(3)}"
            
        # Create a random password since they use Google to login
        random_password = secrets.token_urlsafe(16)
        
        new_user = User(
            username=username, 
            email=email,  # We use the REAL Google email here
            password=random_password 
        )
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        flash('Account created via Google!', 'success')
        return redirect(url_for('main.index'))

# --- Account Routes ---

@auth_bp.route('/profile/<username>')
@login_required
def profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    posts = Post.query.filter_by(author=user).order_by(Post.timestamp.desc()).all()
    return render_template('profile.html', title='Profile', user=user, posts=posts)

@auth_bp.route('/account', methods=['GET', 'POST'])
@login_required
def account():
    form = UpdateAccountForm()
    if form.validate_on_submit():
        current_user.username = form.username.data
        current_user.email = form.email.data
        db.session.commit()
        flash('Account updated!', 'success')
        return redirect(url_for('auth.account'))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
    return render_template('account.html', title='Account', form=form)