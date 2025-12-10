from flask import Blueprint, request, jsonify, current_app
import requests

# Khởi tạo Blueprint
map_bp = Blueprint('map', __name__)

# --- HELPER: HEADERS ---
def get_headers():
    return {
        'User-Agent': 'FriendUS-App/1.0',
        'Accept': 'application/json'
    }

# ==============================================================================
# 1. API CẤU HÌNH (Lấy Key hiển thị bản đồ)
# ==============================================================================
@map_bp.route('/map/api/config', methods=['GET'])
def api_config():
    """
    [PUBLIC] Trả về Tile Key để Frontend hiển thị bản đồ VietMap.
    """
    # Lấy key từ .env thông qua config của Flask
    tile_key = current_app.config.get('VIETMAP_TILE_KEY', '')
    
    if not tile_key:
        print("WARNING: VIETMAP_TILE_KEY chưa được cấu hình trong .env")
        
    return jsonify({'tile_key': tile_key})

# ==============================================================================
# 2. API TÌM KIẾM (Autocomplete)
# ==============================================================================
@map_bp.route('/map/api/search', methods=['GET'])
def api_search():
    """
    [PUBLIC] Proxy tìm kiếm địa điểm từ VietMap.
    """
    query = request.args.get('query', '')
    
    # Lấy Service Key (Secret) từ backend
    service_key = current_app.config.get('VIETMAP_SERVICE_KEY', '')
    
    if not query: 
        return jsonify([])
    
    if not service_key:
        return jsonify({"error": "Server chưa cấu hình VIETMAP_SERVICE_KEY"}), 500

    # Gọi API Autocomplete của VietMap
    url = "https://maps.vietmap.vn/api/autocomplete/v3"
    params = {
        'apikey': service_key,
        'text': query
    }
    
    try:
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        
        if resp.status_code == 200:
            return jsonify(resp.json())
        else:
            return jsonify({"error": f"VietMap API Error: {resp.status_code}"}), resp.status_code
            
    except Exception as e:
        print(f"Lỗi tìm kiếm: {e}")
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# 3. API CHI TIẾT (Lấy tọa độ từ ref_id)
# ==============================================================================
@map_bp.route('/map/api/detail', methods=['GET'])
def api_detail():
    """
    [PUBLIC] Lấy chi tiết tọa độ của một địa điểm khi user chọn từ danh sách gợi ý.
    """
    ref_id = request.args.get('ref_id')
    service_key = current_app.config.get('VIETMAP_SERVICE_KEY', '')
    
    if not ref_id: 
        return jsonify({"error": "Thiếu ref_id"}), 400

    url = "https://maps.vietmap.vn/api/place/v3"
    params = {
        'apikey': service_key, 
        'refid': ref_id
    }
    
    try:
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# 4. API REVERSE GEOCODING (Tùy chọn: Lấy địa chỉ từ tọa độ)
# ==============================================================================
@map_bp.route('/map/api/reverse', methods=['GET'])
def api_reverse():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    service_key = current_app.config.get('VIETMAP_SERVICE_KEY', '')

    if not lat or not lon: 
        return jsonify({"error": "Thiếu tọa độ"}), 400

    url = "https://maps.vietmap.vn/api/reverse/v3"
    params = {
        'apikey': service_key,
        'lat': lat, 
        'lng': lon
    }
    
    try:
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# 5. API ROUTE (Tùy chọn: Tìm đường)
# ==============================================================================
@map_bp.route('/map/api/route', methods=['GET'])
def api_route():
    p1 = request.args.get('point1') # Format: lat,long
    p2 = request.args.get('point2')
    service_key = current_app.config.get('VIETMAP_SERVICE_KEY', '')
    
    if not p1 or not p2:
        return jsonify({"error": "Thiếu điểm đi/đến"}), 400

    url = "https://maps.vietmap.vn/api/route"
    params = {
        'api-version': '1.1',
        'apikey': service_key,
        'point': [p1, p2], 
        'vehicle': 'car',
        'points_encoded': False
    }
    
    try:
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500