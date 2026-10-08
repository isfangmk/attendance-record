"""
对外 API 的请求 / 响应模型

JSON 使用 camelCase，Python 属性使用 snake_case。
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    """统一开启别名序列化。"""

    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)


class PunchRecord(CamelModel):
    """一次打卡。"""

    time: str
    kind: str  # in / out


class DayRecord(CamelModel):
    """单日出勤（含展示用补充信息）。"""

    day: int
    weekday: int
    is_rest_day: bool = Field(serialization_alias="isRestDay", validation_alias="isRestDay")
    punches: List[PunchRecord]
    status: str
    work_hours: float = Field(serialization_alias="workHours", validation_alias="workHours")
    leave_days: float = Field(serialization_alias="leaveDays", validation_alias="leaveDays")
    outing_days: float = Field(serialization_alias="outingDays", validation_alias="outingDays")
    # 上下班打卡结果文案，如：正常 / 迟到 / 旷工 / 缺卡
    clock_in_result: Optional[str] = Field(
        default=None, serialization_alias="clockInResult", validation_alias="clockInResult"
    )
    clock_out_result: Optional[str] = Field(
        default=None, serialization_alias="clockOutResult", validation_alias="clockOutResult"
    )
    # 请假 / 外出类型标题，如：加班调休
    leave_label: Optional[str] = Field(
        default=None, serialization_alias="leaveLabel", validation_alias="leaveLabel"
    )
    outing_label: Optional[str] = Field(
        default=None, serialization_alias="outingLabel", validation_alias="outingLabel"
    )
    # 班次名称（休息日可为空）
    shift_name: Optional[str] = Field(
        default=None, serialization_alias="shiftName", validation_alias="shiftName"
    )


class MonthSummary(CamelModel):
    """月度汇总。"""

    attended_days: int = Field(serialization_alias="attendedDays", validation_alias="attendedDays")
    average_hours: float = Field(serialization_alias="averageHours", validation_alias="averageHours")
    early_leave_count: int = Field(
        serialization_alias="earlyLeaveCount", validation_alias="earlyLeaveCount"
    )
    leave_days: float = Field(serialization_alias="leaveDays", validation_alias="leaveDays")
    meal_allowance_days: int = Field(
        serialization_alias="mealAllowanceDays", validation_alias="mealAllowanceDays"
    )
    workday_count: int = Field(serialization_alias="workdayCount", validation_alias="workdayCount")
    outing_days: float = Field(serialization_alias="outingDays", validation_alias="outingDays")


class MonthAttendance(CamelModel):
    """整月出勤响应。"""

    year: int
    month: int
    days_in_month: int = Field(serialization_alias="daysInMonth", validation_alias="daysInMonth")
    first_weekday: int = Field(serialization_alias="firstWeekday", validation_alias="firstWeekday")
    summary: MonthSummary
    days: List[DayRecord]


class LoginBody(BaseModel):
    """账号密码登录。"""

    email: str
    password: str


class LogoutBody(BaseModel):
    """登出。"""

    email: str


class AttendanceQuery(BaseModel):
    """查询指定月份。"""

    year: int
    month: int
    email: str


class CookieLoginBody(BaseModel):
    """Cookie 登录。"""

    cookie: str
