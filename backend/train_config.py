# train_config.py

# --- Hugging Face & Model Config ---
BASE_MODEL_NAME = 'bkai-foundation-models/vietnamese-bi-encoder'
HF_REPO_ID = 'duckling2211/vietmap-intent-vi' # Thay bằng tên repo của bạn
OUTPUT_PATH = './nlu/output/vietmap-intent-model'

# --- Training Config ---
DATA_PATH = './data/train_data.csv'
NUM_EPOCHS = 15
BATCH_SIZE = 32

# --- Inference Config (Vietmap API Keys) ---
# Danh sách Khóa Tìm Kiếm đã được fine-tune
VIETMAP_KEYS = [
    # F&B & ẨM THỰC
    "quán ăn nhanh", "nhà hàng buffet", "quán cà phê lãng mạn", "tiệm bánh",
    "nhà hàng chay", "quán nhậu", "nhà hàng gia đình", "quán ăn truyền thống",
    "quán phở", "quán bún chả", "quán lẩu nướng", "quán hải sản",
    "quán kem", "quán cà phê sách",

    # GIẢI TRÍ & HOẠT ĐỘNG NHÓM (CẬP NHẬT)
    "phòng karaoke", "công viên cây xanh", "công viên giải trí", "rạp chiếu phim",
    "quán bida/board game", "trung tâm trò chơi", "trung tâm văn hóa",
    "bảo tàng", "thư viện",

    # THỂ THAO & SỨC KHỎE
    "phòng gym cao cấp", "sân bóng đá mini", "hồ bơi ngoài trời", "nhà thuốc lớn",
    "bệnh viện nhi", "sân tennis", "sân cầu lông", "phòng khám phụ sản",
    "phòng khám chuyên khoa", "phòng khám nha khoa", "phòng khám da liễu",
    "phòng khám mắt", "bệnh viện thú y", "vật lý trị liệu", "spa",

    # MUA SẮM & BÁN LẺ
    "trung tâm thương mại", "chợ truyền thống", "cửa hàng tiện lợi 24h",
    "nhà sách lớn", "salon tóc", "cửa hàng hoa", "cửa hàng điện thoại",
    "tiệm vàng", "cửa hàng trẻ em", "cửa hàng thú cưng", "cửa hàng vật liệu xây dựng",
    "cửa hàng gas",

    # DU LỊCH & LƯU TRÚ (CẬP NHẬT)
    "trạm xăng dầu", "bãi đỗ xe", "khách sạn cao cấp", "khách sạn giá rẻ",
    "cây xăng dầu diesel", "tiệm rửa xe ô tô", "trạm sạc xe điện",
    "bến xe liên tỉnh", "bến tàu/phà", "nhà ga", "homestay/villa",
    "nhà nghỉ tập thể", "công ty du lịch",

    # DỊCH VỤ & HÀNH CHÍNH
    "tiệm giặt ủi", "dịch vụ giữ đồ", "văn phòng công chứng", "dịch vụ photocopy",
    "tiệm cầm đồ", "công ty bảo hiểm", "dịch vụ sửa chữa", "dịch vụ cắt khóa",
    "bưu điện", "trung tâm đăng kiểm", "ngân hàng", "cơ quan hành chính",
    "sở ban ngành", "đại sứ quán", "tiệm sửa xe", "cây nước nóng lạnh",

    # GIÁO DỤC & KHÁC
    "trường học", "địa điểm tôn giáo", "khu phức hợp", "văn phòng cho thuê",
    "sàn giao dịch", "khu công nghiệp", "trung tâm ngoại ngữ",
    "trung tâm luyện thi", "lớp học thể thao", "trường mầm non",
    "trung tâm nghệ thuật"
]

# --- API Config (Giả định) ---
VIETMAP_API_ENDPOINT = "https://api.vietmap.vn/v4/search"
VIETMAP_API_KEY = "479e5176082849ab6eecaddfe6aaa28bdf9930e4ccf94245" # Thay bằng Key thật của bạn