import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from flask import Blueprint, jsonify, request, render_template
from app.models import Room

# ==============================================================================
# 1. SETUP BLUEPRINT
# ==============================================================================
weather_bp = Blueprint('weather', __name__)

# ==============================================================================
# 2. LOGIC SERVICE (Class OpenMeteoClient)
# ==============================================================================
class OpenMeteoClient:
    """Client tương tác với Open-Meteo API."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

    DEFAULT_DAILY_VARS = [
        'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
        'weathercode', 'wind_speed_10m_max'
    ]
    
    DEFAULT_HOURLY_VARS = [
        'temperature_2m', 'weathercode', 'is_day'
    ]

    DEFAULT_CURRENT_VARS = [
        'temperature_2m', 'is_day', 'precipitation', 'weather_code', 'wind_speed_10m'
    ]

    def __init__(self, default_timezone: str = 'Asia/Ho_Chi_Minh'):
        self.default_timezone = default_timezone

    def _map_weather_code(self, wmo_code: int) -> str:
        """Dịch Weather Code (WMO)."""
        if wmo_code in [0, 1]: return "Trời quang"
        elif wmo_code == 2: return "Mây rải rác"
        elif wmo_code == 3: return "Nhiều mây"
        elif wmo_code in [45, 48]: return "Sương mù"
        elif wmo_code in [51, 61, 63, 65]: return "Mưa nhỏ"
        elif wmo_code in [80, 81, 82]: return "Mưa rào"
        elif wmo_code in [95, 96, 99]: return "Dông bão"
        return "Khác"

    def get_coordinates(self, city_name: str) -> Tuple[float, float, str]:
        """Tìm tọa độ từ tên thành phố."""
        try:
            params = {'name': city_name, 'count': 1, 'language': 'en', 'format': 'json'}
            response = requests.get(self.GEOCODING_URL, params=params)
            data = response.json()
            if 'results' in data and data['results']:
                result = data['results'][0]
                return result['latitude'], result['longitude'], f"{result['name']}, {result.get('country_code', '')}"
        except Exception as e:
            print(f"Geocoding error: {e}")
        return None, None, None

    def _analyze_daily_risk(self, temp_max: float, temp_min: float, precip_sum: float, wind_max: float) -> List[str]:
        risks = []
        if precip_sum > 5.0: risks.append("RISK_HEAVY_RAIN")
        elif precip_sum >= 0.5: risks.append("WARNING_LIGHT_RAIN")
        if temp_max > 35.0: risks.append("RISK_EXTREME_HEAT")
        elif temp_min < 15.0: risks.append("WARNING_CHILLY")
        if wind_max > 30.0: risks.append("RISK_HIGH_WIND")
        return risks if risks else ["NORMAL"]

    def get_full_forecast(self, lat: float, lon: float) -> Dict[str, Any]:
        """Lấy dữ liệu cho 3 ngày để đảm bảo đủ 24h tiếp theo."""
        params = {
            'latitude': lat,
            'longitude': lon,
            'current': ",".join(self.DEFAULT_CURRENT_VARS),
            'daily': ",".join(self.DEFAULT_DAILY_VARS),
            'hourly': ",".join(self.DEFAULT_HOURLY_VARS), 
            'timezone': self.default_timezone,
            'forecast_days': 3, 
            'temperature_unit': 'celsius',
            'wind_speed_unit': 'kmh'
        }

        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

    def process_forecast_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        if 'error' in raw_data: return raw_data

        daily = raw_data.get('daily', {})
        current = raw_data.get('current', {})
        hourly = raw_data.get('hourly', {})

        # 1. Xử lý Current & Risks
        t_max = daily['temperature_2m_max'][0] if daily.get('time') else 0
        t_min = daily['temperature_2m_min'][0] if daily.get('time') else 0
        precip = daily['precipitation_sum'][0] if daily.get('time') else 0
        w_max = daily['wind_speed_10m_max'][0] if daily.get('time') else 0
        risks = self._analyze_daily_risk(t_max, t_min, precip, w_max)

        current_obj = {
            'temperature': current.get('temperature_2m'),
            'weather_desc': self._map_weather_code(current.get('weather_code', 0)),
            'daily_risks': risks,
            'precipitation_sum': precip,
            'wind_max_kmh': current.get('wind_speed_10m', 0),
            'temp_max': t_max,
            'temp_min': t_min
        }

        # 2. Xử lý Hourly (24h tới)
        processed_hourly = []
        now = datetime.now()
        
        if hourly.get('time'):
            times = hourly['time']
            temps = hourly['temperature_2m']
            codes = hourly['weathercode']
            
            for i in range(len(times)):
                try:
                    time_str = times[i]
                    item_dt = datetime.strptime(time_str, "%Y-%m-%dT%H:%M")
                    # Lấy mốc thời gian >= hiện tại (hoặc quá khứ < 1h)
                    if item_dt >= now or (now - item_dt).total_seconds() < 3600:
                        processed_hourly.append({
                            'hour': item_dt.strftime("%H:%M"),
                            'temp': temps[i],
                            'weather_desc': self._map_weather_code(codes[i]),
                            'full_time': time_str
                        })
                    if len(processed_hourly) >= 24: break
                except ValueError:
                    continue

        return {
            'current_weather': current_obj,
            'hourly_forecast': processed_hourly,
            'five_day_forecast': []
        }

# ==============================================================================
# 3. ROUTE HANDLERS
# ==============================================================================

weather_service = OpenMeteoClient(default_timezone='Asia/Ho_Chi_Minh')

# Route Render HTML (Dành cho trang Weather chi tiết - nếu cần)
@weather_bp.route('/<int:room_id>', methods=['GET'])
def view_weather(room_id):
    room = Room.query.get_or_404(room_id)
    city_query = request.args.get('city')
    
    lat, lon = 10.8231, 106.6297
    display_location = "Hồ Chí Minh, VN"

    if city_query:
        found_lat, found_lon, found_name = weather_service.get_coordinates(city_query)
        if found_lat:
            lat, lon = found_lat, found_lon
            display_location = found_name
        else:
            display_location = f"Không tìm thấy '{city_query}'"

    raw_data = weather_service.get_full_forecast(lat, lon)
    weather_data = weather_service.process_forecast_data(raw_data)

    return render_template(
        'weather.html', 
        room=room, 
        weather=weather_data,
        location_name=display_location
    )

# --- [UPDATED] API JSON (Dành cho Chat Room Widget) ---
@weather_bp.route('/api/forecast', methods=['GET'])
def get_forecast():
    # 1. Kiểm tra xem có search query không
    city_query = request.args.get('city')
    
    # Tọa độ mặc định (HCM)
    lat = float(request.args.get('lat', 10.8231))
    lon = float(request.args.get('lon', 106.6297))
    location_name = "Hồ Chí Minh, VN"

    # 2. Nếu có city, gọi Geocoding để lấy tọa độ mới
    if city_query:
        found_lat, found_lon, found_name = weather_service.get_coordinates(city_query)
        if found_lat:
            lat, lon = found_lat, found_lon
            location_name = found_name
        else:
            # Nếu không tìm thấy, giữ nguyên mặc định nhưng báo lỗi nhẹ trong JSON (tuỳ chọn)
            location_name = f"Không tìm thấy: {city_query}"

    # 3. Lấy dữ liệu thời tiết
    raw_data = weather_service.get_full_forecast(lat, lon)
    result = weather_service.process_forecast_data(raw_data)
    
    # 4. Thêm tên địa điểm vào kết quả trả về để Frontend hiển thị
    result['location_name'] = location_name
    
    return jsonify(result)