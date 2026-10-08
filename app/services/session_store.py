"""
用户会话存储

- 内存：持有已登录的 MokaClient
- 磁盘：持久化 cookie / employee_id / real_name，供进程重启后恢复
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict

from app.config import SESSION_STORE_PATH
from app.integrations.moka.client import MokaClient


@dataclass
class UserSession:
    """单个用户的运行时会话。"""

    client: MokaClient
    employee_id: int
    real_name: str


# 邮箱 → 会话
_sessions: Dict[str, UserSession] = {}
# 邮箱 → 可序列化字段
_persisted: Dict[str, dict] = {}


def _read_disk() -> dict[str, dict]:
    if not SESSION_STORE_PATH.exists():
        return {}
    with SESSION_STORE_PATH.open("r", encoding="utf-8") as fp:
        return json.load(fp)


def _write_disk() -> None:
    with SESSION_STORE_PATH.open("w", encoding="utf-8") as fp:
        json.dump(_persisted, fp, ensure_ascii=False, indent=2)


def load_persisted() -> None:
    """模块启动时加载磁盘数据。"""
    global _persisted
    try:
        _persisted = _read_disk()
        print(f"已加载 {len(_persisted)} 条持久化登录信息")
    except Exception as exc:
        _persisted = {}
        print(f"加载持久化登录信息失败: {exc}")


def get_session(email: str) -> UserSession | None:
    return _sessions.get(email)


def put_session(
    email: str,
    client: MokaClient,
    employee_id: int,
    cookie: str,
    real_name: str,
) -> None:
    """写入内存会话并持久化。"""
    _sessions[email] = UserSession(
        client=client, employee_id=employee_id, real_name=real_name
    )
    _persisted[email] = {
        "cookie": cookie,
        "employee_id": employee_id,
        "real_name": real_name,
    }
    _write_disk()


def remove_session(email: str) -> UserSession | None:
    session = _sessions.pop(email, None)
    if email in _persisted:
        del _persisted[email]
        _write_disk()
    return session


def restore_sessions() -> int:
    """根据磁盘 Cookie 重建内存客户端。"""
    count = 0
    for email, info in list(_persisted.items()):
        cookie = info.get("cookie")
        employee_id = info.get("employee_id")
        real_name = info.get("real_name")
        if not cookie or employee_id is None or not real_name:
            continue
        client = MokaClient()
        client.apply_cookie(cookie)
        _sessions[email] = UserSession(
            client=client, employee_id=int(employee_id), real_name=real_name
        )
        count += 1
        print(f"已恢复登录态: {email}")
    return count


def iter_sessions() -> list[tuple[str, UserSession]]:
    return list(_sessions.items())


load_persisted()
