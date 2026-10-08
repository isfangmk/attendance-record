"""
打卡解析与状态判定

探测样例：
- 餐补日：09:38–20:42 ≈ 11.1h → meal_allowance
- 正常日：09:46–19:11 ≈ 9.4h → present
- 早退日：10:11–16:33 ≈ 6.4h → early_leave
- 当天仅上班卡 → working（不当作早退）
- clockInAndOutTime 可能为 [null] 或字段为 null
"""

from __future__ import annotations

from datetime import date, datetime

from app.domain.status import (
    FULL_DAY_HOURS,
    MEAL_ALLOWANCE_HOURS,
    DayStatus,
    PunchKind,
)
from app.models.schemas import PunchRecord


def parse_day_parts(day_text: str) -> tuple[int, int]:
    """
    解析 YYYY-MM-DD，返回 (日, 星期；周一=0)。
    """
    d = datetime.strptime(day_text, "%Y-%m-%d").date()
    return d.day, d.weekday()


def _hhmm_to_minutes(hhmm: str) -> int:
    hour, minute = map(int, hhmm.split(":"))
    return hour * 60 + minute


def compute_work_hours(clock_in: str, clock_out: str) -> float:
    """根据 HH:MM 上下班时间计算工时（支持跨午夜）。"""
    start = _hhmm_to_minutes(clock_in)
    end = _hhmm_to_minutes(clock_out)
    if end < start:
        end += 24 * 60
    return round((end - start) / 60, 1)


def extract_punches(clock_field: list | None) -> list[PunchRecord]:
    """
    从 detail.clockInAndOutTime.fieldValue 提取打卡列表。

    上游结构：[{clockInTime, clockOutTime}]，元素或字段可为 null。
    """
    punches: list[PunchRecord] = []
    if not clock_field:
        return punches
    first = clock_field[0]
    if not first:
        return punches

    clock_in = first.get("clockInTime")
    clock_out = first.get("clockOutTime")
    if clock_in:
        punches.append(PunchRecord(time=clock_in.split(" ")[1], kind=PunchKind.IN))
    if clock_out:
        punches.append(PunchRecord(time=clock_out.split(" ")[1], kind=PunchKind.OUT))
    return punches


def _incomplete_punch_status(*, target_day: date) -> DayStatus:
    """
    仅有上班或缺少下班时的状态。

    当天尚未结束 → working；历史日 → early_leave（缺卡/早退）。
    """
    if target_day == date.today():
        return DayStatus.WORKING
    return DayStatus.EARLY_LEAVE


def status_from_punches(
    punches: list[PunchRecord],
    *,
    is_rest_day: bool,
    target_day: date,
) -> tuple[DayStatus, float]:
    """
    仅根据打卡推断状态与工时；休息日强制 REST。
    """
    if is_rest_day:
        return DayStatus.REST, 0.0

    if len(punches) == 0:
        return DayStatus.NONE, 0.0

    by_kind = {p.kind: p.time for p in punches}
    has_in = PunchKind.IN in by_kind
    has_out = PunchKind.OUT in by_kind

    if has_in and not has_out:
        return _incomplete_punch_status(target_day=target_day), 0.0
    if has_out and not has_in:
        return DayStatus.EARLY_LEAVE, 0.0
    if not has_in or not has_out:
        return _incomplete_punch_status(target_day=target_day), 0.0

    hours = compute_work_hours(by_kind[PunchKind.IN], by_kind[PunchKind.OUT])
    if hours >= MEAL_ALLOWANCE_HOURS:
        return DayStatus.MEAL_ALLOWANCE, hours
    if hours >= FULL_DAY_HOURS:
        return DayStatus.PRESENT, hours
    return DayStatus.EARLY_LEAVE, hours


def resolve_day_status(
    *,
    punches: list[PunchRecord],
    is_rest_day: bool,
    leave_days: float,
    outing_days: float,
    target_day: date,
) -> tuple[DayStatus, float]:
    """
    综合请假 / 外出 / 打卡得到最终状态。

    优先级：外出 > 请假 > 打卡规则。
    """
    punch_status, work_hours = status_from_punches(
        punches, is_rest_day=is_rest_day, target_day=target_day
    )
    if outing_days > 0:
        return DayStatus.OUTING, work_hours
    if leave_days > 0:
        return DayStatus.LEAVE, work_hours
    return punch_status, work_hours


def first_clock_in_time(punches: list[PunchRecord]) -> str | None:
    """取最早上班打卡时间。"""
    ins = sorted(p.time for p in punches if p.kind == PunchKind.IN)
    if ins:
        return ins[0]
    times = sorted(p.time for p in punches)
    return times[0] if times else None


def today_iso() -> str:
    """今天的 YYYY-MM-DD。"""
    return date.today().strftime("%Y-%m-%d")
