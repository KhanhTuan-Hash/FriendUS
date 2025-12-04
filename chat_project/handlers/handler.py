# handlers/money_handler.py

import re
from typing import Dict, Any
from chat_project.core.base import PaymentBaseHandler, CommandResponse, ActionType, BaseCommandHandler


# Giả định: Bạn sẽ có một lớp PaymentSystem để lưu trữ dữ liệu nợ thực tế

class MoneyTransactionHandler(PaymentBaseHandler):
    COMMAND_PREFIX = "/tiền"
    REGEX_PATTERN = r'^/tiền\s+(?P<person_a>\w+)\s+(?P<raw_details>.+)'

    def execute(self, params: Dict[str, Any], group_id: int) -> CommandResponse:
        person_a = params['person_a']
        raw_details = params['raw_details']

        # 1. Phân tích loại giao dịch (nợ/trả)
        owe_match = re.match(r'(?:nợ|thiếu|chịu)\s+(?P<person_b>\w+)\s+(?P<debt_details>.*)', raw_details,
                             re.IGNORECASE)
        pay_match = re.match(r'(?:trả|thanh toán)\s+(?P<person_b>\w+)\s+(?P<debt_details>.*)', raw_details,
                             re.IGNORECASE)

        if owe_match:
            left, right = person_a, owe_match.group('person_b')
            details = owe_match.group('debt_details')
            transaction_type = "owe"
        elif pay_match:
            left, right = person_a, pay_match.group('person_b')
            details = pay_match.group('debt_details')
            transaction_type = "pay"
        else:
            return CommandResponse(
                message="Lỗi: Phải có 'nợ/thiếu' hoặc 'trả/thanh toán' sau tên.",
                objects=[], action_type=ActionType.ERROR
            )

        # 2. Phân tích Số tiền và Nội dung
        try:
            amount_str, content = self._parse_debt_content(details)
            if not amount_str:
                raise ValueError("Không tìm thấy số tiền hợp lệ.")
            amount = self._parse_amount(amount_str)
        except ValueError as e:
            return CommandResponse(message=f"Lỗi phân tích: {e}", objects=[], action_type=ActionType.ERROR)

        # 3. Logic nghiệp vụ (Giả lập)
        # Tại đây bạn sẽ gọi PaymentSystem.update(group_id, left, right, amount, transaction_type)

        action_message = ""
        if transaction_type == "owe":
            action_message = f"Ghi nhận nợ (Group {group_id}): **{left}** nợ **{right}** {amount:,.0f} VND"
        else:
            action_message = f"Ghi nhận trả (Group {group_id}): **{left}** trả **{right}** {amount:,.0f} VND"

        if content: action_message += f" ({content})"

        # Object trả về cho FE
        payment_object = {
            'type': transaction_type,
            'left': left,
            'right': right,
            'amount': amount,
            'content': content
        }

        return CommandResponse(
            message=action_message,
            objects=[payment_object],
            action_type=ActionType.PAYMENT
        )


class InfoAddHandler(BaseCommandHandler):
    COMMAND_PREFIX = "/thêm-thông-tin"
    ACTION_TYPE = ActionType.INFO
    # Format: /thêm-thông-tin [tiêu đề] | [nội dung]
    REGEX_PATTERN = r'^/thêm-thông-tin\s+(?P<title>.+?)\s*\|\s*(?P<content>.+)'

    def execute(self, params: Dict[str, Any], group_id: int) -> CommandResponse:
        title = params['title'].strip()
        content = params['content'].strip()

        # Logic nghiệp vụ: Thêm vào InfoHub.add_document(group_id, title, content)

        info_object = {'title': title, 'content': content, 'group_id': group_id}

        return CommandResponse(
            message=f"Đã thêm thông tin (Group {group_id}): {title}",
            objects=[info_object],
            action_type=ActionType.INFO
        )


class InfoFindHandler(BaseCommandHandler):
    COMMAND_PREFIX = "/tìm-thông-tin"
    ACTION_TYPE = ActionType.INFO
    REGEX_PATTERN = r'^/tìm-thông-tin\s+(?P<search_query>.+)'

    def execute(self, params: Dict[str, Any], group_id: int) -> CommandResponse:
        search_query = params['search_query'].strip()

        # Logic nghiệp vụ: InfoHub.search(group_id, search_query)

        message = f"Tìm kiếm thông tin '{search_query}' (Group {group_id}) - Giả lập 1 kết quả."
        return CommandResponse(
            message=message,
            objects=[{'query': search_query}],
            action_type=ActionType.INFO
        )
