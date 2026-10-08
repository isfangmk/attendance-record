"""
请假 / 外出时段按自然日拆分

探测结论：
- 请假 beginTime/endTime 可能为「上午」「下午」或 HH:MM
- 外出多为 HH:MM，且可跨多日
- 按工作窗口 09:00–18:00 裁剪后，以 9 小时折算为「天」
"""

from __future__ import annotations

from datetime import datetime, timedelta


def _normalize_clock(raw: str, *, is_end: bool) -> str:
    """将「上午/下午」占位转换为具体时刻。"""
    if raw == "上午":
        return "13:30" if is_end else "09:00"
    if raw == "下午":
        return "18:00"
    return raw


def split_period_by_day(
    begin_date: str,
    end_date: str,
    begin_time: str,
    end_time: str,
    *,
    work_start: str = "09:00",
    work_end: str = "18:00",
    day_hours: float = 9.0,
) -> dict[str, float]:
    """
    将一段时间拆成每日占比。

    Args:
        begin_date / end_date: YYYY-MM-DD
        begin_time / end_time: HH:MM 或 上午/下午
        work_start / work_end: 每日计入窗口
        day_hours: 折算一天的小时数

    Returns:
        {\"YYYY-MM-DD\": 天数占比}
    """
    begin_clock = _normalize_clock(begin_time, is_end=False)
    end_clock = _normalize_clock(end_time, is_end=True)

    fmt = "%Y-%m-%d %H:%M"
    period_start = datetime.strptime(f"{begin_date} {begin_clock}", fmt)
    period_end = datetime.strptime(f"{end_date} {end_clock}", fmt)

    window_start = datetime.strptime(work_start, "%H:%M").time()
    window_end = datetime.strptime(work_end, "%H:%M").time()

    result: dict[str, float] = {}
    cursor = period_start.date()
    while cursor <= period_end.date():
        day_start = datetime.combine(cursor, window_start)
        day_end = datetime.combine(cursor, window_end)
        actual_start = max(period_start, day_start)
        actual_end = min(period_end, day_end)
        hours = 0.0
        if actual_start < actual_end:
            hours = (actual_end - actual_start).total_seconds() / 3600
        result[cursor.strftime("%Y-%m-%d")] = round(hours / day_hours, 1)
        cursor += timedelta(days=1)
    return result
