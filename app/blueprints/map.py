from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import current_user, login_required
import requests
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
    saved_locations = Location.query.all()
    locations_data = []
    for loc in saved_locations:
        locations_data.append({
            'id': loc.id, 
            'name': loc.name, 
            'desc': loc.description,
            'lat': loc.latitude, 
            'lon': loc.longitude,
            'url': url_for('map.location_detail', location_id=loc.id),
            'rating': 5.0 
        })
    
    vietmap_api_key = current_app.config.get('VIETMAP_API_KEY', '')
    return render_template('map.html', title='Map', 
                           locations_data=locations_data, 
                           vietmap_api_key=vietmap_api_key)

# --- HELPER: REAL BROWSER HEADERS (CRITICAL FOR SEARCH) ---
def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://maps.vietmap.vn/' # Spoof referer to look authorized
    }

# --- PROXY ROUTES ---

@map_bp.route('/map/api/search')
@login_required
def api_search():
    query = request.args.get('query', '')
    api_key = current_app.config.get('VIETMAP_API_KEY', '')
    
    if not query: return jsonify([])

    url = "https://maps.vietmap.vn/api/autocomplete/v3"
    params = {'apikey': api_key, 'text': query}
    
    try:
        # Use headers to bypass firewall
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        
        # Debugging: If it fails, print the raw text to see why
        if resp.status_code != 200:
            print(f"API Error {resp.status_code}: {resp.text}")
            return jsonify([])

        return jsonify(resp.json())
    except Exception as e:
        print(f"Search Exception: {e}")
        return jsonify([])

@map_bp.route('/map/api/reverse')
@login_required
def api_reverse():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = current_app.config.get('VIETMAP_API_KEY', '')

    if not lat or not lon: return jsonify([])

    url = "https://maps.vietmap.vn/api/reverse/v3"
    params = {'apikey': api_key, 'lat': lat, 'lng': lon}
    
    try:
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        return jsonify(resp.json())
    except Exception as e:
        print(f"Reverse Exception: {e}")
        return jsonify([])

# --- EXISTING ROUTES (Keep as is) ---
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

@map_bp.route('/api/create_location_on_click', methods=['POST'])
@login_required
def create_location_on_click():
    data = request.json
    # Logic to save to DB (optional usage)
    new_loc = Location(
        name=data['name'] or "Dropped Pin", description=f"Address: {data['address']}",
        latitude=data['lat'], longitude=data['lon'], type="Custom", price_range=0
    )
    db.session.add(new_loc)
    db.session.commit()
    return jsonify({'url': url_for('map.location_detail', location_id=new_loc.id)})