from ext import db
from datetime import datetime
from enum import Enum


class PublicChatStatusEnum(Enum):
    ACTIVE = 'active'
    ENDED = 'ended'
    CANCELLED = 'cancelled'


class PublicChatMemberStatusEnum(Enum):
    JOINED = 'joined'
    PENDING = 'pending'
    REJECTED = 'rejected'
    LEFT = 'left'


class UserChatActionEnum(Enum):
    JOINED = 'joined'
    REJECTED = 'rejected'
    LEFT = 'left'


class PublicChat(db.Model):
    __tablename__ = 'public_chat'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    creator = db.relationship('User', backref='created_public_chats', foreign_keys=[creator_id])
    
    is_public = db.Column(db.Boolean, default=True)
    is_anonymous = db.Column(db.Boolean, default=True)
    
    location_name = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    scheduled_date = db.Column(db.DateTime, nullable=False)
    scheduled_end_time = db.Column(db.DateTime, nullable=False)
    
    status = db.Column(db.Enum(PublicChatStatusEnum), default=PublicChatStatusEnum.ACTIVE)
    max_members = db.Column(db.Integer, default=5)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    members = db.relationship('PublicChatMember', backref='public_chat', lazy=True, cascade='all, delete-orphan')
    summary = db.relationship('PublicChatSummary', uselist=False, backref='public_chat', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"PublicChat('{self.name}', creator={self.creator_id}, status={self.status.value})"
    
    @property
    def member_count(self):
        return db.session.query(PublicChatMember).filter_by(
            public_chat_id=self.id,
            status=PublicChatMemberStatusEnum.JOINED
        ).count()
    
    @property
    def is_ended(self):
        return datetime.utcnow() > self.scheduled_end_time or self.status == PublicChatStatusEnum.ENDED
    
    def mark_as_ended(self):
        self.status = PublicChatStatusEnum.ENDED
        db.session.commit()


class UserPreference(db.Model):
    __tablename__ = 'user_preference'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref='preferences', foreign_keys=[user_id])
    
    preference_type = db.Column(db.String(100), nullable=False)
    weight = db.Column(db.Float, default=0.5)
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"UserPreference(user={self.user_id}, type={self.preference_type}, weight={self.weight})"


class PublicChatSummary(db.Model):
    __tablename__ = 'public_chat_summary'
    
    id = db.Column(db.Integer, primary_key=True)
    public_chat_id = db.Column(db.Integer, db.ForeignKey('public_chat.id'), nullable=False)
    
    summary_text = db.Column(db.Text, nullable=True)
    key_topics = db.Column(db.String(500), nullable=True)
    
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"PublicChatSummary(chat={self.public_chat_id}, topics={self.key_topics})"
    
    @property
    def topics_list(self):
        if not self.key_topics:
            return []
        return [t.strip() for t in self.key_topics.split(',')]


class PublicChatMember(db.Model):
    __tablename__ = 'public_chat_member'
    
    id = db.Column(db.Integer, primary_key=True)
    public_chat_id = db.Column(db.Integer, db.ForeignKey('public_chat.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref='public_chat_memberships', foreign_keys=[user_id])
    
    is_anonymous = db.Column(db.Boolean, default=True)
    status = db.Column(db.Enum(PublicChatMemberStatusEnum), default=PublicChatMemberStatusEnum.PENDING)
    
    joined_at = db.Column(db.DateTime, nullable=True)
    revealed_at = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f"PublicChatMember(chat={self.public_chat_id}, user={self.user_id}, status={self.status.value})"
    
    @property
    def is_revealed(self):
        return self.revealed_at is not None
    
    def reveal_identity(self):
        if not self.is_revealed:
            self.revealed_at = datetime.utcnow()
            self.is_anonymous = False
            db.session.commit()
            return True
        return False


class UserChatRequest(db.Model):
    __tablename__ = 'user_chat_request'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref='chat_requests', foreign_keys=[user_id])
    public_chat_id = db.Column(db.Integer, db.ForeignKey('public_chat.id'), nullable=False)
    public_chat = db.relationship('PublicChat', backref='user_requests', foreign_keys=[public_chat_id])
    
    action = db.Column(db.Enum(UserChatActionEnum), nullable=False)
    reason = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"UserChatRequest(user={self.user_id}, chat={self.public_chat_id}, action={self.action.value})"
