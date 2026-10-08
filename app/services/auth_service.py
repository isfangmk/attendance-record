"""认证相关应用服务。"""

from __future__ import annotations

from app.domain.cookie_parser import parse_cookie_header
from app.domain.jwt_codec import extract_employee_id
from app.integrations.moka.client import MokaClient
from app.services import session_store


async def login_with_password(email: str, password: str) -> dict[str, str]:
    """
    密码登录；若该邮箱已有会话则直接复用。

    Returns:
        {\"email\", \"realName\"}
    """
    existing = session_store.get_session(email)
    if existing is not None:
        return {"email": email, "realName": existing.real_name}

    client = MokaClient()
    cookie, employee_id = await client.login(email, password)
    profile = await client.fetch_profile(employee_id)
    session_store.put_session(
        email, client, employee_id, cookie, profile["real_name"]
    )
    return {"email": email, "realName": profile["real_name"]}


async def login_with_cookie(cookie: str) -> dict[str, str]:
    """
    Cookie 登录：解析 JWT → 拉资料 → 写入会话。

    Returns:
        {\"email\", \"realName\"}
    """
    cookies = parse_cookie_header(cookie)
    jwt = cookies.get("moka-jwt")
    if jwt is None:
        raise RuntimeError("Cookie 中缺少 moka-jwt")

    employee_id = extract_employee_id(jwt)
    client = MokaClient()
    client.apply_cookie(cookie)
    profile = await client.fetch_profile(employee_id)
    email = profile["email"]

    existing = session_store.get_session(email)
    if existing is not None:
        return {"email": email, "realName": existing.real_name}

    session_store.put_session(
        email, client, employee_id, cookie, profile["real_name"]
    )
    return {"email": email, "realName": profile["real_name"]}


async def logout(email: str) -> None:
    """登出并清理持久化。"""
    session = session_store.remove_session(email)
    if session is None:
        raise RuntimeError("请先登录")
    await session.client.logout()
