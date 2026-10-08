"""
JWT payload 解码（不校验签名，仅用于读取可信 Cookie 中的声明）
"""

from __future__ import annotations

import base64
import json


def decode_payload(token: str) -> dict:
    """
    解码 JWT 中间段 payload。

    Args:
        token: 完整 JWT 字符串

    Returns:
        payload 字典

    Raises:
        ValueError: token 格式非法或无法解码
    """
    parts = token.split(".")
    if len(parts) < 2:
        raise ValueError("JWT 段数不足")

    raw = parts[1]
    raw += "=" * ((4 - len(raw) % 4) % 4)
    return json.loads(base64.urlsafe_b64decode(raw).decode("utf-8"))


def extract_employee_id(token: str) -> int:
    """
    从 Moka JWT 的 sub.hcmUid 提取员工 ID。

    Raises:
        ValueError: 缺少字段或无法解析
    """
    payload = decode_payload(token)
    subject = payload.get("sub")
    if subject is None:
        raise ValueError("JWT 缺少 sub")
    if isinstance(subject, str):
        subject = json.loads(subject)
    employee_id = subject.get("hcmUid")
    if employee_id is None:
        raise ValueError("sub 缺少 hcmUid")
    return int(employee_id)
