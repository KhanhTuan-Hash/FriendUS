# handlers.py
import re
from typing import Dict, Any
from base import BaseCommandHandler, PaymentBaseHandler, CommandResponse, ActionType


# Giả định PaymentAction, InfoAction, get_info_hub, get_payment_system đã được import

# --- PAYMENT HANDLERS ---

class MoneyTransactionHandler(PaymentBaseHandler):
    COMMAND_PREFIX = "/tiền"
    ACTION_TYPE = ActionType.PAYMENT

    # REGEX mẫu chung: /tiền [người A] [từ khóa] [người B] [số tiền và nội dung]
    # Dùng (.*) để bắt toàn bộ phần sau người A, sau đó phân tích tiếp trong execute
    REGEX_PATTERN = r'^/tiền\s+(?P<person_a>\w+)\s+(?P<raw_details>.+)'

    def execute(self, params: Dict[str, Any]) -> CommandResponse:
        person_a = params['person_a']
        raw_details = params['raw_details']

        # 1. Phân tích loại giao dịch (nợ/trả) và người còn lại (Person B)

        # Mẫu 1: A nợ B [số tiền] [nội dung]
        owe_match = re.match(r'(?:nợ|thiếu|chịu)\s+(?P<person_b>\w+)\s+(?P<debt_details>.*)', raw_details,
                             re.IGNORECASE)

        # Mẫu 2: A trả B [số tiền] [nội dung]
        pay_match = re.match(r'(?:trả|thanh toán)\s+(?P<person_b>\w+)\s+(?P<debt_details>.*)', raw_details,
                             re.IGNORECASE)

        if owe_match:
            debtor, creditor = person_a, owe_match.group('person_b')
            details = owe_match.group('debt_details')
            transaction_type = "owe"
        elif pay_match:
            payer, payee = person_a, pay_match.group('person_b')
            details = pay_match.group('debt_details')
            transaction_type = "pay"
        else:
            return CommandResponse(
                message="Lỗi: Phải có 'nợ/thiếu' hoặc 'trả/thanh toán' sau tên.",
                objects=[],
                action_type=ActionType.ERROR
            )

        # Đặt tên biến cho rõ ràng
        left, right = (debtor, creditor) if transaction_type == "owe" else (payer, payee)

        # 2. Phân tích Số tiền và Nội dung
        try:
            amount_str, content = self._parse_debt_content(details)
            if not amount_str:
                return CommandResponse(
                    message="Lỗi: Không tìm thấy số tiền hợp lệ (ví dụ: 20k, 50.000, 1tr).",
                    objects=[],
                    action_type=ActionType.ERROR
                )
            amount = self._parse_amount(amount_str)
        except ValueError as e:
            return CommandResponse(message=f"Lỗi phân tích số tiền: {e}", objects=[], action_type=ActionType.ERROR)

        # 3. Logic nghiệp vụ (Giả lập)

        action_message = ""
        if transaction_type == "owe":
            action_message = f"Ghi nhận nợ: **{left}** nợ **{right}** {amount:,.0f} VND"
            if content: action_message += f" ({content})"
        else:  # pay
            action_message = f"Ghi nhận trả: **{left}** trả **{right}** {amount:,.0f} VND"
            if content: action_message += f" ({content})"

        # Tạo object phản hồi (chèn amount_str và content vào PaymentAction)
        payment_action = {
            'left': left,
            'right': right,
            'amount': amount,
            'transaction_type': transaction_type,
            'content': content
        }

        return CommandResponse(
            message=action_message,
            objects=[payment_action],
            action_type=ActionType.PAYMENT
        )


# --- INFORMATION HANDLERS ---

class InfoAddHandler(BaseCommandHandler):
    COMMAND_PREFIX = "/thêm-thông-tin"
    ACTION_TYPE = ActionType.INFO
    # Format: /thêm-thông-tin [tiêu đề] | [nội dung]
    REGEX_PATTERN = r'^/thêm-thông-tin\s+(?P<title>.+?)\s*\:\s*(?P<content>.+)'

    def __init__(self):
        # self.info_hub = get_info_hub()
        pass  # Giữ minimal

    def execute(self, params: Dict[str, Any]) -> CommandResponse:
        title = params['title'].strip()
        content = params['content'].strip()

        # Logic nghiệp vụ: Thêm tài liệu
        # doc_id = self.info_hub.add_document(title, content)

        info_action = {}  # InfoAction(operation="add", title=title, content=content)

        return CommandResponse(
            message=f"Đã thêm thông tin: {params['title'].strip()}",
            objects=[],
            action_type=ActionType.INFO
        )


class InfoFindHandler(BaseCommandHandler):
    COMMAND_PREFIX = "/tìm-thông-tin"
    ACTION_TYPE = ActionType.INFO
    REGEX_PATTERN = r'^/tìm-thông-tin\s+(?P<search_query>.+)'

    def __init__(self):
        # self.info_hub = get_info_hub()
        pass  # Giữ minimal

    def execute(self, params: Dict[str, Any]) -> CommandResponse:
        search_query = params['search_query'].strip()

        # Logic nghiệp vụ: Tìm kiếm
        # results = self.info_hub.search(search_query)

        message = f"Tìm kiếm thông tin cho: '{search_query}"
        return CommandResponse(
            message=message,
            objects=[search_query],  # Thêm các object kết quả tìm kiếm vào đây
            action_type=ActionType.INFO
        )