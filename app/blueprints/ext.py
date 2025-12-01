from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

# Create extension instances
db = SQLAlchemy()
login_manager = LoginManager()

# Configure login manager
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'