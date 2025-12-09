import os
from app import create_app
from app.extensions import db
from app.models import User, Location, Room, Activity, Transaction, Post, Message, Constraint
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

# Initialize the Flask App Context
app = create_app()

def seed():
    with app.app_context():
        print("🗑️  Cleaning old database...")
        db.drop_all()
        db.create_all()

        print("👤 Creating Users...")
        # 1. Create a Demo User (matches the one you might use)
        password_hash = "password" # In real app use generate_password_hash("password")
        # Note: In your logic you store plain text or hash? 
        # Checking auth.py: user.password == form.password.data. 
        # It seems you are using PLAIN TEXT for now. I will stick to plain text to make login easy.
        
        user1 = User(username="demo_user", email="demo@friendus.local", password="password", image_file="default.jpg")
        user2 = User(username="sarah_travels", email="sarah@test.com", password="password", image_file="default.jpg")
        user3 = User(username="mike_foodie", email="mike@test.com", password="password", image_file="default.jpg")
        
        db.session.add_all([user1, user2, user3])
        db.session.commit()

        print("📍 Creating Vietnam Locations...")
        loc1 = Location(
            name="Ha Long Bay",
            description="Emerald waters and thousands of towering limestone islands topped by rainforests.",
            latitude=20.9101, longitude=107.1839,
            type="Nature", price_range=2,
            hours="08:00 - 18:00", phone="0203 123 456"
        )
        loc2 = Location(
            name="Hoi An Ancient Town",
            description="A well-preserved South-East Asian trading port dating from the 15th to the 19th century.",
            latitude=15.8801, longitude=108.3380,
            type="Culture", price_range=1,
            hours="All Day", phone="0235 987 654"
        )
        loc3 = Location(
            name="Bitexco Financial Tower",
            description="Iconic skyscraper in Ho Chi Minh City with a sky deck offering 360-degree views.",
            latitude=10.7716, longitude=106.7044,
            type="City", price_range=3,
            hours="09:00 - 21:00", phone="028 3915 6156"
        )
        db.session.add_all([loc1, loc2, loc3])
        db.session.commit()

        print("💬 Creating Chat Rooms...")
        # General Room
        room_gen = Room(name="general", description="Official FriendUS General Chat", creator=user1)
        # Specific Trip Room
        room_trip = Room(name="Da Nang 2025", description="Summer Trip Planning 🏖️", creator=user1)
        
        # Add members
        room_trip.members.append(user1)
        room_trip.members.append(user2)
        room_trip.members.append(user3)
        
        db.session.add_all([room_gen, room_trip])
        db.session.commit()

        print("📅 Creating Itinerary (Activities)...")
        act1 = Activity(
            name="Morning Coffee at Cong Caphe", location="Bach Dang Street",
            price=5.0, start_time="08:00", end_time="09:00",
            room=room_trip
        )
        act2 = Activity(
            name="Visit Dragon Bridge", location="Dragon Bridge, Da Nang",
            price=0.0, start_time="21:00", end_time="21:30",
            room=room_trip
        )
        db.session.add_all([act1, act2])

        print("💰 Creating Expenses (Transactions)...")
        # User 1 paid for dinner, User 2 owes them
        trans1 = Transaction(
            amount=500000, description="Seafood Dinner", type="debt",
            sender=user1, receiver=user2, room=room_trip,
            status="pending"
        )
        # User 3 paid for taxi, User 1 owes them
        trans2 = Transaction(
            amount=100000, description="Taxi from Airport", type="debt",
            sender=user3, receiver=user1, room=room_trip,
            status="pending"
        )
        db.session.add_all([trans1, trans2])

        print("📝 Creating Social Posts...")
        post1 = Post(body="Just arrived in Vietnam! So excited! 🇻🇳", author=user1)
        post2 = Post(body="Does anyone know a good Banh Mi spot in District 1?", author=user2)
        db.session.add_all([post1, post2])

        db.session.commit()
        print("✅ Database Seeded Successfully! (friendus.db created)")

if __name__ == "__main__":
    seed()