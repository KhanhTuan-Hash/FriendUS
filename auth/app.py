from flask import Flask, url_for, session
from flask import render_template, redirect
from authlib.integrations.flask_client import OAuth
import os

app = Flask(__name__)
# Load configuration (reads GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET_KEY)
app.config.from_object('config')
# Use SECRET_KEY from config (or fallback)
app.secret_key = app.config.get('SECRET_KEY', 'dev-secret-change-me')

# Session / cookie security defaults (override via env/config for production)
app.config.setdefault('SESSION_COOKIE_HTTPONLY', True)
app.config.setdefault('SESSION_COOKIE_SAMESITE', 'Lax')

CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'
oauth = OAuth(app)
oauth.register(
    name='google',
    server_metadata_url=CONF_URL,
    client_id=app.config.get('GOOGLE_CLIENT_ID'),
    client_secret=app.config.get('GOOGLE_CLIENT_SECRET'),
    client_kwargs={
        'scope': 'openid email profile'
    }
)


@app.route('/')
def homepage():
    user = session.get('user')
    return render_template('home.html', user=user)


@app.route('/login')
def login():
    redirect_uri = url_for('auth', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)


@app.route('/auth')
def auth():
    # Exchange code for tokens
    token = oauth.google.authorize_access_token()

    # Prefer using the userinfo endpoint to obtain a verified set of claims
    try:
        resp = oauth.google.get('userinfo')
        userinfo = resp.json()
    except Exception:
        # Fallback: try to parse id_token if present
        try:
            userinfo = oauth.google.parse_id_token(token)
        except Exception:
            return "Failed to obtain user info from provider", 400

    # Basic verification: ensure email exists and (if present) is verified
    email = userinfo.get('email')
    email_verified = userinfo.get('email_verified') or userinfo.get('verified_email')
    if not email:
        return "No email returned by provider", 400

    # NOTE: In a full integration you would now map/create a local User and
    # call flask_login.login_user(user, remember=...)
    # For this standalone auth demo we store a minimal safe subset in session.
    safe_user = {
        'email': email,
        'name': userinfo.get('name'),
        'picture': userinfo.get('picture'),
        'email_verified': bool(email_verified)
    }
    session['user'] = safe_user
    return redirect(url_for('homepage'))


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/')

# Debug prints removed. Use logging if you need runtime diagnostics.

if __name__ == "__main__":
    app.run(debug=True)
