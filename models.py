from ext import db
from flask_login import UserMixin
from datetime import datetime

# --- BẢNG QUAN HỆ MỚI CHO "YÊU THÍCH" ---
user_favorites = db.Table('user_favorites',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('location_id', db.Integer, db.ForeignKey('location.id'), primary_key=True)
)

# --- Bảng quan hệ cho Thành viên phòng chat ---
room_members = db.Table('room_members',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('room_id', db.Integer, db.ForeignKey('room.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False) 
    
    # --- [NEW] Admin Flag ---
    # Set this to True manually in DB or via a secret registration code
    is_admin = db.Column(db.Boolean, default=False)

    # Relationships
    posts = db.relationship('Post', backref='author', lazy=True)
    reviews = db.relationship('Review', backref='author', lazy=True)
    messages = db.relationship('Message', backref='author', lazy=True)
    
    rooms = db.relationship('Room', secondary=room_members,
                            back_populates='members', lazy='dynamic')
    
    created_rooms = db.relationship('Room', back_populates='creator', lazy='dynamic')

    favorite_locations = db.relationship('Location', secondary=user_favorites,
                                         back_populates='favorited_by', lazy='dynamic')
    
    # Finance relationships
    outsiders = db.relationship('Outsider', backref='creator', lazy=True)
    sent_transactions = db.relationship('Transaction', foreign_keys='Transaction.sender_id', backref='sender', lazy=True)
    received_transactions = db.relationship('Transaction', foreign_keys='Transaction.receiver_id', backref='receiver', lazy=True)
    
    # Constraint relationship
    # Note: Using 'constraints' backref in Constraint model, so we don't need it here explicitly unless back_populates is used
    
    def __repr__(self):
        return f"User('{self.username}', '{self.email}', Admin={self.is_admin})"

class Post(db.Model):
    media_filename = db.Column(db.String(100), nullable=True)
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
    
    type = db.Column(db.String(50), nullable=True, index=True)
    price_range = db.Column(db.Integer, nullable=True)
    
    reviews = db.relationship('Review', backref='location', lazy=True)
    favorited_by = db.relationship('User', secondary=user_favorites,
                                   back_populates='favorite_locations', lazy='dynamic')

    def __repr__(self):
        return f"Location('{self.name}')"

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False, default=5)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)

    def __repr__(self):
        return f"Review('{self.body}', {self.rating})"

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    creator = db.relationship('User', back_populates='created_rooms')
    members = db.relationship('User', secondary=room_members,
                              back_populates='rooms', lazy='dynamic')
    
    # Relationships for other modules
    # transactions relationship is defined in Transaction model via backref 'room'
    # activities relationship is defined in Activity model via backref 'room'

    def __repr__(self):
        return f"Room('{self.name}')"

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    room = db.Column(db.String(50), nullable=False) 
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"Message('{self.body}', '{self.author.username}')"

class Outsider(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"<Outsider {self.name}>"

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(20), default='debt') 
    status = db.Column(db.String(20), default='pending') 

    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    outsider_id = db.Column(db.Integer, db.ForeignKey('outsider.id'), nullable=True)

    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=True)
    room = db.relationship('Room', backref='transactions')

    outsider = db.relationship('Outsider', backref='transactions')

    def __repr__(self):
        return f"<Transaction {self.amount} ({self.type})>"
    
class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100)) 
    price = db.Column(db.Float, nullable=False, default=0.0)
    start_time = db.Column(db.String(20)) 
    end_time = db.Column(db.String(20))
    rating = db.Column(db.Float, default=0.0)
    
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)

    def __repr__(self):
        return f"<Activity {self.name}>"

class Constraint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False) 
    intensity = db.Column(db.String(10), nullable=False) 
    value = db.Column(db.String(50), nullable=False) 
    operator = db.Column(db.String(5), default="<") 
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    
    user = db.relationship('User', backref='constraints')

    def __repr__(self):
        return f"<Constraint {self.type} {self.intensity}>"