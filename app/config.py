"""
应用运行时配置

敏感项仅通过环境变量注入，不在源码中写死密钥。
"""

from __future__ import annotations

import os
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# HTTP 挂载前缀（与反向代理、前端 base path 对齐）
ROOT_PATH = os.getenv("ATTENDANCE_ROOT_PATH", "/attendance-record")

# 企业微信机器人 Webhook；未配置则跳过推送
WECHAT_WEBHOOK_URL = os.getenv("WECHAT_WEBHOOK_URL", "")

# 推送卡片中的面板链接
PANEL_URL = os.getenv(
    "ATTENDANCE_PANEL_URL",
    "http://127.0.0.1:8000/attendance-record/",
)

# 每日打卡检查 cron
CHECKIN_CRON_HOUR = int(os.getenv("CHECKIN_CRON_HOUR", "9"))
CHECKIN_CRON_MINUTE = int(os.getenv("CHECKIN_CRON_MINUTE", "50"))
CHECKIN_CUTOFF_LABEL = os.getenv("CHECKIN_TIME_CUTOFF_HHMM", "09:50")

# 登录态持久化文件
SESSION_STORE_PATH = PROJECT_ROOT / os.getenv("USER_DATA_FILENAME", "user_data.json")

# 前端静态资源目录
STATIC_DIR = PROJECT_ROOT / "panel" / "dist"
