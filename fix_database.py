import sqlite3
import os

# Try to find the database file automatically
possible_files = ['instance/site.db', 'site.db', 'instance/database.db', 'database.db', 'app.db']
db_file = None

for f in possible_files:
    if os.path.exists(f):
        db_file = f
        break

if not db_file:
    print("❌ Could not find your database file. Please edit this script and set DB_FILE manually.")
else:
    print(f"✅ Found database at: {db_file}")
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Add the missing column
        print("Attempting to add 'password_hash' column...")
        cursor.execute("ALTER TABLE room ADD COLUMN password_hash VARCHAR(128)")
        
        conn.commit()
        conn.close()
        print("🎉 SUCCESS! Column 'password_hash' has been added.")
        print("You can now restart your Flask app.")
        
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("ℹ️ Column 'password_hash' already exists. You are good to go!")
        else:
            print(f"❌ Database Error: {e}")