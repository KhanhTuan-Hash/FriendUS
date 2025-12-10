# Tên file: api_server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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
# Đường dẫn tuyệt đối tới thư mục model bạn đã train
MODEL_PATH = r"C:\Users\whelx\Downloads\Training\Training\nlu\output\vietmap-intent-model"

print("⏳ Đang khởi động AI Server...")
try:
    bot = VietmapAssistant(model_path=MODEL_PATH)
    print("🚀 AI Server đã sẵn sàng!")
except Exception as e:
    print(f"🔥 Lỗi khởi tạo AI: {e}")

# --- API ENDPOINTS ---

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """API nhận câu chat và trả về lộ trình"""
    if not request.message:
        raise HTTPException(status_code=400, detail="Tin nhắn trống")
    
    try:
        # Gọi xử lý logic từ ai_engine
        route_result = bot.process_chat(request.message)
        return {
            "status": "success",
            "data": route_result
        }
    except Exception as e:
        print(f"Error processing chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Chạy server tại port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)