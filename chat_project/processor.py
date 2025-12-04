# processor.py

import re
from typing import List, Dict, Any, Tuple
from chat_project.core.base import BaseCommandHandler, CommandResponse, ActionType
import handlers  # Import module chứa tất cả Handlers


class CommandProcessor:
    """Bộ xử lý chính, tự động đăng ký và định tuyến các lệnh."""

    def __init__(self):
        self.handlers: Dict[str, BaseCommandHandler] = {}
        self.regex_map: List[Tuple[re.Pattern, BaseCommandHandler]] = []
        self._register_handlers()
        print("✅ Command Processor đã khởi động và đăng ký Handlers.")

    def _register_handlers(self):
        """Tự động đăng ký tất cả các Handler từ module 'handlers'."""
        for name, obj in handlers.__dict__.items():
            if (isinstance(obj, type) and
                    issubclass(obj, BaseCommandHandler) and
                    obj is not BaseCommandHandler and
                    obj.COMMAND_PREFIX and
                    obj.REGEX_PATTERN):
                # Khởi tạo instance và đăng ký
                handler_instance = obj()
                self.handlers[obj.COMMAND_PREFIX] = handler_instance

                pattern = re.compile(obj.REGEX_PATTERN, re.IGNORECASE)
                self.regex_map.append((pattern, handler_instance))
                print(f"  -> Đăng ký lệnh: {obj.COMMAND_PREFIX}")

    def process(self, input_text: str, group_id: str = "default") -> CommandResponse:
        """
        Xử lý input và điều phối lệnh đến Handler.
        """
        input_text = input_text.strip()

        if not input_text.startswith('/'):
            return CommandResponse(
                message="Xin chào! Bạn có thể dùng các lệnh bắt đầu bằng /",
                objects=[],
                action_type=ActionType.FALLBACK
            )

        # 1. Tìm kiếm Handler và trích xuất tham số bằng Regex
        for pattern, handler_instance in self.regex_map:
            match = pattern.match(input_text)

            if match:
                params = match.groupdict()

                try:
                    # 2. Thực thi Handler (truyền group_id vào)
                    return handler_instance.execute(params, group_id)
                except Exception as e:
                    print(f"[ERROR] Handler {type(handler_instance).__name__} failed: {e}")
                    return CommandResponse(
                        message=f"Lỗi xử lý nghiệp vụ: {e}",
                        objects=[],
                        action_type=ActionType.ERROR
                    )

        # Không tìm thấy Handler phù hợp
        available_commands = ', '.join(self.handlers.keys())
        return CommandResponse(
            message=f"Lệnh không xác định. Các lệnh khả dụng: {available_commands}",
            objects=[],
            action_type=ActionType.ERROR
        )