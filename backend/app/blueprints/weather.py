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
    """Client tương tác với Open-Meteo API, cung cấp dự báo Daily và Current."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    # BIẾN DAILY (Cho lịch trình tổng thể trong ngày)
    DEFAULT_DAILY_VARS = [
        'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
        'weathercode', 'wind_speed_10m_max'
    ]
    
    # BIẾN CURRENT (Cho dữ liệu thời gian thực chính xác)
    DEFAULT_CURRENT_VARS = [
        'temperature_2m', 'is_day', 'precipitation', 'weather_code', 'wind_speed_10m'
    ]

    def __init__(self, default_timezone: str = 'Asia/Ho_Chi_Minh'):
        self.default_timezone = default_timezone

    def _map_weather_code(self, wmo_code: int) -> str:
        """Dịch Weather Code (WMO) thành mô tả dễ đọc."""
        if wmo_code in [0, 1]:
            return "Trời quang mây"
        elif wmo_code == 2:
            return "Mây rải rác"
        elif wmo_code == 3:
            return "Nhiều mây"
        elif wmo_code in [45, 48]:
            return "Sương mù"
        elif wmo_code in [51, 61, 63, 65]:
            return "Mưa nhẹ/Mưa vừa"
        elif wmo_code in [80, 81, 82]:
            return "Mưa rào lớn"
        elif wmo_code in [95, 96, 99]:
            return "Dông bão"
        else:
            return "Thời tiết thay đổi"

    # --- Phương thức Phân tích Rủi ro DAILY (FIXED THRESHOLDS) ---
    def _analyze_daily_risk(self, temp_max: float, temp_min: float, precip_sum: float, wind_max: float) -> List[str]:
        """Phân tích các rủi ro chính trong ngày dựa trên ngưỡng an toàn."""
        risks = []
        
        # 1. Mưa
        if precip_sum > 5.0: # Tăng ngưỡng một chút để tránh báo động giả quá nhiều
            risks.append("RISK_HEAVY_RAIN")
        elif precip_sum >= 0.5:
            risks.append("WARNING_LIGHT_RAIN")
        
        # 2. Nhiệt độ (FIXED)
        if temp_max > 35.0:
            risks.append("RISK_EXTREME_HEAT")
        elif temp_min < 10.0:
            # Sửa: Chỉ báo EXTREME_COLD khi dưới 10 độ (khớp text frontend)
            risks.append("RISK_EXTREME_COLD")
        elif temp_min < 15.0:
            # Sửa: Chỉ báo CHILLY khi dưới 15 độ (khớp text frontend 10-15 độ)
            # Trước đây là 25.0 gây sai lệch
            risks.append("WARNING_CHILLY")

        # 3. Gió
        if wind_max > 30.0: 
            risks.append("RISK_HIGH_WIND")

        return risks if risks else ["NORMAL"]

    # --- PUBLIC API METHODS ---
    def get_full_forecast(self, lat: float, lon: float, days: int = 7) -> Dict[str, Any]:
        """Lấy cả Current và Daily trong 1 API call để tối ưu và chính xác."""
        params = {
            'latitude': lat,
            'longitude': lon,
            'current': ",".join(self.DEFAULT_CURRENT_VARS),
            'daily': ",".join(self.DEFAULT_DAILY_VARS),
            'timezone': self.default_timezone,
            'forecast_days': days,
            'temperature_unit': 'celsius',
            'wind_speed_unit': 'kmh'
        }

        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            return data
        except requests.exceptions.RequestException as e:
            print(f"Lỗi khi gọi Open-Meteo API: {e}")
            return {"error": str(e)}

    def process_forecast_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        if 'error' in raw_data:
            return raw_data

        daily = raw_data.get('daily', {})
        current = raw_data.get('current', {})
        
        # Xử lý Daily
        structured_daily = []
        num_days = len(daily.get('time', []))

        for i in range(num_days):
            t_max = daily['temperature_2m_max'][i]
            t_min = daily['temperature_2m_min'][i]
            precip = daily['precipitation_sum'][i]
            w_max = daily['wind_speed_10m_max'][i]
            code = daily['weathercode'][i]
            
            risks = self._analyze_daily_risk(t_max, t_min, precip, w_max)
            
            structured_daily.append({
                'date': daily['time'][i],
                'temp_max': t_max,
                'temp_min': t_min,
                'precipitation_sum': precip,
                'wind_max_kmh': w_max,
                'weather_desc': self._map_weather_code(code),
                'risks': risks
            })

        # Xử lý Current (Lấy chính xác từ sensor, không tính trung bình)
        current_risks = structured_daily[0]['risks'] if structured_daily else []
        
        current_obj = {
            'temperature': current.get('temperature_2m'), # Real-time value
            'temp_max': structured_daily[0]['temp_max'] if structured_daily else 0,
            'temp_min': structured_daily[0]['temp_min'] if structured_daily else 0,
            'weather_desc': self._map_weather_code(current.get('weather_code', 0)),
            'daily_risks': current_risks,
            'precipitation_sum': structured_daily[0]['precipitation_sum'] if structured_daily else 0,
            'wind_max_kmh': current.get('wind_speed_10m', 0)
        }

        return {
            'current_weather': current_obj,
            'five_day_forecast': structured_daily
        }

# ==============================================================================
# 3. ROUTE HANDLERS
# ==============================================================================

weather_service = OpenMeteoClient(default_timezone='Asia/Ho_Chi_Minh')

@weather_bp.route('/forecast', methods=['GET'])
def get_forecast():
    """
    API Endpoint: /api/weather/forecast?lat=...&lon=...
    """
    try:
        lat = float(request.args.get('lat', 21.0285))
        lon = float(request.args.get('lon', 105.8542))
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

    # 1. Fetch raw data (Combined call)
    raw_data = weather_service.get_full_forecast(lat, lon, days=5)
    
    # 2. Process and Format
    result = weather_service.process_forecast_data(raw_data)
    
    if 'error' in result:
        return jsonify(result), 503

    return jsonify(result)