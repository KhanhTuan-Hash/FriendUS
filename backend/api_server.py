# Tên file: api_server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from pathlib import Path

# Import class từ file ai_engine.py
from ai_engine import VietmapAssistant 

app = FastAPI()

# --- CẤU HÌNH CORS (Để Frontend gọi được) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KHỞI TẠO AI ENGINE ---
# Đường dẫn tương đối tới thư mục model. 
# Giả định thư mục 'vietmap-intent-model' nằm cùng cấp với 'api_server.py'.
# Tên thư mục mới dựa trên thông tin bạn cung cấp (H:\...\backend\vietmap-intent-model)
MODEL_DIR_NAME = "vietmap-intent-model"

# Sử dụng Path để xây dựng đường dẫn tuyệt đối từ thư mục hiện tại của script
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / MODEL_DIR_NAME

print("⏳ Đang khởi động AI Server...")
print(f"🔄 Đang tải model từ: {MODEL_PATH}")
try:
    # Chú ý: Dựa trên log cũ, model có thể nằm sâu hơn trong thư mục 'vietmap-intent-model'
    # Nếu mô hình thực sự nằm ở: H:\...\backend\vietmap-intent-model\nlu\output\...
    # Bạn cần điều chỉnh MODEL_PATH cho chính xác.
    # Hiện tại, tôi sử dụng MODEL_PATH như đã định nghĩa.
    bot = VietmapAssistant(model_path=str(MODEL_PATH))
    print("🚀 AI Server đã sẵn sàng!")
except Exception as e:
    print(f"🔥 Lỗi khởi tạo AI. Vui lòng kiểm tra đường dẫn: {MODEL_PATH}")
    print(f"🔥 Chi tiết lỗi: {e}")
    # Thoát nếu không load được model, tránh chạy server rỗng
    # sys.exit(1) # Không dùng sys.exit trong môi trường này, chỉ in lỗi.

# --- API ENDPOINTS ---

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """API nhận câu chat và trả về lộ trình"""
    if not request.message:
        raise HTTPException(status_code=400, detail="Tin nhắn trống")
    
    try:
        print(f"📩 Nhận câu hỏi: {request.message}") # Log input
        
        # Gọi xử lý logic từ ai_engine
        # Giả định bot được khởi tạo thành công (bot.process_chat tồn tại)
        route_result = bot.process_chat(request.message)
        
        print(f"🤖 AI trả về ({len(route_result)} items): {route_result}") # Log output for debugging
        
        return {
            "status": "success",
            "data": route_result
        }
    except Exception as e:
        print(f"Error processing chat: {e}")
        # Trả về lỗi 500 nếu logic AI gặp vấn đề, chứ không phải lỗi 404
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Chạy server tại port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)