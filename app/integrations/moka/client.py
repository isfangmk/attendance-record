"""
Moka HTTP 客户端

接口探测（2026-03）：
- 登录：passport .../mokaUid/login，可能需 force + rid
- 日历：core .../attendance/calendar/v1/m/list
  - type=1 且有 shiftId → 工作日
  - type=2 且 shiftId 为空 → 休息日
- 日详情：core .../myAttendance/v2/m/detail
  - 字段前缀 myAttendanceAttendanceRecord#
"""

from __future__ import annotations

import atexit
from typing import Any

from httpx import AsyncClient, Limits

from app.domain.jwt_codec import extract_employee_id

LOGIN_URL = "https://passport.mokahr.com/api/outer/moka-unified-account/mokaUid/login"
LOGOUT_URL = "https://core.mokahr.com/api/outer/moka-unified-account/mokaUid/logout?bus=20"
PROFILE_URL = "https://core.mokahr.com/api/aggregate/pc/employeeProfile/v1/getDetail?bus=20"
CALENDAR_URL = "https://core.mokahr.com/api/abs/attendance/calendar/v1/m/list?bus=20"
DAY_DETAIL_URL = "https://core.mokahr.com/api/abs/attendance/myAttendance/v2/m/detail?bus=20"

# 日详情字段名
FIELD_CLOCK = "myAttendanceAttendanceRecord#clockInAndOutTime"
FIELD_CLOCK_RESULT = "myAttendanceAttendanceRecord#clockResult"
FIELD_LEAVE = "myAttendanceAttendanceRecord#leaveRecord"
FIELD_OUTING = "myAttendanceAttendanceRecord#outRecord"
FIELD_SHIFT_NAME = "myAttendanceAttendanceRecord#shiftName"


class MokaClient:
    """带会话的 Moka API 客户端。"""

    def __init__(self) -> None:
        self._http = AsyncClient(
            timeout=30,
            headers={"Content-Type": "application/json"},
            limits=Limits(max_connections=10, max_keepalive_connections=5, keepalive_expiry=30),
            follow_redirects=True,
        )
        atexit.register(self._close_sync)

    @property
    def http(self) -> AsyncClient:
        return self._http

    def apply_cookie(self, cookie: str) -> None:
        """使用浏览器 Cookie 注入鉴权。"""
        self._http.headers["Cookie"] = cookie

    def _sync_cookie_header(self) -> str:
        cookie = "; ".join(f"{name}={value}" for name, value in self._http.cookies.items())
        self._http.headers["Cookie"] = cookie
        return cookie

    async def login(self, email: str, password: str) -> tuple[str, int]:
        """
        账号密码登录。

        Returns:
            (cookie_header, employee_id)

        Raises:
            RuntimeError: 登录失败
        """
        payload: dict[str, Any] = {
            "isMobile": False,
            "bus": 20,
            "email": email,
            "password": password,
        }
        response = await self._http.post(LOGIN_URL, json=payload)
        response.raise_for_status()
        body = response.json()
        if not body.get("success"):
            raise RuntimeError(body.get("msg", "登录失败"))

        if "moka-jwt" not in self._http.cookies:
            rid = (body.get("data") or {}).get("rid")
            if rid is None:
                raise RuntimeError("登录未返回 moka-jwt")
            payload["rid"] = rid
            payload["force"] = True
            response = await self._http.post(LOGIN_URL, json=payload)
            response.raise_for_status()
            body = response.json()
            if not body.get("success") or "moka-jwt" not in self._http.cookies:
                raise RuntimeError(body.get("msg", "强制登录失败"))

        cookie = self._sync_cookie_header()
        employee_id = extract_employee_id(self._http.cookies["moka-jwt"])
        return cookie, employee_id

    async def logout(self) -> None:
        """退出登录（忽略业务失败）。"""
        try:
            await self._http.post(LOGOUT_URL, json={"loginType": "10"})
        except Exception as exc:
            print(f"Moka 登出异常: {exc}")

    async def fetch_profile(self, employee_id: int) -> dict[str, str]:
        """
        读取员工资料。

        Returns:
            {\"email\": 办公邮箱, \"real_name\": 中文姓名}
        """
        response = await self._http.post(
            PROFILE_URL,
            json={"employeeId": employee_id, "loginType": "10"},
        )
        response.raise_for_status()
        body = response.json()
        data = body.get("data") or {}
        email = data.get("officeEmail")
        real_name = data.get("realname")
        if not email:
            raise RuntimeError("无法从资料接口读取邮箱")
        if not real_name:
            raise RuntimeError("无法从资料接口读取姓名")
        return {"email": email, "real_name": real_name}

    async def fetch_month_calendar(self, year: int, month: int) -> list[dict]:
        """拉取月历排班天数列表。"""
        response = await self._http.post(
            CALENDAR_URL,
            json={"loginType": "10", "year": year, "month": month},
        )
        response.raise_for_status()
        body = response.json()
        days = (body.get("data") or {}).get("days")
        if days is None:
            raise RuntimeError("排班数据为空")
        return days

    async def fetch_day_detail(
        self,
        year: int,
        month: int,
        day: str,
        employee_id: int,
    ) -> dict:
        """拉取单日考勤详情 detail 对象。"""
        response = await self._http.post(
            DAY_DETAIL_URL,
            json={
                "loginType": "10",
                "year": year,
                "month": month,
                "startDate": day,
                "endDate": day,
                "fieldVisiblePageEnum": "VISIBLE_DAY",
                "employeeId": employee_id,
            },
        )
        response.raise_for_status()
        body = response.json()
        detail = (body.get("data") or {}).get("detail")
        if detail is None:
            raise RuntimeError(f"日详情为空: {day}")
        return detail

    def _close_sync(self) -> None:
        if self._http is None:
            return
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        if loop.is_closed():
            return
        try:
            loop.run_until_complete(self._http.aclose())
        except RuntimeError:
            pass
