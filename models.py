from ext import db
from flask_login import UserMixin
from datetime import datetime

# --- Association Table for Users and Rooms ---
# This links users to the rooms they are members of
room_members = db.Table('room_members',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('room_id', db.Integer, db.ForeignKey('room.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False) 
    
    # Relationships
    posts = db.relationship('Post', backref='author', lazy=True)
    reviews = db.relationship('Review', backref='author', lazy=True)
    messages = db.relationship('Message', backref='author', lazy=True)
    
    # Relationship to rooms user is a member of
    rooms = db.relationship('Room', secondary=room_members,
                            back_populates='members', lazy='dynamic')
    
    # --- NEW: Add relationship for created rooms ---
    created_rooms = db.relationship('Room', back_populates='creator', lazy='dynamic')

    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(140), nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    def __repr__(self):
        return f"Post('{self.body}')"

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    hours = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    website = db.Column(db.String(100), nullable=True)
    
    # Relationship
    reviews = db.relationship('Review', backref='location', lazy=True)

    def __repr__(self):
        return f"Location('{self.name}')"

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False, default=5)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)

    def __repr__(self):
        return f"Review('{self.body}', {self.rating})"

# --- NEW MODEL FOR CHAT ROOMS ---
class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=True)
    
    # --- NEW: Link to the user who created the room ---
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    creator = db.relationship('User', back_populates='created_rooms')
    
    # Relationship to members
    members = db.relationship('User', secondary=room_members,
                              back_populates='rooms', lazy='dynamic')

    def __repr__(self):
        return f"Room('{self.name}')"

# --- NEW MODEL FOR CHAT HISTORY ---
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    
    # We use the *room name* as the key
    room = db.Column(db.String(50), nullable=False) 
    
    # Foreign Key to User
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"Message('{self.body}', '{self.author.username}')"