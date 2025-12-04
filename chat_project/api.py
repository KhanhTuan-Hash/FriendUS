# api.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from processor import CommandProcessor  # Import Bộ xử lý
from core.base import ActionType

# ==================== CẤU HÌNH FASTAPI ====================
app = FastAPI(title="Minimal Chat Command API", version="1.0")
processor = CommandProcessor()

# Cấu hình CORS (Cho phép Front-end truy cập)
# Cần thay đổi 'http://localhost:3000' bằng domain Front-end thực tế
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8080",
    "*"  # Dùng * cho phát triển, nên hạn chế khi deploy
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== DATA MODELS CHO API ====================

class CommandRequest(BaseModel):
    """Input từ Front-end."""
    user_input: str
    group_id: str = "default_group"


class CommandOutput(BaseModel):
    """Output trả về Front-end."""
    message: str
    action_type: str
    objects: list


# ==================== ENDPOINT ====================

@app.post("/api/process_command", response_model=CommandOutput)
def process_command_api(request: CommandRequest):
    """Endpoint chính xử lý lệnh chat."""

    # Gọi CommandProcessor
    response = processor.process(request.user_input, request.group_id)

    # Trả về kết quả JSON
    return CommandOutput(
        message=response.message,
        action_type=response.action_type.value,
        objects=response.objects
    )


if __name__ == "__main__":
    import uvicorn

    # Chạy server ở cổng 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)