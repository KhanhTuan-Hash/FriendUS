# Tên file: ai_engine.py
import os
import re
import requests
import torch
from sentence_transformers import SentenceTransformer, util
from pyvi import ViTokenizer
from requests.utils import quote

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
    
    # Số lượng kết quả muốn lấy từ Vietmap API cho mỗi bước tìm kiếm
    MAX_CANDIDATES_PER_STEP = 3

    # Vietmap Search Keys (Database từ model)
    SEARCH_KEYS = [
        "quán ăn nhanh", "nhà hàng buffet", "quán cà phê lãng mạn", "tiệm bánh",
        "nhà hàng chay", "quán nhậu", "nhà hàng gia đình", "quán ăn truyền thống",
        "quán phở", "quán bún chả", "quán lẩu nướng", "quán hải sản",
        "quán kem", "quán cà phê sách",
        "quán cơm", "tiệm bánh mì", "cửa hàng tiện lợi", 
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
        
        # Mã hóa từ khóa URL
        encoded_keyword = quote(keyword)
        url = f"{Config.VIETMAP_API_ENDPOINT}?apikey={self.api_key}&text={encoded_keyword}&focus={lat},{lon}"
        
        print(f" > VIETMAP API URL: {url}")

        try:
            resp = requests.get(url).json()
            return resp if isinstance(resp, list) else []
        except Exception as e:
            print(f" > ERROR API Call: {e}") 
            return []

    def extract_steps(self, chat_text):
        steps = []
        # Tách câu đơn giản
        raw_steps = re.split(r',|\.| sau đó | tiếp theo | cuối cùng ', chat_text)
        
        for raw in raw_steps:
            raw = raw.strip()
            if len(raw) >= 1: 
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
                print(f" > Không tìm thấy địa điểm cho: {intent}") 
                continue

            # Lặp qua TẤT CẢ ứng cử viên để thêm vào route
            for candidate in candidates:
                # Lấy thông tin, nếu thiếu thì để giá trị mặc định hoặc chuỗi rỗng
                name = candidate.get('name', candidate.get('display', 'Unknown Place'))
                address = candidate.get('address', 'Chưa có địa chỉ cụ thể')
                
                # Tọa độ: Lấy từ API, nếu không có thì gán bằng 0.0
                lat = candidate.get('lat', 0.0)
                lng = candidate.get('lng', 0.0)
                
                print(f" > Chấp nhận địa điểm: {name} ({address}) - Lat/Lng: {lat}/{lng}")

                route.append({
                    "step_intent": name, 
                    "name": name,
                    "address": address,
                    "lat": lat,
                    "lng": lng,
                    "ref_id": candidate.get('ref_id')
                })
            
        return route

    def process_chat(self, chat_text):
        print(f"User Query: {chat_text}")
        
        planned_steps = self.extract_steps(chat_text)
        print(f" > Intent Steps: {planned_steps}")
        
        steps_data = []
        last_coords = (Config.CURRENT_LAT, Config.CURRENT_LON)
        
        for step in planned_steps:
            search_key = step['search_key']
            print(f" > Searching Vietmap for Keyword: '{search_key}'")
            
            candidates = self.search_vietmap(search_key, location=last_coords)
            
            if candidates:
                # 1. TÌM ỨNG CỬ VIÊN CÓ TỌA ĐỘ HỢP LỆ ĐỂ CẬP NHẬT last_coords
                first_valid_coord_candidate = None
                for candidate in candidates:
                    if candidate.get('lat') and candidate.get('lng'):
                        first_valid_coord_candidate = candidate
                        break

                # 2. CHỈ LẤY SỐ LƯỢNG KẾT QUẢ TỐI ĐA ĐÃ CẤU HÌNH
                top_candidates = candidates[:Config.MAX_CANDIDATES_PER_STEP]
                
                # 3. LOGIC MỚI: ƯU TIÊN ĐẨY ỨNG CỬ VIÊN CÓ TỌA ĐỘ LÊN ĐẦU DANH SÁCH top_candidates
                if first_valid_coord_candidate and first_valid_coord_candidate not in top_candidates:
                    # Nếu ứng cử viên có tọa độ tốt không nằm trong top 3, chúng ta sẽ thay thế mục cuối cùng
                    # (Hoặc không làm gì, nhưng để đảm bảo có tọa độ, ta nên đưa nó vào)
                    # Tuy nhiên, để tránh phức tạp và giữ nguyên top N của Vietmap, chúng ta chỉ cần đảm bảo nó là top 1 nếu nó là top 3 trở xuống.
                    
                    # Tìm index của ứng cử viên hợp lệ (nếu nó nằm trong top N)
                    try:
                        idx = top_candidates.index(first_valid_coord_candidate)
                        if idx > 0: # Chỉ sắp xếp lại nếu nó không phải là top 1
                            top_candidates.insert(0, top_candidates.pop(idx))
                            print(f" > Reordered: Moved valid coord candidate to index 0.")
                    except ValueError:
                        # Ứng cử viên hợp lệ không nằm trong top_candidates. Bỏ qua.
                        pass
                
                # Nếu ứng cử viên hợp lệ là top 1 rồi, thì không cần làm gì.
                
                steps_data.append({
                    'intent': search_key,
                    'candidates': top_candidates
                })
                
                # 4. CẬP NHẬT TỌA ĐỘ BẰNG ỨNG CỬ VIÊN CÓ TỌA ĐỘ HỢP LỆ ĐẦU TIÊN (Nếu có)
                if first_valid_coord_candidate:
                    last_coords = (first_valid_coord_candidate['lat'], first_valid_coord_candidate['lng'])
                    print(f" > Found place with coords for next search focus: {first_valid_coord_candidate.get('name')}")
                else:
                    print(f" > Warning: No candidate in search result had valid coordinates. Keeping previous focus.")
            else:
                steps_data.append({'intent': search_key, 'candidates': []})
                print(f" > No candidates found for '{search_key}'")

        final_route = self.optimize_route(steps_data)
        
        print(f"🤖 AI trả về tổng cộng ({len(final_route)} items)")
        return final_route