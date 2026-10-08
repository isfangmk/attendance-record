"""请假/外出按日拆分单测。"""

from app.domain.period import split_period_by_day


def test_half_day_morning_leave():
    """探测样例：2026-02-14 上午~上午 → 0.5 天。"""
    result = split_period_by_day("2026-02-14", "2026-02-14", "上午", "上午")
    assert result["2026-02-14"] == 0.5


def test_same_day_hours():
    result = split_period_by_day("2026-03-04", "2026-03-04", "09:00", "18:00")
    assert result["2026-03-04"] == 1.0


def test_multi_day_span():
    result = split_period_by_day("2026-03-04", "2026-03-05", "13:00", "12:00")
    assert "2026-03-04" in result
    assert "2026-03-05" in result
    assert result["2026-03-04"] == 0.6
