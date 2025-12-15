from backend.app import create_app, socketio
import os
from dotenv import load_dotenv

load_dotenv()
# [CRITICAL FIX] Allow OAuth over HTTP (non-secure) for localhost
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = create_app()

# Log AI assistant status if available
try:
    assistant = getattr(app, 'vietmap_assistant', None)
    if assistant:
        print("✅ VietmapAssistant is loaded and ready.")
    else:
        print("⚠️ VietmapAssistant is not initialized. Some AI routes may be unavailable.")
except Exception as e:
    print(f"⚠️ Error checking VietmapAssistant status: {e}")

if __name__ == '__main__':
    print("----------------------------------------------------------------")
    print("Server is running! Click the link below to open:")
    print("http://127.0.0.1:5000")
    print("----------------------------------------------------------------")
    # Use socketio.run instead of app.run
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)