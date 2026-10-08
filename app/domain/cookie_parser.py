"""Cookie 字符串解析。"""

from __future__ import annotations

import re
from urllib.parse import unquote

# Set-Cookie 属性名，不作为业务 Cookie 键保留
_ATTR_NAMES = frozenset({"expires", "path", "domain", "secure", "httponly", "samesite"})


def parse_cookie_header(header: str) -> dict[str, str]:
    """
    将 Cookie 请求头解析为键值字典。

    Args:
        header: 形如 "a=1; b=2" 的字符串

    Returns:
        Cookie 字典（已 URL 解码）
    """
    result: dict[str, str] = {}
    text = header.strip()
    if not text:
        return result

    for pair in re.split(r";\s*", text):
        if "=" not in pair:
            continue
        key, value = pair.split("=", 1)
        key = unquote(key.strip())
        value = unquote(value.strip())
        if key.lower() in _ATTR_NAMES:
            continue
        result[key] = value
    return result
