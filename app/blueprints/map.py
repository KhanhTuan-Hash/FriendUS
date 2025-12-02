from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import current_user, login_required
from sqlalchemy import func
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
    query_name = request.args.get('query')
    query_type = request.args.get('type')
    query_price = request.args.get('price', type=int)
    query_rating = request.args.get('rating', type=int)
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    avg_rating = func.coalesce(func.avg(Review.rating), 0).label('average_rating')
    query = db.session.query(Location, avg_rating).outerjoin(Review, Location.id == Review.location_id).group_by(Location.id)

    if query_name: query = query.filter(Location.name.ilike(f'%{query_name}%'))
    if query_type: query = query.filter(Location.type == query_type)
    if query_price: query = query.filter(Location.price_range == query_price)
    if query_rating: query = query.having(avg_rating >= query_rating)

    locations_data = []
    for loc, rating in query.all():
        locations_data.append({
            'id': loc.id, 'name': loc.name, 'desc': loc.description,
            'lat': loc.latitude, 'lon': loc.longitude,
            'url': url_for('map.location_detail', location_id=loc.id),
            'rating': float(rating)
        })
    
    # Ensure you have VIETMAP_API_KEY in your .env or config.py
    vietmap_api_key = current_app.config.get('VIETMAP_API_KEY', '')
    
    # DEBUG: Uncomment this line to force the key if your .env file isn't working yet
    # vietmap_api_key = "YOUR_REAL_API_KEY_HERE"

    return render_template('map.html', title='Map Search', 
                           query=query_name, query_type=query_type,
                           query_price=query_price, query_rating=query_rating,
                           locations_data=locations_data, default_lat=lat, default_lon=lon,
                           vietmap_api_key=vietmap_api_key)

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
    existing = Location.query.filter(
        Location.latitude.between(data['lat'] - 0.0001, data['lat'] + 0.0001),
        Location.longitude.between(data['lon'] - 0.0001, data['lon'] + 0.0001)
    ).first()
    
    if existing:
        return jsonify({'url': url_for('map.location_detail', location_id=existing.id)})

    new_loc = Location(
        name=data['name'] if data['name'] else "Dropped Pin",
        description=f"Address: {data['address']}",
        latitude=data['lat'],
        longitude=data['lon'],
        type="Custom",
        price_range=0
    )
    
    db.session.add(new_loc)
    db.session.commit()
    return jsonify({'url': url_for('map.location_detail', location_id=new_loc.id)})

@map_bp.route('/location/favorite/<int:location_id>', methods=['POST'])
@login_required
def add_favorite(location_id):
    location = Location.query.get_or_404(location_id)
    if not current_user.favorite_locations.filter(Location.id == location.id).count() > 0:
        current_user.favorite_locations.append(location)
        db.session.commit()
        flash(f'Added {location.name} to favorites!', 'success')
    return redirect(url_for('map.location_detail', location_id=location_id))

@map_bp.route('/location/unfavorite/<int:location_id>', methods=['POST'])
@login_required
def remove_favorite(location_id):
    location = Location.query.get_or_404(location_id)
    if current_user.favorite_locations.filter(Location.id == location.id).count() > 0:
        current_user.favorite_locations.remove(location)
        db.session.commit()
        flash(f'Removed {location.name} from favorites.', 'info')
    return redirect(url_for('map.location_detail', location_id=location_id))