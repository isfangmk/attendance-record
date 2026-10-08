/**
 * 出勤相关类型定义（与后端 camelCase JSON 对齐）
 */

/** 单日状态 */
export type DayStatus =
  | 'present'
  | 'early_leave'
  | 'working'
  | 'meal_allowance'
  | 'leave'
  | 'outing'
  | 'rest'
  | 'none';

/** 打卡方向 */
export type PunchKind = 'in' | 'out';

/** 一次打卡 */
export interface PunchRecord {
  time: string;
  kind: PunchKind;
}

/** 单日出勤 */
export interface DayRecord {
  day: number;
  weekday: number;
  isRestDay: boolean;
  punches: PunchRecord[];
  status: DayStatus;
  workHours: number;
  leaveDays: number;
  outingDays: number;
  /** 上班结果：正常 / 迟到 / 旷工 等 */
  clockInResult?: string | null;
  /** 下班结果 */
  clockOutResult?: string | null;
  /** 请假类型标题 */
  leaveLabel?: string | null;
  /** 外出类型标题 */
  outingLabel?: string | null;
  /** 班次名称 */
  shiftName?: string | null;
}

/** 月度汇总 */
export interface MonthSummary {
  attendedDays: number;
  averageHours: number;
  earlyLeaveCount: number;
  leaveDays: number;
  mealAllowanceDays: number;
  workdayCount: number;
  outingDays: number;
}

/** 整月出勤 */
export interface MonthAttendance {
  year: number;
  month: number;
  daysInMonth: number;
  firstWeekday: number;
  summary: MonthSummary;
  days: DayRecord[];
}

/** 统一 API 响应壳 */
export interface ApiEnvelope<T> {
  msg: string;
  data?: T | null;
}
