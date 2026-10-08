"""用户提醒配置接口。"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from httpx import AsyncClient
from pydantic import BaseModel, Field

from app.services import session_store, settings_store

router = APIRouter(tags=["提醒配置"])


class SettingsUpdateBody(BaseModel):
    """更新当前用户的提醒配置。"""

    email: str
    wechatWebhookUrl: Optional[str] = None
    checkinCronHour: Optional[int] = Field(default=None, ge=0, le=23)
    checkinCronMinute: Optional[int] = Field(default=None, ge=0, le=59)
    checkinCutoffLabel: Optional[str] = None


class WebhookTestBody(BaseModel):
    """试发 Webhook。"""

    email: str
    wechatWebhookUrl: Optional[str] = None


def _require_session(email: str) -> JSONResponse | None:
    if session_store.get_session(email) is None:
        return JSONResponse({"msg": "请先登录", "data": None})
    return None


@router.get("/settings")
async def read_settings(email: str = Query(...)):
    """读取指定用户的提醒配置。"""
    denied = _require_session(email)
    if denied is not None:
        return denied
    try:
        data = settings_store.get_user_settings(email)
    except (KeyError, TypeError, ValueError) as exc:
        return JSONResponse({"msg": str(exc), "data": None})
    return JSONResponse({"msg": "ok", "data": data})


@router.put("/settings")
async def write_settings(body: SettingsUpdateBody):
    """保存当前用户提醒配置。"""
    denied = _require_session(body.email)
    if denied is not None:
        return denied
    patch = body.model_dump(exclude_none=True)
    patch.pop("email")
    if not patch:
        return JSONResponse({"msg": "无更新字段", "data": None})
    try:
        data = settings_store.update_user_settings(body.email, patch)
        return JSONResponse({"msg": "保存成功", "data": data})
    except KeyError as exc:
        return JSONResponse({"msg": str(exc), "data": None})


@router.post("/settings/test-webhook")
async def test_webhook(body: WebhookTestBody):
    """向该用户配置的企业微信机器人发送测试消息。"""
    denied = _require_session(body.email)
    if denied is not None:
        return denied
    url = body.wechatWebhookUrl or settings_store.get_wechat_webhook_url(body.email)
    if not url:
        return JSONResponse({"msg": "未配置 Webhook URL", "data": None})

    payload = {
        "msgtype": "markdown",
        "markdown": {
            "content": "\n".join(
                [
                    "## 提醒配置测试",
                    f"**{body.email}**",
                    "",
                    '> <font color="info">企业微信 Webhook 连通性测试成功</font>',
                ]
            )
        },
    }
    try:
        async with AsyncClient(timeout=30) as http:
            response = await http.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            result = response.json()
        if response.status_code == 200 and result.get("errcode") == 0:
            return JSONResponse({"msg": "测试消息已发送", "data": result})
        return JSONResponse(
            {"msg": f"发送失败: {result.get('errmsg', result)}", "data": result}
        )
    except Exception as exc:
        return JSONResponse({"msg": f"请求异常: {exc}", "data": None})
