"""出勤聚合服务。"""

from __future__ import annotations

import asyncio
from datetime import datetime

from app.domain.period import split_period_by_day
from app.domain.punch import extract_punches, parse_day_parts, resolve_day_status
from app.domain.status import DayStatus
from app.domain.summary import build_month_attendance
from app.integrations.moka.client import (
    FIELD_CLOCK,
    FIELD_CLOCK_RESULT,
    FIELD_LEAVE,
    FIELD_OUTING,
    FIELD_SHIFT_NAME,
    MokaClient,
)
from app.models.schemas import DayRecord, MonthAttendance
from app.services import session_store


def _field_value(detail: dict, field_name: str):
    """读取日详情中的 fieldValue。"""
    node = detail.get(field_name) or {}
    return node.get("fieldValue")


def _rest_day_status(calendar_day: dict) -> DayStatus | None:
    """
    无班次日按 Moka 日历 type 区分：2=双休日，3=假期。
    有 shiftId 则为工作日。
    """
    if calendar_day["shiftId"]:
        return None
    day_type = calendar_day["type"]
    if day_type == 2:
        return DayStatus.WEEKEND
    if day_type == 3:
        return DayStatus.HOLIDAY
    raise ValueError(f"无班次日 type 无法识别: {day_type} ({calendar_day['day']})")


def _is_rest_day(calendar_day: dict) -> bool:
    return _rest_day_status(calendar_day) is not None


def _sum_periods(records: list | None, target_day: str) -> float:
    """累加请假/外出在目标日的天数占比。"""
    if not records:
        return 0.0
    total = 0.0
    for item in records:
        parts = split_period_by_day(
            item["beginDate"],
            item["endDate"],
            item["beginTime"],
            item["endTime"],
        )
        total += parts.get(target_day, 0.0)
    return total


def _period_labels(records: list | None, target_day: str) -> str | None:
    """汇总落在目标日的请假/外出标题。"""
    if not records:
        return None
    labels: list[str] = []
    for item in records:
        parts = split_period_by_day(
            item["beginDate"],
            item["endDate"],
            item["beginTime"],
            item["endTime"],
        )
        if parts.get(target_day, 0.0) <= 0:
            continue
        title = item.get("title")
        if title and title not in labels:
            labels.append(title)
    if not labels:
        return None
    return "、".join(labels)


def _clock_results(field) -> tuple[str | None, str | None]:
    """解析上下班打卡结果文案。"""
    if not field:
        return None, None
    first = field[0]
    if not first:
        return None, None
    return first.get("clockInDesc") or None, first.get("clockOutDesc") or None


async def _build_day_record(
    client: MokaClient,
    year: int,
    month: int,
    calendar_day: dict,
    employee_id: int,
) -> DayRecord:
    day = calendar_day["day"]
    rest_status = _rest_day_status(calendar_day)
    is_rest = rest_status is not None
    detail = await client.fetch_day_detail(year, month, day, employee_id)

    leave_records = _field_value(detail, FIELD_LEAVE)
    outing_records = _field_value(detail, FIELD_OUTING)
    punches = extract_punches(_field_value(detail, FIELD_CLOCK))
    leave_days = _sum_periods(leave_records, day)
    outing_days = _sum_periods(outing_records, day)
    target_day = datetime.strptime(day, "%Y-%m-%d").date()
    status, work_hours = resolve_day_status(
        punches=punches,
        rest_status=rest_status,
        leave_days=leave_days,
        outing_days=outing_days,
        target_day=target_day,
    )
    clock_in_result, clock_out_result = _clock_results(_field_value(detail, FIELD_CLOCK_RESULT))
    shift_name = _field_value(detail, FIELD_SHIFT_NAME)
    if isinstance(shift_name, str) and not shift_name:
        shift_name = None

    day_num, weekday = parse_day_parts(day)
    return DayRecord(
        day=day_num,
        weekday=weekday,
        is_rest_day=is_rest,
        punches=punches,
        status=status.value,
        work_hours=work_hours,
        leave_days=leave_days,
        outing_days=outing_days,
        clock_in_result=clock_in_result,
        clock_out_result=clock_out_result,
        leave_label=_period_labels(leave_records, day),
        outing_label=_period_labels(outing_records, day),
        shift_name=shift_name if isinstance(shift_name, str) else None,
    )


async def get_month_attendance(email: str, year: int, month: int) -> MonthAttendance:
    """查询指定用户某月出勤。"""
    session = session_store.get_session(email)
    if session is None:
        raise PermissionError("请先登录")

    calendar_days = await session.client.fetch_month_calendar(year, month)
    tasks = [
        _build_day_record(session.client, year, month, item, session.employee_id)
        for item in calendar_days
    ]
    day_records = await asyncio.gather(*tasks)
    workday_count = sum(1 for item in calendar_days if not _is_rest_day(item))
    return build_month_attendance(year, month, list(day_records), workday_count)
