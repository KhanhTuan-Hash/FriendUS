from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField, FloatField, IntegerField, SelectField, RadioField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, Optional, NumberRange
from flask_login import current_user
from app.models import User, Room

class RegisterForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email',
                        validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm Password',
                                     validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Sign Up')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('That username is taken. Please choose another.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('That email is already in use.')

class LoginForm(FlaskForm):
    email = StringField('Email',
                        validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class PostForm(FlaskForm):
    body = TextAreaField('What\'s on your mind?', validators=[DataRequired(), Length(min=1, max=140)])
    
    # Latitude and Longitude removed
    
    # Media field added
    media = FileField('Upload Image/Video', validators=[
        FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi'], 'Images and Videos only!')
    ])
    
    submit = SubmitField('Post')

class UpdateAccountForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email',
                        validators=[DataRequired(), Email()])
    submit = SubmitField('Update Account')

    def validate_username(self, username):
        if username.data != current_user.username:
            user = User.query.filter_by(username=username.data).first()
            if user:
                raise ValidationError('That username is taken. Please choose another.')

    def validate_email(self, email):
        if email.data != current_user.email:
            user = User.query.filter_by(email=email.data).first()
            if user:
                raise ValidationError('That email is already in use.')

class ReviewForm(FlaskForm):
    rating = SelectField('Rating', 
                         choices=[('5', '5 Stars'), ('4', '4 Stars'), ('3', '3 Stars'), ('2', '2 Stars'), ('1', '1 Star')], 
                         validators=[DataRequired()])
    body = TextAreaField('Your Review', validators=[DataRequired(), Length(min=10)])
    submit = SubmitField('Submit Review')

class CreateRoomForm(FlaskForm):
    name = StringField('Room Name', 
                         validators=[DataRequired(), Length(min=3, max=50)])
    description = TextAreaField('Description', 
                                validators=[Optional(), Length(max=200)])
    submit = SubmitField('Create Room')

    def validate_name(self, name):
        room = Room.query.filter_by(name=name.data).first()
        if room:
            raise ValidationError('That room name is taken. Please choose another.')

# --- FORM MỚI CHO TÀI CHÍNH ---
class TransactionForm(FlaskForm):
    amount = FloatField('Amount (VNĐ)', validators=[DataRequired()])
    description = StringField('Description', validators=[DataRequired()])
    
    # Loại giao dịch: Nợ hoặc Trả nợ
    type = RadioField('Transaction Type', choices=[
        ('debt', 'I Owe them (Ghi nợ)'), 
        ('repayment', 'I Paid them (Trả nợ)')
    ], default='debt', validators=[DataRequired()])
    
    # Chọn người nhận (Member) - Validate Optional vì có thể chọn Outside
    receiver = SelectField('Receiver (Member)', choices=[], coerce=int, validators=[Optional()])
    
    # Người lạ
    is_outside = BooleanField('Outside/Stranger?')
    outsider_name = StringField('Outsider Name')
    
    submit = SubmitField('Create Transaction')

class ActivityForm(FlaskForm):
    name = StringField('Activity Name', validators=[DataRequired()])
    location = StringField('Location')
    price = FloatField('Est. Price ($)', validators=[DataRequired()])
    start_time = StringField('Start Time (e.g. 09:00)') # Using string for simplicity
    end_time = StringField('End Time (e.g. 11:00)')
    rating = FloatField('Initial Rating (1-5)', validators=[Optional()])
    submit = SubmitField('Add Activity')

class ConstraintForm(FlaskForm):
    type = SelectField('Type', choices=[('price', 'Price'), ('time', 'Time'), ('location', 'Location')])
    intensity = RadioField('Intensity', choices=[('soft', 'Soft (!)'), ('rough', 'Rough (!!) - Hard Rule')], default='soft')
    
    # Simplified input: We assume Price is always "Less than" and Time is "After" for this demo
    value = StringField('Value (e.g. 25 for price, 08:00 for time)', validators=[DataRequired()])
    
    submit = SubmitField('Add Constraint')