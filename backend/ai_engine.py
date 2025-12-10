# Tên file: ai_engine.py
import os
import re
import math
import requests
import torch
from sentence_transformers import SentenceTransformer, util
from pyvi import ViTokenizer

# ==============================================================================
# CONFIGURATION
# ==============================================================================
class Config:
    # API & Model
    VIETMAP_API_KEY = "479e5176082849ab6eecaddfe6aaa28bdf9930e4ccf94245"
    VIETMAP_API_ENDPOINT = "https://maps.vietmap.vn/api/autocomplete/v4"
    HF_REPO_ID = "duckling2211/vietmap-intent-vi" 

    # User Default Location (Ví dụ: KHTN, TP.HCM)
    CURRENT_LAT = 10.7628356
    CURRENT_LON = 106.6799075

    # Vietmap Search Keys (Database từ model của bạn)
    SEARCH_KEYS = [
        "quán ăn nhanh", "nhà hàng buffet", "quán cà phê lãng mạn", "tiệm bánh",
        "nhà hàng chay", "quán nhậu", "nhà hàng gia đình", "quán ăn truyền thống",
        "quán phở", "quán bún chả", "quán lẩu nướng", "quán hải sản",
        "quán kem", "quán cà phê sách",
        "phòng karaoke", "công viên cây xanh", "công viên giải trí", "rạp chiếu phim",
        "quán bida/board game", "trung tâm trò chơi", "trung tâm văn hóa",
        "bảo tàng", "sân vận động", "hồ bơi công cộng", "phòng gym", "sân bóng đá",
        "bệnh viện đa khoa", "nhà thuốc lớn", "phòng khám nhi", "phòng khám phụ sản",
        "trạm y tế phường", "trung tâm tiêm chủng", "phòng khám chuyên khoa", "phòng khám nha khoa", "phòng khám da liễu",
        "phòng khám mắt", "bệnh viện thú y", "vật lý trị liệu", "spa",
        "trung tâm thương mại", "chợ truyền thống", "cửa hàng tiện lợi 24h",
        "nhà sách lớn", "salon tóc", "cửa hàng hoa", "cửa hàng điện thoại",
        "tiệm vàng", "cửa hàng trẻ em", "cửa hàng thú cưng", "cửa hàng vật liệu xây dựng",
        "cửa hàng gas",
        "trạm xăng dầu", "bãi đỗ xe", "khách sạn cao cấp", "khách sạn giá rẻ",
        "cây xăng dầu diesel", "tiệm rửa xe ô tô", "trạm sạc xe điện",
        "bến xe liên tỉnh", "bến tàu/phà", "nhà ga", "homestay/villa",
        "nhà nghỉ tập thể", "công ty du lịch",
        "tiệm giặt ủi", "dịch vụ giữ đồ", "văn phòng công chứng", "dịch vụ photocopy",
        "tiệm cầm đồ", "công ty bảo hiểm", "dịch vụ sửa chữa", "dịch vụ cắt khóa",
        "bưu điện", "trung tâm đăng kiểm", "ngân hàng", "trụ sở công an",
        "ủy ban nhân dân", "tòa án", "cơ quan hành chính"
    ]

# ==============================================================================
# CLASS: VietmapAssistant
# ==============================================================================
class VietmapAssistant:
    def __init__(self, model_path=None):
        self.api_key = Config.VIETMAP_API_KEY
        self.search_keys = Config.SEARCH_KEYS
        
        # --- LOADING MODEL ---
        # Nếu có model_path truyền vào (từ máy local), dùng nó. Nếu không thì tải từ HuggingFace
        target_path = model_path if model_path else Config.HF_REPO_ID
        print(f"🔄 Đang tải model từ: {target_path}")
        try:
            self.model = SentenceTransformer(target_path)
            print("✅ Model loaded successfully!")
        except Exception as e:
            print(f"❌ Lỗi load model: {e}")
            print("⚠️ Đang thử fallback về HuggingFace mặc định...")
            self.model = SentenceTransformer(Config.HF_REPO_ID)

        # Pre-compute embeddings cho keys
        self.key_embeddings = self.model.encode(
            [ViTokenizer.tokenize(k) for k in self.search_keys], 
            convert_to_tensor=True
        )

    def predict_intent(self, user_query):
        seg_query = ViTokenizer.tokenize(user_query)
        query_vec = self.model.encode(seg_query, convert_to_tensor=True)
        cos_scores = util.cos_sim(query_vec, self.key_embeddings)[0]
        best_idx = torch.argmax(cos_scores).item()
        return self.search_keys[best_idx], cos_scores[best_idx].item()

    def search_vietmap(self, keyword, location=None):
        lat = location[0] if location else Config.CURRENT_LAT
        lon = location[1] if location else Config.CURRENT_LON
        
        url = f"{Config.VIETMAP_API_ENDPOINT}?apikey={self.api_key}&text={keyword}&focus={lat},{lon}"
        try:
            resp = requests.get(url).json()
            return resp if isinstance(resp, list) else []
        except Exception as e:
            print(f"Vietmap API Error: {e}")
            return []

    def extract_steps(self, chat_text):
        steps = []
        # Tách câu đơn giản bằng dấu phẩy hoặc từ nối (logic đơn giản)
        raw_steps = re.split(r',|\.| sau đó | tiếp theo | cuối cùng ', chat_text)
        
        for raw in raw_steps:
            raw = raw.strip()
            if len(raw) > 5: # Bỏ qua câu quá ngắn
                key, score = self.predict_intent(raw)
                steps.append({
                    "raw_text": raw,
                    "search_key": key,
                    "confidence": score
                })
        return steps

    def optimize_route(self, steps_data):
        route = []
        for step in steps_data:
            intent = step['intent']
            candidates = step['candidates']
            
            if not candidates:
                route.append({"error": f"Không tìm thấy địa điểm cho: {intent}", "step_intent": intent})
                continue

            # Heuristic đơn giản: Chọn địa điểm đầu tiên tìm thấy (Top 1 Vietmap)
            # Nâng cao: Có thể tính khoảng cách giữa các điểm để chọn đường ngắn nhất
            best_place = candidates[0] 
            
            route.append({
                "step_intent": intent,
                "name": best_place.get('name'),
                "address": best_place.get('address'),
                "lat": best_place.get('lat'),
                "lng": best_place.get('lng'),
                "ref_id": best_place.get('ref_id')
            })
        return route

    def process_chat(self, chat_text):
        print(f"User Query: {chat_text}")
        
        # 1. Phân tích ý định từng bước
        planned_steps = self.extract_steps(chat_text)
        
        # 2. Tìm kiếm địa điểm cho từng bước
        steps_data = []
        last_coords = (Config.CURRENT_LAT, Config.CURRENT_LON)
        
        for step in planned_steps:
            print(f" > Searching: {step['search_key']} (from '{step['raw_text']}')")
            candidates = self.search_vietmap(step['search_key'], location=last_coords)
            
            if candidates:
                steps_data.append({
                    'intent': step['search_key'],
                    'candidates': candidates
                })
                # Update location để tìm điểm tiếp theo gần điểm này
                if 'lat' in candidates[0] and 'lng' in candidates[0]:
                    last_coords = (candidates[0]['lat'], candidates[0]['lng'])
            else:
                steps_data.append({'intent': step['search_key'], 'candidates': []})

        # 3. Tạo lộ trình
        final_route = self.optimize_route(steps_data)
        return final_route