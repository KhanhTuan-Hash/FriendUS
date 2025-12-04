# test_client.py
import requests
import json

# Địa chỉ API của bạn (Mặc định khi chạy uvicorn trên localhost)
API_URL = "http://127.0.0.1:8000/api/process_command"


def send_command(user_input: str, group_id: str = "TEAM_ALPHA") -> dict:
    """
    Gửi lệnh đến API và in ra phản hồi.
    """
    payload = {
        "user_input": user_input,
        "group_id": group_id
    }

    print(f"\n=========================================")
    print(f"👉 SENDING: {user_input} (Group: {group_id})")

    try:
        response = requests.post(API_URL, json=payload)
        response.raise_for_status()  # Ném ra exception nếu status code là lỗi (4xx hoặc 5xx)

        result = response.json()

        print(f"✔️ RESPONSE Status: {response.status_code}")
        print(f"   Action Type: {result.get('action_type')}")
        print(f"   Message: {result.get('message')}")

        # In chi tiết Object (Payload) trả về
        if result.get('objects'):
            print(f"   Objects Data:")
            print(json.dumps(result.get('objects'), indent=4, ensure_ascii=False))

        return result

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: Không thể kết nối hoặc lỗi Server. Đảm bảo 'python api.py' đang chạy.")
        print(f"   Chi tiết lỗi: {e}")
        return {"error": str(e)}


def run_tests():
    """Chạy các trường hợp kiểm thử khác nhau."""

    # --- 1. Lệnh Tiền tệ Hợp lệ (Nợ) ---
    send_command("/tiền Alice nợ Bob 500k tiền ăn trưa", "PROJECT_A")

    # --- 2. Lệnh Tiền tệ Hợp lệ (Trả) ---
    send_command("/tiền Bob trả Alice 250 nghìn", "PROJECT_A")

    # --- 3. Lệnh Thông tin (Thêm) ---
    send_command("/thêm-thông-tin Link Design | figma.com/project-x-link", "PROJECT_A")

    # --- 4. Lệnh Thông tin (Tìm) ---
    send_command("/tìm-thông-tin design figma", "PROJECT_A")

    # --- 5. Lệnh Lỗi (Sai format) ---
    send_command("/tiền Charlie thiếu David không có số tiền", "PROJECT_B")

    # --- 6. Lệnh Lỗi (Không tồn tại) ---
    send_command("/lệnh-không-tồn-tại test", "PROJECT_C")

    # --- 7. Lệnh Fallback (Chỉ là tin nhắn) ---
    send_command("Xin chào, hôm nay trời đẹp quá", "PROJECT_C")


if __name__ == "__main__":
    run_tests()