"""
用户级提醒配置持久化

每个登录用户独立保存企业微信 Webhook 与提醒时间。
存储结构：
{
  "users": {
    "a@example.com": { "wechatWebhookUrl": "...", ... }
  }
}
"""

from __future__ import annotations

import json
from copy import deepcopy
from typing import Any

from app.config import (
    CHECKIN_CRON_HOUR,
    CHECKIN_CRON_MINUTE,
    CHECKIN_CUTOFF_LABEL,
    PROJECT_ROOT,
)

SETTINGS_PATH = PROJECT_ROOT / "settings.json"

_USER_DEFAULTS: dict[str, Any] = {
    "wechatWebhookUrl": "",
    "checkinCronHour": CHECKIN_CRON_HOUR,
    "checkinCronMinute": CHECKIN_CRON_MINUTE,
    "checkinCutoffLabel": CHECKIN_CUTOFF_LABEL,
}

# 内存缓存：{"users": {email: settings}}
_cache: dict[str, Any] | None = None


def _read_disk() -> dict[str, Any]:
    if not SETTINGS_PATH.exists():
        return {"users": {}}
    with SETTINGS_PATH.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    if not isinstance(data, dict):
        raise ValueError("settings.json 格式错误")
    if "users" not in data:
        raise ValueError("settings.json 缺少 users 字段")
    users = data["users"]
    if not isinstance(users, dict):
        raise TypeError("settings.json 的 users 必须是对象")
    return {"users": users}


def _write_disk(data: dict[str, Any]) -> None:
    with SETTINGS_PATH.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, ensure_ascii=False, indent=2)


def _ensure_cache() -> dict[str, Any]:
    global _cache
    if _cache is None:
        _cache = _read_disk()
    return _cache


def get_user_settings(email: str) -> dict[str, Any]:
    """读取某用户提醒配置；无记录返回默认值，有记录则字段必须齐全。"""
    store = _ensure_cache()
    saved = store["users"].get(email)
    if saved is None:
        return deepcopy(_USER_DEFAULTS)
    if not isinstance(saved, dict):
        raise TypeError(f"用户配置格式错误: {email}")
    missing = [key for key in _USER_DEFAULTS if key not in saved]
    if missing:
        raise KeyError(f"用户配置缺少字段: {', '.join(missing)}")
    return {key: saved[key] for key in _USER_DEFAULTS}


def update_user_settings(email: str, patch: dict[str, Any]) -> dict[str, Any]:
    """更新并持久化某用户配置。"""
    store = _ensure_cache()
    current = get_user_settings(email)
    for key, value in patch.items():
        if key not in _USER_DEFAULTS:
            raise KeyError(f"不支持的配置项: {key}")
        current[key] = value
    store["users"][email] = current
    _write_disk(store)
    return deepcopy(current)


def get_wechat_webhook_url(email: str) -> str:
    return str(get_user_settings(email)["wechatWebhookUrl"])


def get_checkin_cutoff_label(email: str) -> str:
    return str(get_user_settings(email)["checkinCutoffLabel"])


def should_notify_now(email: str, *, hour: int, minute: int) -> bool:
    """当前时刻是否匹配该用户配置的提醒时间。"""
    cfg = get_user_settings(email)
    return int(cfg["checkinCronHour"]) == hour and int(cfg["checkinCronMinute"]) == minute
