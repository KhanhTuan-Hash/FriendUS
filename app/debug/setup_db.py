import sqlite3
from app import app, db

# 1. Create new tables (Activity, Constraint, Outsider)
print("--- Checking/Creating missing tables... ---")
with app.app_context():
    db.create_all()
    print("Tables checked.")

# 2. Manually add missing columns to existing tables
print("\n--- Updating existing tables... ---")
conn = sqlite3.connect('friendus.db')
cursor = conn.cursor()

# List of updates needed for the merged features
updates = [
    # Table Name,   Column Name,      Definition
    ('transaction', 'room_id',       'INTEGER REFERENCES room(id)'),
    ('transaction', 'outsider_id',   'INTEGER REFERENCES outsider(id)'),
    ('transaction', 'receiver_id',   'INTEGER REFERENCES user(id)'),
    ('post',        'media_filename','VARCHAR(100)') 
]

for table, col, definition in updates:
    try:
        print(f"Attempting to add '{col}' to '{table}'...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {definition}")
        print(f" -> Success: Added {col}")
    except sqlite3.OperationalError as e:
        # Ignore "duplicate column" errors
        if "duplicate" in str(e):
            print(f" -> Skipped: {col} already exists.")
        else:
            print(f" -> Note: {e}")

conn.commit()
conn.close()
print("\nDatabase update complete! You can now run app.py.")