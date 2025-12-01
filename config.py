import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-very-secret-key-that-you-should-change'
    BASEDIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASEDIR, 'friendus.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False