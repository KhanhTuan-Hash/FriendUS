# processor.py

import re
from typing import List, Dict, Any, Tuple
from base import BaseCommandHandler, CommandResponse, ActionType
import handlers  # Import module chứa tất cả Handlers


class CommandProcessor:
    """Bộ xử lý chính, tự động đăng ký và định tuyến các lệnh."""

    def __init__(self):
        self.handlers: Dict[str, BaseCommandHandler] = {}
        self.regex_map: List[Tuple[re.Pattern, BaseCommandHandler]] = []
        self._register_handlers()

    def _register_handlers(self):
        """
        Tự động đăng ký tất cả các Handler từ module 'handlers'.
        Cách này tối giản hóa việc thêm handler mới.
        """
        for name, obj in handlers.__dict__.items():
            if (isinstance(obj, type) and
                    issubclass(obj, BaseCommandHandler) and
                    obj is not BaseCommandHandler and
                    obj.COMMAND_PREFIX and
                    obj.REGEX_PATTERN):
                handler_instance = obj()
                self.handlers[obj.COMMAND_PREFIX] = handler_instance

                # Biểu mẫu Regex đã biên dịch
                pattern = re.compile(obj.REGEX_PATTERN, re.IGNORECASE)
                self.regex_map.append((pattern, handler_instance))
                print(f"[DEBUG] Registered: {obj.COMMAND_PREFIX}")

    def process(self, input_text: str) -> CommandResponse:
        """
        Xử lý input và trả về CommandResponse.
        """
        input_text = input_text.strip()

        if not input_text.startswith('/'):
            return CommandResponse(
                message="Vui lòng bắt đầu bằng lệnh '/'",
                objects=[],
                action_type=ActionType.FALLBACK
            )

        # 1. Tìm kiếm Handler và trích xuất tham số bằng Regex
        for pattern, handler_instance in self.regex_map:
            match = pattern.match(input_text)

            if match:
                # Trích xuất tham số từ nhóm tên (named groups) trong regex
                params = match.groupdict()

                try:
                    # 2. Thực thi Handler với tham số đã trích xuất
                    return handler_instance.execute(params)
                except Exception as e:
                    print(f"[ERROR] Handler failed: {type(handler_instance).__name__} - {e}")
                    return CommandResponse(
                        message=f"Lỗi khi xử lý lệnh: {e}",
                        objects=[],
                        action_type=ActionType.ERROR
                    )

        # Không tìm thấy Handler phù hợp
        available_commands = ', '.join(self.handlers.keys())
        return CommandResponse(
            message=f"Lệnh không xác định. Các lệnh: {available_commands}",
            objects=[],
            action_type=ActionType.ERROR
        )


# ==================== USAGE EXAMPLE ====================

if __name__ == "__main__":
    processor = CommandProcessor()

    test_cases = [
        "/pay Alice pays Bob 50.000",
        "/owe Bob owes Charlie 25.000",
        "/info-add Python Programming | Python is a great language",
        "/info-find python basics",
        "/unknown-command"
    ]

    print("\n--- TEST RUN ---")
    for test in test_cases:
        print(f"\n> INPUT: {test}")
        response = processor.process(test)
        print(f"  MESSAGE: {response.message}")
        print(f"  ACTION: {response.action_type.value}")
        print(f"  OBJECTS: {len(response.objects)}")