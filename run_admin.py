from app import app, socketio, db, populate_db

if __name__ == '__main__':
    print("----------------------------------------------------------------")
    print("⚡ STARTING SERVER/ADMIN PROGRAM (MASTER KEY ENABLED) ⚡")
    print("Open: http://127.0.0.1:5001/admin/dashboard")
    print("----------------------------------------------------------------")
    
    # 1. Enable the "Master Key" config
    app.config['AUTO_ADMIN_MODE'] = True
    
    # 2. Ensure DB is ready
    with app.app_context():
        db.create_all()
        populate_db()

    # 3. Run on a different port (5001) to distinguish it
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)