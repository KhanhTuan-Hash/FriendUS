# base.py

import re
from abc import ABC, abstractmethod
from typing import List, Any, Dict
from dataclasses import dataclass
from enum import Enum

from cost import get_payment_system
from info_hub import get_info_hub


# ==================== DATA MODELS & CONSTANTS ====================

class ActionType(Enum):
    """Loại hành động để xử lý phản hồi."""
    AI_RESPONSE = "ai_response"
    PAYMENT = "payment"
    INFO = "information"
    ERROR = "error"


@dataclass
class CommandResponse:
    """Phản hồi tiêu chuẩn từ mọi Handler."""
    message: str
    objects: List[Any]
    action_type: ActionType


# Các mô hình dữ liệu PaymentAction, InfoAction giữ nguyên như code cũ
# ... (Giả định các dataclass PaymentAction, InfoAction được giữ nguyên)

# ==================== ABSTRACT HANDLERS ====================

class BaseCommandHandler(ABC):
    """
    Lớp cơ sở cho tất cả các Command Handler.
    Mỗi Handler cần định nghĩa:
    - COMMAND_PREFIX: Lệnh bắt đầu (ví dụ: "/pay", "/info-add")
    - REGEX_PATTERN: Mẫu Regex để trích xuất tham số cụ thể.
    """
    COMMAND_PREFIX: str = None
    REGEX_PATTERN: str = None
    ACTION_TYPE: ActionType = ActionType.AI_RESPONSE

    @abstractmethod
    def execute(self, params: Dict[str, Any]) -> CommandResponse:
        """Logic nghiệp vụ thực thi lệnh."""
        pass


class PaymentBaseHandler(BaseCommandHandler):
    """Lớp cơ sở cho các lệnh liên quan đến Thanh toán."""
    ACTION_TYPE = ActionType.PAYMENT

    def _parse_amount(self, amount_str: str) -> float:
        """
        Phân tích chuỗi số tiền sang float, hỗ trợ k, K, nghìn, triệu.
        Ví dụ: "20k" -> 20000.0, "50.000" -> 50000.0
        """
        # Loại bỏ các ký tự không phải số và đơn vị
        clean_amount = amount_str.lower().replace('.', '').replace(',', '')
        multiplier = 1.0

        if 'k' in clean_amount or 'nghìn' in clean_amount:
            multiplier = 1000.0
            clean_amount = clean_amount.replace('k', '').replace('nghìn', '')
        elif 'tr' in clean_amount or 'triệu' in clean_amount:
            multiplier = 1000000.0
            clean_amount = clean_amount.replace('tr', '').replace('triệu', '')

        try:
            amount = float(clean_amount)
            return amount * multiplier
        except ValueError:
            raise ValueError(f"Không thể phân tích số tiền từ chuỗi: {amount_str}")

    def _parse_debt_content(self, raw_text: str) -> Tuple[str, str]:
        """
        Trích xuất số tiền và nội dung (content) từ chuỗi thô.
        Ví dụ: "t nợ B 20k tiền ăn sáng" -> amount_str: "20k", content: "tiền ăn sáng"
        """
        # Regex tìm số tiền và phần còn lại
        # Tìm một số lượng (có thể có dấu chấm/phẩy) + tùy chọn đơn vị (k, K, nghìn, tr, triệu)
        pattern = r'(\d[\d\.,]*\s*(?:[kK]|nghìn|tr|triệu|))(?:\s+tiền)?\s*(.*)'
        match = re.search(pattern, raw_text, re.IGNORECASE)

        if match:
            amount_str = match.group(1).strip()
            content = match.group(2).strip()
            return amount_str, content

        return "", raw_text  # Trả về số tiền rỗng nếu không tìm thấy


