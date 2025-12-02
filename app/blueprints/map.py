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
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    
    query = db.session.query(Location)
    if query_name: query = query.filter(Location.name.ilike(f'%{query_name}%'))
    if query_type: query = query.filter(Location.type == query_type)

    locations_data = []
    for loc in query.all():
        locations_data.append({
            'id': loc.id, 'name': loc.name, 'lat': loc.latitude, 'lon': loc.longitude,
            'url': url_for('map.location_detail', location_id=loc.id)
        })
    
    vietmap_api_key = current_app.config.get('VIETMAP_API_KEY', '')

    # We pass full_width=True to the layout to disable the container wrapper
    return render_template('map.html', title='Map', 
                           locations_data=locations_data, 
                           default_lat=lat, default_lon=lon,
                           vietmap_api_key=vietmap_api_key,
                           full_width=True)

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
    new_loc = Location(
        name=data.get('name', "Dropped Pin"),
        description=f"Address: {data.get('address')}",
        latitude=data['lat'], longitude=data['lon'],
        type="Custom", price_range=0
    )
    db.session.add(new_loc)
    db.session.commit()
    return jsonify({'url': url_for('map.location_detail', location_id=new_loc.id)})

@map_bp.route('/location/favorite/<int:location_id>', methods=['POST'])
@login_required
def add_favorite(location_id):
    loc = Location.query.get_or_404(location_id)
    if loc not in current_user.favorite_locations:
        current_user.favorite_locations.append(loc)
        db.session.commit()
    return redirect(url_for('map.location_detail', location_id=location_id))

@map_bp.route('/location/unfavorite/<int:location_id>', methods=['POST'])
@login_required
def remove_favorite(location_id):
    loc = Location.query.get_or_404(location_id)
    if loc in current_user.favorite_locations:
        current_user.favorite_locations.remove(loc)
        db.session.commit()
    return redirect(url_for('map.location_detail', location_id=location_id))