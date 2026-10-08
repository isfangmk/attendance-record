"""打卡与状态判定单测（数据来自真实接口探测）。"""

from datetime import date, timedelta

from app.domain.punch import (
    compute_work_hours,
    extract_punches,
    resolve_day_status,
    status_from_punches,
)
from app.domain.status import DayStatus
from app.models.schemas import PunchRecord


def test_compute_hours_meal_allowance_sample():
    # 2026-03-02 09:38–20:42
    assert compute_work_hours("09:38", "20:42") == 11.1


def test_compute_hours_early_sample():
    # 2026-02-12 10:11–16:33
    assert compute_work_hours("10:11", "16:33") == 6.4


def test_extract_punches_and_status_present():
    field = [{"clockInTime": "2026-03-03 09:46", "clockOutTime": "2026-03-03 19:11"}]
    punches = extract_punches(field)
    status, hours = status_from_punches(
        punches, is_rest_day=False, target_day=date(2026, 3, 3)
    )
    assert status == DayStatus.PRESENT
    assert hours == 9.4


def test_extract_null_clock():
    assert extract_punches([None]) == []
    assert extract_punches([{"clockInTime": None, "clockOutTime": None}]) == []


def test_outing_overrides_punch():
    punches = [
        PunchRecord(time="09:00", kind="in"),
        PunchRecord(time="18:00", kind="out"),
    ]
    status, _ = resolve_day_status(
        punches=punches,
        is_rest_day=False,
        leave_days=0,
        outing_days=1.0,
        target_day=date(2026, 3, 3),
    )
    assert status == DayStatus.OUTING


def test_rest_day():
    status, hours = status_from_punches(
        [], is_rest_day=True, target_day=date.today()
    )
    assert status == DayStatus.REST
    assert hours == 0.0


def test_today_only_clock_in_is_working():
    punches = [PunchRecord(time="09:48", kind="in")]
    status, hours = status_from_punches(
        punches, is_rest_day=False, target_day=date.today()
    )
    assert status == DayStatus.WORKING
    assert hours == 0.0


def test_past_day_only_clock_in_is_early_leave():
    punches = [PunchRecord(time="09:48", kind="in")]
    status, _ = status_from_punches(
        punches, is_rest_day=False, target_day=date.today() - timedelta(days=1)
    )
    assert status == DayStatus.EARLY_LEAVE
