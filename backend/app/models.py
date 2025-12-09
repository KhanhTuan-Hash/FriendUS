from datetime import datetime
from flask_login import UserMixin
from app.extensions import db

# --- ASSOCIATION TABLES ---

friendships = db.Table('friendships',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('friend_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)

room_members = db.Table('room_members',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('room_id', db.Integer, db.ForeignKey('room.id'), primary_key=True)
)

post_likes = db.Table('post_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('post_id', db.Integer, db.ForeignKey('post.id'), primary_key=True)
)

# --- CORE MODELS ---

class User(UserMixin, db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    
    # Auth Fields
    username = db.Column(db.String(50), unique=True, nullable=False) 
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=True) 
    
    # Profile Fields
    display_name = db.Column(db.String(100)) 
    phone = db.Column(db.String(20))         
    bio = db.Column(db.String(500))          
    location_label = db.Column(db.String(100)) 
    avatar = db.Column(db.String(255), default='default.jpg') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 

    # Status
    status = db.Column(db.String(20), default='offline') 
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    posts = db.relationship('Post', backref='author', lazy='dynamic')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')
    reviews = db.relationship('Review', backref='author', lazy='dynamic')
    
    # Friends
    friends = db.relationship('User', 
                              secondary=friendships,
                              primaryjoin=(friendships.c.user_id == id),
                              secondaryjoin=(friendships.c.friend_id == id),
                              backref=db.backref('friend_of', lazy='dynamic'), 
                              lazy='dynamic')

    saved_places = db.relationship('UserSavedPlace', back_populates='user', lazy='dynamic', cascade="all, delete-orphan")
    rooms = db.relationship('Room', secondary=room_members, back_populates='members')
    created_rooms = db.relationship('Room', back_populates='creator', lazy='dynamic')
    
    outsiders = db.relationship('Outsider', backref='creator', lazy='dynamic') 
    constraints = db.relationship('Constraint', backref='user', lazy='dynamic') 

    def __repr__(self):
        return f"<User {self.username}>"

class Room(db.Model):
    __tablename__ = 'room'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=True) 
    description = db.Column(db.String(200), nullable=True) 
    type = db.Column(db.String(20), default='group') 
    avatar = db.Column(db.String(50), default='👥') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    creator = db.relationship('User', back_populates='created_rooms')
    
    members = db.relationship('User', secondary=room_members, back_populates='rooms')
    
    # [FIXED] Consolidated Relationships
    messages = db.relationship('Message', backref='room_ref', lazy='dynamic', cascade="all, delete-orphan")
    activities = db.relationship('Activity', backref='room_ref', lazy='dynamic', cascade="all, delete-orphan")
    
    # This defines 'transactions' on Room AND 'room' on Transaction automatically via backref
    transactions = db.relationship('Transaction', backref='room', lazy='dynamic', cascade="all, delete-orphan")

class Message(db.Model):
    __tablename__ = 'message'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    # Alias for legacy support
    body = db.Column(db.Text, nullable=True) 
    
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    is_system = db.Column(db.Boolean, default=False)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    
    sender = db.relationship('User', backref='messages_sent')
    
    @property
    def author(self):
        return self.sender

    @author.setter
    def author(self, value):
        self.sender = value

# --- SOCIAL FEED ---

class Post(db.Model):
    __tablename__ = 'post'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    # Alias
    body = db.Column(db.Text, nullable=True)
    
    image_url = db.Column(db.String(255)) 
    media_filename = db.Column(db.String(100), nullable=True)
    location_name = db.Column(db.String(100)) 
    
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    likes = db.relationship('User', secondary=post_likes, backref='liked_posts')
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade="all, delete-orphan")

class Comment(db.Model):
    __tablename__ = 'comment'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

# --- MAPS & LOCATIONS ---

class Location(db.Model):
    __tablename__ = 'location'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50)) 
    type = db.Column(db.String(50), nullable=True)
    
    address = db.Column(db.String(255))
    description = db.Column(db.Text)
    
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    rating = db.Column(db.Float, default=0.0)
    image_url = db.Column(db.String(255))
    
    hours = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    website = db.Column(db.String(100), nullable=True)
    price_range = db.Column(db.Integer, nullable=True)
    
    saved_by = db.relationship('UserSavedPlace', back_populates='location')
    reviews = db.relationship('Review', backref='location', lazy='dynamic')

class Review(db.Model):
    __tablename__ = 'review'
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, default=5)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)

class UserSavedPlace(db.Model):
    __tablename__ = 'user_saved_place'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)
    
    notes = db.Column(db.Text) 
    is_visited = db.Column(db.Boolean, default=False)
    visited_date = db.Column(db.DateTime, nullable=True) 
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='saved_places')
    location = db.relationship('Location', back_populates='saved_by')

# --- TRIP PLANNER & FINANCE ---

class Activity(db.Model):
    __tablename__ = 'activity'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=True) 
    
    location = db.Column(db.String(100))
    description = db.Column(db.Text)
    
    date = db.Column(db.String(10)) 
    time = db.Column(db.String(10)) 
    start_time = db.Column(db.String(20)) 
    end_time = db.Column(db.String(20))
    rating = db.Column(db.Float, default=0.0)
    price = db.Column(db.Float, nullable=True)
    
    category = db.Column(db.String(50)) 
    cost_est = db.Column(db.String(50)) 
    duration = db.Column(db.String(50)) 
    
    completed = db.Column(db.Boolean, default=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)

class Outsider(db.Model):
    __tablename__ = 'outsider'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Transaction(db.Model):
    __tablename__ = 'transaction'
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), default='debt') 
    status = db.Column(db.String(20), default='pending')
    
    is_settled = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)
    
    # [FIXED] Only define columns ONCE
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    outsider_id = db.Column(db.Integer, db.ForeignKey('outsider.id'), nullable=True)
    
    # [FIXED] Removed conflicting relationship 'room'. It is handled by Room.transactions backref.
    
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_transactions')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_transactions')
    outsider = db.relationship('Outsider', backref='transactions')
    
    # [FIXED] Aliases for Frontend compatibility using Properties
    @property
    def payer_id(self): return self.sender_id
    
    @payer_id.setter
    def payer_id(self, value): self.sender_id = value

    @property
    def debtor_id(self): return self.receiver_id
    
    @debtor_id.setter
    def debtor_id(self, value): self.receiver_id = value
    
    @property
    def payer(self): return self.sender
    @property
    def debtor(self): return self.receiver

class Constraint(db.Model):
    __tablename__ = 'constraint'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False) 
    intensity = db.Column(db.String(10), nullable=False) 
    value = db.Column(db.String(50), nullable=False) 
    operator = db.Column(db.String(5), default="<") 
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)