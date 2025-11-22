import sqlite3
import os

# Path to your database
db_path = 'friendus.db'

if not os.path.exists(db_path):
    print(f"Error: Database {db_path} not found. Run app.py once to create it.")
else:
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # --- 1. Fix User Table (is_admin) ---
    try:
        print("Checking 'user' table for 'is_admin'...")
        cursor.execute("ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT 0")
        conn.commit()
        print("Success! Column 'is_admin' added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column 'is_admin' already exists. Skipping.")
        else:
            print(f"Error adding is_admin: {e}")

    # --- 2. Fix Post Table (media_filename) ---
    try:
        print("Checking 'post' table for 'media_filename'...")
        cursor.execute("ALTER TABLE post ADD COLUMN media_filename VARCHAR(100)")
        conn.commit()
        print("Success! Column 'media_filename' added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column 'media_filename' already exists. Skipping.")
        else:
            print(f"Error adding media_filename: {e}")

    conn.close()
    print("Database fix complete.")