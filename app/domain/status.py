"""出勤状态枚举。"""

from __future__ import annotations

from enum import StrEnum


class DayStatus(StrEnum):
    """单日最终展示状态。"""

    PRESENT = "present"  # 正常出勤（工时 ≥ 9h）
    EARLY_LEAVE = "early_leave"  # 早退或缺卡（已结束的工作日）
    WORKING = "working"  # 当天已上班、尚未下班
    MEAL_ALLOWANCE = "meal_allowance"  # 可申请餐补（工时 ≥ 11h）
    LEAVE = "leave"  # 请假
    OUTING = "outing"  # 外出
    WEEKEND = "weekend"  # 双休日（日历 type=2）
    HOLIDAY = "holiday"  # 假期（日历 type=3）
    NONE = "none"  # 无记录


class PunchKind(StrEnum):
    """打卡方向。"""

    IN = "in"
    OUT = "out"


# 餐补阈值（小时）
MEAL_ALLOWANCE_HOURS = 11.0
# 正常出勤阈值（小时）
FULL_DAY_HOURS = 9.0
# 折算「一天」的标准工时（用于请假/外出占比）
STANDARD_DAY_HOURS = 9.0
