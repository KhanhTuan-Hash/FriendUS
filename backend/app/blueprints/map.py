from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context
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
# 1. API CẤU HÌNH (Keep for SDK Token)
# ==============================================================================
@map_bp.route('/map/api/config', methods=['GET'])
def api_config():
    """
    [PUBLIC] Trả về Tile Key (vẫn cần thiết cho SDK validation) 
    và URL Style nội bộ (Localhost).
    """
    tile_key = current_app.config.get('VIETMAP_TILE_KEY', '')
    
    # URL này trỏ về Backend của chính mình
    local_style_url = 'http://localhost:5000/map/api/style'
    
    return jsonify({
        'tile_key': tile_key,
        'style_url': local_style_url
    })

# ==============================================================================
# 2. PROXY: MAP STYLE JSON (The Connector Logic)
# ==============================================================================
@map_bp.route('/map/api/style', methods=['GET'])
def api_proxy_style():
    """
    [PROXY] Lấy Style JSON từ VietMap, nhưng VIẾT LẠI các đường dẫn tiles
    để trỏ về server Localhost này thay vì gọi trực tiếp VietMap.
    """
    tile_key = current_app.config.get('VIETMAP_TILE_KEY', '')
    if not tile_key:
        return jsonify({"error": "Missing VIETMAP_TILE_KEY"}), 500

    # 1. Lấy Style gốc từ VietMap
    upstream_url = f"https://maps.vietmap.vn/api/maps/light/styles.json?apikey={tile_key}"
    
    try:
        resp = requests.get(upstream_url, headers=get_headers(), timeout=10)
        if resp.status_code != 200:
            return Response(resp.content, status=resp.status_code)
            
        # 2. Xử lý nội dung JSON
        style_data = resp.text
        
        # 3. THAY THẾ DOMAIN:
        # Style gốc chứa URL dạng: "https://maps.vietmap.vn/api/maps/data/..."
        # Chúng ta đổi thành: "http://localhost:5000/map/api/tiles/..."
        # Để Frontend gọi vào Backend mình lấy tiles.
        
        fixed_style = style_data.replace(
            "https://maps.vietmap.vn/api/maps/data", 
            "http://localhost:5000/map/api/tiles"
        )
        
        return Response(fixed_style, mimetype='application/json')
        
    except Exception as e:
        print(f"Style Proxy Error: {e}")
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# 3. PROXY: MAP TILES (The Data Pipe)
# ==============================================================================
@map_bp.route('/map/api/tiles/<path:subpath>', methods=['GET'])
def api_proxy_tiles(subpath):
    """
    [PROXY] Nhận request tile từ Frontend (qua Style đã sửa),
    gắn Key vào và gọi VietMap server-to-server.
    
    URL vào: /map/api/tiles/vlc-vt-sdk-20250122/13/6523/3850
    URL ra: https://maps.vietmap.vn/api/maps/data/vlc-vt-sdk-20250122/13/6523/3850?apikey=...
    """
    tile_key = current_app.config.get('VIETMAP_TILE_KEY', '')
    
    # Xây dựng URL gốc
    upstream_url = f"https://maps.vietmap.vn/api/maps/data/{subpath}"
    
    params = {
        'apikey': tile_key
    }
    
    try:
        # Stream=True để truyền dữ liệu binary (ảnh/vector) hiệu quả
        req = requests.get(upstream_url, params=params, stream=True, timeout=10)
        
        # Trả về nguyên vẹn headers và content
        return Response(
            stream_with_context(req.iter_content(chunk_size=1024)), 
            content_type=req.headers['content-type'],
            status=req.status_code
        )
    except Exception as e:
        print(f"Tile Proxy Error: {e}")
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# 4. API TÌM KIẾM & HELPER (Giữ nguyên logic cũ dùng Service Key)
# ==============================================================================
@map_bp.route('/map/api/search', methods=['GET'])
def api_search():
    query = request.args.get('query', '')
    service_key = current_app.config.get('VIETMAP_SERVICE_KEY', '') # Dùng Service Key
    
    if not query or not service_key: 
        return jsonify([])

    url = "https://maps.vietmap.vn/api/autocomplete/v3"
    params = {'apikey': service_key, 'text': query}
    
    try:
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        return jsonify(resp.json() if resp.status_code == 200 else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@map_bp.route('/map/api/detail', methods=['GET'])
def api_detail():
    ref_id = request.args.get('ref_id')
    service_key = current_app.config.get('VIETMAP_SERVICE_KEY', '')
    
    if not ref_id: return jsonify({"error": "Thiếu ref_id"}), 400

    url = "https://maps.vietmap.vn/api/place/v3"
    params = {'apikey': service_key, 'refid': ref_id}
    
    try:
        resp = requests.get(url, params=params, headers=get_headers(), timeout=10)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500