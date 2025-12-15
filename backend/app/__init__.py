from flask import Flask
from flask_cors import CORS
from backend.config import Config
# [REMOVED] bootstrap import
from backend.app.extensions import db, login_manager, socketio, oauth
from backend.app.events import register_socketio_events

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app)

    # Allow React to talk to Flask
    CORS(app, 
         resources={r"/*": {"origins": "http://localhost:3000"}}, 
         supports_credentials=True)

    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax' 
    app.config['SESSION_COOKIE_SECURE'] = False

    # Initialize Extensions
    db.init_app(app)
    login_manager.init_app(app)
    # [REMOVED] bootstrap.init_app(app)  <-- DELETED
    socketio.init_app(app)
    oauth.init_app(app)

    # Register Google Provider
    CONF_URL = 'https://accounts.google.com/.well-known/openid-configuration'
    oauth.register(
        name='google',
        server_metadata_url=CONF_URL,
        api_base_url='https://www.googleapis.com/oauth2/v3/',
        client_id=app.config.get('GOOGLE_CLIENT_ID'),
        client_secret=app.config.get('GOOGLE_CLIENT_SECRET'),
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

    # Register Blueprints
    from backend.app.blueprints.main import main_bp
    from backend.app.blueprints.auth import auth_bp
    from backend.app.blueprints.map import map_bp
    from backend.app.blueprints.chat import chat_bp
    from backend.app.blueprints.planner import planner_bp
    from backend.app.blueprints.finance import finance_bp
    from backend.app.blueprints.weather import weather_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth') 
    app.register_blueprint(map_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(planner_bp, url_prefix='/api/planner')
    app.register_blueprint(finance_bp)
    app.register_blueprint(weather_bp, url_prefix='/api/weather')

    # Register Socket Events
    register_socketio_events(socketio)

    # --- Initialize AI assistant and attach to app ---
    try:
        # Import lazily so app can still start if dependencies missing
        from backend.ai_engine import VietmapAssistant
        model_path = app.config.get('AI_MODEL_PATH')
        print(f"⏳ Initializing VietmapAssistant (model_path={model_path})...")
        app.vietmap_assistant = VietmapAssistant(model_path=model_path)
        print("✅ VietmapAssistant initialized and attached to app")
    except Exception as e:
        app.vietmap_assistant = None
        print(f"⚠️ Could not initialize VietmapAssistant: {e}")

    # Define User Loader
    from backend.app.models import User, Room
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Create DB and Populate if empty
    with app.app_context():
        db.create_all()

    return app