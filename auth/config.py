import os

# Read secrets from environment variables. Do NOT commit secrets to source control.
# Example (PowerShell):
# $env:GOOGLE_CLIENT_ID='...'; $env:GOOGLE_CLIENT_SECRET='...'; $env:SECRET_KEY='...'

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
# A default development secret is provided but you should override it in production
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-me')