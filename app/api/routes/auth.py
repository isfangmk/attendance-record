"""认证相关接口。"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.schemas import CookieLoginBody, LoginBody, LogoutBody
from app.services import auth_service

router = APIRouter(tags=["认证"])


@router.post("/cookie-login")
async def cookie_login(body: CookieLoginBody):
    """使用浏览器 Cookie 登录。"""
    try:
        user = await auth_service.login_with_cookie(body.cookie)
        return JSONResponse({"msg": "登录成功", "data": user})
    except Exception as exc:
        print(f"Cookie 登录失败: {exc}")
        return JSONResponse({"msg": "登录失败", "data": None})


@router.post("/login")
async def password_login(body: LoginBody):
    """账号密码登录。"""
    try:
        user = await auth_service.login_with_password(body.email, body.password)
        return JSONResponse({"msg": "登录成功", "data": user})
    except Exception as exc:
        print(f"密码登录失败: {exc}")
        return JSONResponse({"msg": "登录失败", "data": None})


@router.post("/logout")
async def logout(body: LogoutBody):
    """登出。"""
    try:
        await auth_service.logout(body.email)
        return JSONResponse({"msg": "登出成功", "data": body.email})
    except RuntimeError:
        return JSONResponse({"msg": "请先登录", "data": None})
