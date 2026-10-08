"""
企业微信打卡提醒（按用户配置推送）
"""

from __future__ import annotations

import asyncio
from datetime import date, datetime

from httpx import AsyncClient

from app.domain.punch import extract_punches, first_clock_in_time, today_iso
from app.integrations.moka.client import FIELD_CLOCK, FIELD_LEAVE, FIELD_OUTING
from app.services import session_store, settings_store
from app.services.attendance_service import _field_value, _is_rest_day, _sum_periods


async def _post_wecom(webhook: str, payload: dict) -> bool:
    if not webhook:
        print("未配置企业微信 Webhook，跳过推送")
        return False
    async with AsyncClient(timeout=30) as http:
        response = await http.post(
            webhook,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        body = response.json()
        if response.status_code == 200 and body.get("errcode") == 0:
            return True
        print(f"企业微信推送失败: {body}")
        return False


async def send_missing_punch_card(*, email: str, today_label: str, user_label: str) -> None:
    """未打卡提醒（Markdown，无跳转），发到该用户自己的 Webhook。"""
    webhook = settings_store.get_wechat_webhook_url(email)
    cutoff = settings_store.get_checkin_cutoff_label(email)
    content = "\n".join(
        [
            "## 上班打卡提醒",
            f"**{user_label}**　`{today_label}`",
            "",
            '> <font color="warning">尚未检测到今日上班打卡</font>',
            "",
            f'检查时间：<font color="comment">{cutoff}</font>',
            "请尽快完成打卡，以免影响出勤统计",
        ]
    )
    await _post_wecom(webhook, {"msgtype": "markdown", "markdown": {"content": content}})


async def send_text(*, email: str, content: str) -> None:
    webhook = settings_store.get_wechat_webhook_url(email)
    await _post_wecom(webhook, {"msgtype": "text", "text": {"content": content}})


async def _check_one(email: str, session) -> None:
    today = today_iso()
    today_cn = datetime.now().strftime("%Y年%m月%d日")
    year = date.today().year
    month = date.today().month
    user_label = session.real_name
    try:
        calendar_days = await session.client.fetch_month_calendar(year, month)
        today_cal = next((d for d in calendar_days if d.get("day") == today), None)
        if today_cal is None:
            print(f"{today_cn} {email} 月历中无今日，跳过")
            return
        if _is_rest_day(today_cal):
            print(f"{today_cn} {email} 今日休息，跳过")
            return

        detail = await session.client.fetch_day_detail(year, month, today, session.employee_id)
        punches = extract_punches(_field_value(detail, FIELD_CLOCK))
        leave_days = _sum_periods(_field_value(detail, FIELD_LEAVE), today)
        outing_days = _sum_periods(_field_value(detail, FIELD_OUTING), today)
        clock_in = first_clock_in_time(punches)

        if not clock_in and outing_days > 0:
            await send_text(
                email=email,
                content=f"{today_cn} {user_label} 今日状态：外出（无需打卡）",
            )
            return
        if not clock_in and leave_days > 0:
            await send_text(
                email=email,
                content=f"{today_cn} {user_label} 今日状态：请假（无需打卡）",
            )
            return
        if not clock_in:
            await send_missing_punch_card(
                email=email, today_label=today_cn, user_label=user_label
            )
            return
        await send_text(email=email, content=f"{today_cn} {user_label} 已打卡：{clock_in}")
    except Exception as exc:
        print(f"{today_cn} {email} 打卡检查异常: {exc}")


async def check_today_and_notify() -> None:
    """手动触发：检查全部已登录用户并推送到各自 Webhook。"""
    items = session_store.iter_sessions()
    today_cn = datetime.now().strftime("%Y年%m月%d日")
    if not items:
        print(f"{today_cn} 无已登录用户，跳过打卡检查")
        return
    await asyncio.gather(*[_check_one(email, session) for email, session in items])


async def tick_user_reminders() -> None:
    """
    每分钟调度：仅为「提醒时间匹配当前时刻」的用户执行检查。
    """
    now = datetime.now()
    due = [
        (email, session)
        for email, session in session_store.iter_sessions()
        if settings_store.should_notify_now(email, hour=now.hour, minute=now.minute)
    ]
    if not due:
        return
    await asyncio.gather(*[_check_one(email, session) for email, session in due])
