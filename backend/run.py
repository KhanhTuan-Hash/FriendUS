from app import create_app, socketio
import os
from dotenv import load_dotenv

load_dotenv()
# [CRITICAL FIX] Allow OAuth over HTTP (non-secure) for localhost
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = create_app()

if __name__ == '__main__':
    print("----------------------------------------------------------------")
    print("Server is running! Click the link below to open:")
    print("http://127.0.0.1:5000")
    print("----------------------------------------------------------------")
    # Use socketio.run instead of app.run
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)