"""月度汇总组装。"""

from __future__ import annotations

import calendar

from app.domain.status import DayStatus
from app.models.schemas import DayRecord, MonthAttendance, MonthSummary


def build_month_attendance(
    year: int,
    month: int,
    days: list[DayRecord],
    workday_count: int,
) -> MonthAttendance:
    """根据每日记录生成月度响应。"""
    attended = 0
    total_hours = 0.0
    early_leave = 0
    meal_days = 0
    leave_total = 0.0
    outing_total = 0.0

    for record in days:
        if record.status in (
            DayStatus.PRESENT,
            DayStatus.MEAL_ALLOWANCE,
            DayStatus.EARLY_LEAVE,
            DayStatus.WORKING,
        ):
            attended += 1
            if record.status == DayStatus.MEAL_ALLOWANCE:
                meal_days += 1
            if record.status == DayStatus.EARLY_LEAVE:
                early_leave += 1
        total_hours += record.work_hours
        leave_total += record.leave_days
        outing_total += record.outing_days

    days_in_month = calendar.monthrange(year, month)[1]
    first_weekday = calendar.monthrange(year, month)[0]

    summary = MonthSummary(
        attended_days=attended,
        average_hours=0 if attended == 0 else round(total_hours / attended, 1),
        early_leave_count=early_leave,
        leave_days=leave_total,
        meal_allowance_days=meal_days,
        workday_count=workday_count,
        outing_days=outing_total,
    )
    return MonthAttendance(
        year=year,
        month=month,
        days_in_month=days_in_month,
        first_weekday=first_weekday,
        summary=summary,
        days=days,
    )
