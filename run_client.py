from app import app, socketio, db, populate_db

if __name__ == '__main__':
    print("----------------------------------------------------------------")
    print("STARTING CLIENT PROGRAM")
    print("Open: http://127.0.0.1:5000")
    print("----------------------------------------------------------------")
    
    # Ensure DB is ready
    with app.app_context():
        db.create_all()
        populate_db()

    # Run on default port 5000
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)