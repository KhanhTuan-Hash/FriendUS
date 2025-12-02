from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import current_user, login_required
from sqlalchemy import func
import requests  # <--- NEW: Make sure to pip install requests
from app.extensions import db
from app.models import Location, Review
from app.forms import ReviewForm

map_bp = Blueprint('map', __name__)

@map_bp.route('/map')
@login_required
def map():
    return redirect(url_for('map.map_search'))

@map_bp.route('/map/search')
@login_required
def map_search():
    # We still keep this to load saved locations from your database
    query_name = request.args.get('query')
    query_type = request.args.get('type')
    
    # Basic DB query for saved pins
    query = Location.query
    if query_name: query = query.filter(Location.name.ilike(f'%{query_name}%'))
    if query_type: query = query.filter(Location.type == query_type)

    locations_data = []
    for loc in query.all():
        # Calc rating manually or via query if needed
        locations_data.append({
            'id': loc.id, 'name': loc.name, 'desc': loc.description,
            'lat': loc.latitude, 'lon': loc.longitude,
            'url': url_for('map.location_detail', location_id=loc.id),
            'rating': 5.0 # Placeholder or calc logic
        })
    
    # We pass the key only for the map tiles, but search is now handled by backend routes
    vietmap_api_key = current_app.config.get('VIETMAP_API_KEY', '')

    return render_template('map.html', title='Map Search', 
                           locations_data=locations_data, 
                           vietmap_api_key=vietmap_api_key)

# --- NEW: Proxy Routes for VietMap API ---

@map_bp.route('/map/api/search')
@login_required
def api_search():
    """Proxies the Autocomplete Search to VietMap"""
    query = request.args.get('query', '')
    api_key = current_app.config.get('VIETMAP_API_KEY', '')
    
    if not query:
        return jsonify([])

    # Official Autocomplete v3 URL
    url = "https://maps.vietmap.vn/api/autocomplete/v3"
    params = {'apikey': api_key, 'text': query}
    
    try:
        resp = requests.get(url, params=params)
        return jsonify(resp.json())
    except Exception as e:
        print(f"API Error: {e}")
        return jsonify([])

@map_bp.route('/map/api/reverse')
@login_required
def api_reverse():
    """Proxies the Reverse Geocoding to VietMap"""
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = current_app.config.get('VIETMAP_API_KEY', '')

    if not lat or not lon:
        return jsonify([])

    # Official Reverse v3 URL
    url = "https://maps.vietmap.vn/api/reverse/v3"
    params = {'apikey': api_key, 'lat': lat, 'lng': lon}
    
    try:
        resp = requests.get(url, params=params)
        return jsonify(resp.json())
    except Exception as e:
        print(f"API Error: {e}")
        return jsonify([])

# --- Existing Routes (Keep these) ---

@map_bp.route('/location/<int:location_id>', methods=['GET', 'POST'])
@login_required
def location_detail(location_id):
    location = Location.query.get_or_404(location_id)
    form = ReviewForm()
    is_favorited = current_user.favorite_locations.filter(Location.id == location.id).count() > 0
    
    if form.validate_on_submit():
        review = Review(body=form.body.data, rating=int(form.rating.data), author=current_user, location=location)
        db.session.add(review)
        db.session.commit()
        return redirect(url_for('map.location_detail', location_id=location.id))
    
    reviews = Review.query.filter_by(location=location).order_by(Review.timestamp.desc()).all()
    return render_template('location_detail.html', title=location.name, location=location, form=form, reviews=reviews, is_favorited=is_favorited)