import requests
from typing import Dict, Any, List
from flask import Blueprint, jsonify, request

# ==============================================================================
# 1. SETUP BLUEPRINT
# ==============================================================================
weather_bp = Blueprint('weather', __name__)

# ==============================================================================
# 2. LOGIC SERVICE (Class OpenMeteoClient)
# ==============================================================================
class OpenMeteoClient:
    """Client tương tác với Open-Meteo API, cung cấp dự báo Daily và Hourly."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    # BIẾN DAILY (Cho lịch trình tổng thể trong ngày)
    DEFAULT_DAILY_VARS = [
        'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
        'weathercode', 'wind_speed_10m_max'
    ]

    # BIẾN HOURLY (Cho lịch trình chi tiết trong ngày)
    DEFAULT_HOURLY_VARS = [
        'temperature_2m', 'precipitation_probability', 'wind_speed_10m',
        'weathercode'
    ]

    def __init__(self, default_timezone: str = 'Asia/Ho_Chi_Minh'):
        self.default_timezone = default_timezone

    # --- Phương thức gọi API nội bộ ---
    def _call_api(self, lat: float, lon: float, params_type: str, period: int) -> Dict[str, Any]:
        if params_type == 'daily':
            params_key = 'daily'
            variables = self.DEFAULT_DAILY_VARS
            time_period = 'forecast_days'
        elif params_type == 'hourly':
            params_key = 'hourly'
            variables = self.DEFAULT_HOURLY_VARS
            time_period = 'forecast_hours'
        else:
            return {"error": "Invalid forecast type."}

        params = {
            'latitude': lat,
            'longitude': lon,
            params_key: ",".join(variables),
            'timezone': self.default_timezone,
            time_period: period,
            'temperature_unit': 'celsius',
            'wind_speed_unit': 'kmh'
        }

        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Lỗi khi gọi Open-Meteo API: {e}")
            return {"error": str(e)}

    def _map_weather_code(self, wmo_code: int) -> str:
        """Dịch Weather Code (WMO) thành mô tả dễ đọc."""
        if wmo_code in [0, 1]:
            return "Trời quang mây"
        elif wmo_code == 2:
            return "Mây rải rác"
        elif wmo_code in [51, 61, 63, 65]:
            return "Mưa nhẹ/Mưa vừa"
        elif wmo_code in [80, 81, 82]:
            return "Mưa rào lớn"
        else:
            return "Thời tiết thay đổi"

    # --- Phương thức Phân tích Rủi ro DAILY ---
    def _analyze_daily_risk(self, temp_max: float, temp_min: float, precip_sum: float, wind_max: float) -> List[str]:
        """Phân tích các rủi ro chính trong ngày dựa trên ngưỡng an toàn."""
        risks = []
        # [cite_start]Mưa [cite: 12, 13]
        if precip_sum > 2.0:
            risks.append("RISK_HEAVY_RAIN")
        elif precip_sum >= 0.5:
            risks.append("WARNING_LIGHT_RAIN")
        
        # [cite_start]Nhiệt độ [cite: 14, 15, 17]
        if temp_max > 35.0:
            risks.append("RISK_EXTREME_HEAT")
        elif temp_min < 20.0:
            risks.append("RISK_EXTREME_COLD")
        elif temp_min < 25.0:
            risks.append("WARNING_CHILLY")

        # [cite_start]Gió [cite: 18]
        if wind_max > 30.0: 
            risks.append("RISK_HIGH_WIND")

        return risks if risks else ["NORMAL"]

    # --- Phương thức Phân tích Rủi ro HOURLY ---
    def _analyze_hourly_risk(self, temp: float, precip_prob: int, wind_speed: float) -> List[str]:
        risks = []
        if precip_prob > 60: risks.append("HOURLY_RISK_RAIN")
        elif precip_prob > 30: risks.append("HOURLY_WARNING_RAIN_CHANCE")
        if temp > 33.0: risks.append("HOURLY_RISK_HEAT")
        elif temp < 25.0: risks.append("HOURLY_WARNING_COOL")
        if wind_speed > 25.0: risks.append("HOURLY_RISK_WIND")
        return risks if risks else ["NORMAL"]

    # --- PUBLIC API METHODS ---
    def get_daily_forecast(self, lat: float, lon: float, days: int = 7) -> List[Dict[str, Any]]:
        raw_data = self._call_api(lat, lon, 'daily', days)
        if 'error' in raw_data or 'daily' not in raw_data: return []

        daily = raw_data['daily']
        structured_list = []
        num_days = len(daily['time'])

        for i in range(num_days):
            temp_max = daily['temperature_2m_max'][i]
            temp_min = daily['temperature_2m_min'][i]
            precip = daily['precipitation_sum'][i]
            wind_max = daily['wind_speed_10m_max'][i]
            wmo_code = daily['weathercode'][i]

            risks = self._analyze_daily_risk(temp_max, temp_min, precip, wind_max)

            structured_list.append({
                'date': daily['time'][i],
                'temp_max': temp_max,
                'temp_min': temp_min,
                'precipitation_sum': precip,
                'wind_max_kmh': wind_max,
                'weather_desc': self._map_weather_code(wmo_code),
                'risks': risks,
            })
        return structured_list

    def get_hourly_forecast(self, lat: float, lon: float, hours: int = 24) -> List[Dict[str, Any]]:
        raw_data = self._call_api(lat, lon, 'hourly', hours)
        if 'error' in raw_data or 'hourly' not in raw_data: return []

        hourly = raw_data['hourly']
        structured_list = []
        num_hours = len(hourly['time'])

        for i in range(num_hours):
            temp = hourly['temperature_2m'][i]
            precip_prob = hourly['precipitation_probability'][i]
            wind_speed = hourly['wind_speed_10m'][i]
            wmo_code = hourly['weathercode'][i]

            risks = self._analyze_hourly_risk(temp, precip_prob, wind_speed)

            structured_list.append({
                'datetime': hourly['time'][i],
                'temp_c': temp,
                'precip_prob_percent': precip_prob,
                'wind_speed_kmh': wind_speed,
                'weather_desc': self._map_weather_code(wmo_code),
                'risks': risks,
            })
        return structured_list

# ==============================================================================
# 3. ROUTE HANDLERS
# ==============================================================================

# Khởi tạo instance service duy nhất để tái sử dụng
weather_service = OpenMeteoClient(default_timezone='Asia/Ho_Chi_Minh')

@weather_bp.route('/forecast', methods=['GET'])
def get_forecast():
    """
    API Endpoint: /api/weather/forecast?lat=...&lon=...
    Trả về dữ liệu thời tiết đã được phân tích rủi ro.
    """
    try:
        # Lấy tọa độ từ query params, mặc định là Hà Nội
        lat = float(request.args.get('lat', 21.0285))
        lon = float(request.args.get('lon', 105.8542))
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

    # Lấy dữ liệu từ service
    daily_data = weather_service.get_daily_forecast(lat, lon, days=5)
    
    # Lấy thêm hourly nếu cần (để mở rộng sau này)
    # hourly_data = weather_service.get_hourly_forecast(lat, lon, hours=24)

    # Xử lý dữ liệu ngày hiện tại để hiển thị Main Card
    current_day = daily_data[0] if daily_data else None
    
    if not current_day:
        return jsonify({"error": "Service unavailable or API error"}), 503

    # Trả về JSON đúng cấu trúc Frontend yêu cầu
    return jsonify({
        'current_weather': {
            'temp_max': current_day['temp_max'],
            'temp_min': current_day['temp_min'],
            'temperature': round((current_day['temp_max'] + current_day['temp_min']) / 2),
            'weather_desc': current_day['weather_desc'],
            'daily_risks': current_day['risks'],
            'precipitation_sum': current_day.get('precipitation_sum', 0),
            'wind_max_kmh': current_day.get('wind_max_kmh', 0),
        },
        'five_day_forecast': daily_data,
        # 'hourly_forecast': hourly_data # Bỏ comment nếu muốn trả về hourly
    })