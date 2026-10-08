"""月度汇总单测。"""

from app.domain.status import DayStatus
from app.domain.summary import build_month_attendance
from app.models.schemas import DayRecord


def _day(day: int, status: str, hours: float = 0.0) -> DayRecord:
    return DayRecord(
        day=day,
        weekday=0,
        is_rest_day=status in (DayStatus.WEEKEND, DayStatus.HOLIDAY),
        punches=[],
        status=status,
        work_hours=hours,
        leave_days=0.5 if status == DayStatus.LEAVE else 0.0,
        outing_days=0.0,
    )


def test_build_summary_counts():
    days = [
        _day(1, DayStatus.WEEKEND),
        _day(2, DayStatus.MEAL_ALLOWANCE, 11.1),
        _day(3, DayStatus.PRESENT, 9.4),
        _day(4, DayStatus.EARLY_LEAVE, 6.4),
        _day(5, DayStatus.LEAVE),
    ]
    month = build_month_attendance(2026, 3, days, workday_count=22)
    assert month.summary.attended_days == 3
    assert month.summary.meal_allowance_days == 1
    assert month.summary.early_leave_count == 1
    assert month.summary.leave_days == 0.5
    assert month.summary.workday_count == 22
    assert month.first_weekday == 6  # 2026-03-01 周日 → weekday 6 in calendar.monthrange? 
    # calendar.monthrange returns weekday of first day where Mon=0
    # 2026-03-01 is Sunday → 6
    assert month.days_in_month == 31
