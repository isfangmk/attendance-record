from typing import List

from pydantic import BaseModel


class CheckInOut(BaseModel):
    time: str
    type: str  # 'in' 或 'out'


class DailyAttendance(BaseModel):
    date: int  # 日期（1-31）
    dayOfWeek: int  # 星期（0-6，周一-周日）
    isHoliday: bool  # 是否为节假日
    checkIns: List[CheckInOut]
    status: str  # 'present', 'early_leave', 'holiday', 'leave', 'none'
    workHours: float  # 工作时长（小时）
    leaveDays: float  # 请假天数
    outDays: float  # 外出天数


class AttendanceSummary(BaseModel):
    totalAttendance: int  # 出勤天数
    avgHours: float  # 平均时长
    earlyLeaveCount: int  # 早退次数
    leaveDays: float  # 请假天数
    overtimeDays: int  # 餐补天数,
    workDays: int  # 工作日天数
    outDays: float  # 外出天数


class AttendanceResponse(BaseModel):
    year: int
    month: int
    daysInMonth: int
    firstDayOfMonth: int
    summary: AttendanceSummary
    days: List[DailyAttendance]


class LoginRequest(BaseModel):
    email: str
    password: str


class LogoutRequest(BaseModel):
    email: str


class AttendanceRequest(BaseModel):
    year: int
    month: int
    email: str


class CookieLoginRequest(BaseModel):
    cookie: str
