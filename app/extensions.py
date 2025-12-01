from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bootstrap import Bootstrap5
from flask_socketio import SocketIO

# Initialize extensions (detached from the app)
db = SQLAlchemy()
login_manager = LoginManager()
bootstrap = Bootstrap5()
socketio = SocketIO()

# Configuration for login
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'