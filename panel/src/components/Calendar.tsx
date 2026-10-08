/**
 * 月度出勤日历（展示打卡、结果、请假/外出类型等）
 */

import type { DayRecord, MonthAttendance } from '../types/attendance';

interface CalendarProps {
  data: MonthAttendance | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/** 打卡结果是否需要醒目提示（非正常） */
const isAbnormalResult = (result?: string | null) =>
  Boolean(result && result !== '正常');

/**
 * 渲染月历格子
 */
export const Calendar = ({ data, isLoading, error, onRetry }: CalendarProps) => {
  const now = new Date();

  const renderDay = (record: DayRecord) => {
    // 前端 month 为 0-11，与 Date.getMonth() 一致
    const isToday =
      !!data &&
      data.year === now.getFullYear() &&
      data.month === now.getMonth() &&
      record.day === now.getDate();

    let dayClass =
      'calendar-day rounded-xl p-2 flex flex-col transition-all duration-200 border';

    switch (record.status) {
      case 'present':
        dayClass +=
          ' bg-white/90 border-success/25 hover:border-success hover:-translate-y-0.5 hover:shadow-md';
        break;
      case 'early_leave':
        dayClass +=
          ' bg-white/90 border-warning/25 hover:border-warning hover:-translate-y-0.5 hover:shadow-md';
        break;
      case 'working':
        dayClass +=
          ' bg-white/90 border-working/35 hover:border-working hover:-translate-y-0.5 hover:shadow-md';
        break;
      case 'meal_allowance':
        dayClass +=
          ' bg-white/90 border-overtime/25 hover:border-overtime hover:-translate-y-0.5 hover:shadow-md';
        break;
      case 'leave':
        dayClass +=
          ' bg-white/90 border-info/25 hover:border-info hover:-translate-y-0.5 hover:shadow-md';
        break;
      case 'outing':
        dayClass +=
          ' bg-white/90 border-amber/25 hover:border-amber hover:-translate-y-0.5 hover:shadow-md';
        break;
      case 'rest':
        dayClass += ' bg-primary/8 border-primary/20';
        break;
      default:
        // 未打卡：与其它格子同样保留圆角描边，避免“裸字”
        dayClass += ' bg-white/90 border-neutral-200';
    }

    const inPunch = record.punches.find((p) => p.kind === 'in');
    const outPunch = record.punches.find((p) => p.kind === 'out');
    const hasPunchBlock =
      record.punches.length > 0 ||
      Boolean(record.clockInResult) ||
      Boolean(record.clockOutResult);

    const badges: { text: string; className: string }[] = [];
    if (record.status === 'meal_allowance') {
      badges.push({ text: '餐补', className: 'text-overtime bg-overtime/10' });
    }
    if (record.status === 'early_leave') {
      badges.push({ text: '早退', className: 'text-warning bg-warning/10' });
    }
    if (record.status === 'working') {
      badges.push({ text: '进行中', className: 'text-working bg-working/10' });
    }
    // 当天进行中不展示下班侧异常标签（尚未下班）
    if (
      record.status !== 'working' &&
      isAbnormalResult(record.clockInResult) &&
      record.clockInResult !== '早退'
    ) {
      badges.push({
        text: record.clockInResult!,
        className: 'text-warning bg-warning/10',
      });
    }
    if (
      record.status !== 'working' &&
      isAbnormalResult(record.clockOutResult) &&
      record.clockOutResult !== record.clockInResult &&
      !badges.some((b) => b.text === record.clockOutResult)
    ) {
      badges.push({
        text: record.clockOutResult!,
        className: 'text-warning bg-warning/10',
      });
    }
    if (record.status === 'present' && badges.length === 0) {
      badges.push({ text: '正常', className: 'text-success bg-success/10' });
    }

    return (
      <div key={record.day} className={dayClass} title={record.shiftName || undefined}>
        <div className="flex justify-between items-start mb-1">
          <span
            className={`text-sm font-semibold inline-flex items-center gap-1 ${
              record.isRestDay ? 'text-primary' : 'text-neutral-700'
            }`}
          >
            {isToday && (
              <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-primary text-white leading-none">
                今
              </span>
            )}
            {record.day}
          </span>
          {record.status !== 'none' &&
            record.status !== 'rest' &&
            record.status !== 'leave' &&
            record.status !== 'outing' && (
              <span
                className={`w-2 h-2 rounded-full self-center ${
                  record.status === 'present'
                    ? 'bg-success'
                    : record.status === 'early_leave'
                      ? 'bg-warning'
                      : record.status === 'working'
                        ? 'bg-working'
                        : record.status === 'meal_allowance'
                          ? 'bg-overtime'
                          : 'bg-neutral-300'
                }`}
              />
            )}
        </div>

        {record.isRestDay ? (
          <div className="mt-auto text-center py-2 space-y-1">
            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              休息
            </span>
          </div>
        ) : record.status === 'leave' ? (
          <div className="mt-auto text-center space-y-1 py-1">
            {record.leaveLabel && (
              <p className="text-[10px] text-info font-medium truncate px-0.5">
                {record.leaveLabel}
              </p>
            )}
            <span className="text-info text-[10px] bg-info/10 px-1.5 py-0.5 rounded inline-flex items-center">
              请假
              {record.leaveDays > 0 && (
                <span className="ml-1 font-medium">{record.leaveDays}天</span>
              )}
            </span>
            {hasPunchBlock && (inPunch || outPunch) && (
              <div className="text-[10px] text-neutral-500 pt-0.5">
                {inPunch?.time || '—'} ~ {outPunch?.time || '—'}
              </div>
            )}
          </div>
        ) : record.status === 'outing' ? (
          <div className="mt-auto text-center space-y-1 py-1">
            {record.outingLabel && (
              <p className="text-[10px] text-amber font-medium truncate px-0.5">
                {record.outingLabel}
              </p>
            )}
            <span className="text-amber text-[10px] bg-amber/10 px-1.5 py-0.5 rounded inline-flex items-center">
              外出
              {record.outingDays > 0 && (
                <span className="ml-1 font-medium">{record.outingDays}天</span>
              )}
            </span>
            {hasPunchBlock && (inPunch || outPunch) && (
              <div className="text-[10px] text-neutral-500 pt-0.5">
                {inPunch?.time || '—'} ~ {outPunch?.time || '—'}
              </div>
            )}
          </div>
        ) : hasPunchBlock ? (
          <div className="mt-auto space-y-0.5 text-[11px] leading-snug">
            <div className="flex justify-between items-center gap-1">
              <span className="text-neutral-500 shrink-0">上班</span>
              <span
                className={`font-medium text-right ${
                  isAbnormalResult(record.clockInResult)
                    ? 'text-warning'
                    : 'text-neutral-700'
                }`}
              >
                {inPunch?.time || '—'}
                {isAbnormalResult(record.clockInResult) && (
                  <span className="ml-0.5 text-[10px] font-normal">
                    {record.clockInResult}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center gap-1">
              <span className="text-neutral-500 shrink-0">下班</span>
              <span
                className={`font-medium text-right ${
                  isAbnormalResult(record.clockOutResult)
                    ? 'text-warning'
                    : 'text-neutral-700'
                }`}
              >
                {outPunch?.time || '—'}
                {isAbnormalResult(record.clockOutResult) && (
                  <span className="ml-0.5 text-[10px] font-normal">
                    {record.clockOutResult}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center mt-0.5 pt-0.5 border-t border-neutral-100">
              <span className="text-neutral-500">时长</span>
              <span
                className={`font-medium ${
                  record.status === 'early_leave'
                    ? 'text-warning'
                    : record.status === 'working'
                      ? 'text-working'
                      : record.status === 'meal_allowance'
                        ? 'text-overtime'
                        : 'text-success'
                }`}
              >
                {record.workHours}h
              </span>
            </div>
            {badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 pt-0.5">
                {badges.slice(0, 2).map((badge) => (
                  <span
                    key={badge.text}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
            )}
            {(record.leaveDays > 0 || record.outingDays > 0) && (
              <div className="text-[10px] text-neutral-500 text-center truncate">
                {record.leaveDays > 0 && (
                  <span className="text-info">
                    {record.leaveLabel || '请假'} {record.leaveDays}天
                  </span>
                )}
                {record.leaveDays > 0 && record.outingDays > 0 && ' · '}
                {record.outingDays > 0 && (
                  <span className="text-amber">
                    {record.outingLabel || '外出'} {record.outingDays}天
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-auto text-center py-2">
            <span className="text-neutral-400 text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">
              未打卡
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="surface-panel rounded-2xl p-5 md:p-6">
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <i className="fa fa-circle-o-notch fa-spin text-primary text-2xl mb-3" />
            <p className="text-neutral-500">加载出勤数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-panel rounded-2xl p-5 md:p-6">
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <i className="fa fa-exclamation-circle text-danger text-2xl mb-3" />
            <p className="text-neutral-500 mb-4">{error}</p>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="surface-panel rounded-2xl p-5 md:p-6">
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <i className="fa fa-user-o text-neutral-400 text-2xl mb-3" />
            <p className="text-neutral-500">请先登录以查看出勤数据</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-panel rounded-2xl p-5 md:p-6">
      <div className="calendar-grid mb-2">
        {WEEK_LABELS.map((label) => (
          <div key={label} className="text-center py-2 text-neutral-500 font-medium text-sm">
            {label}
          </div>
        ))}
      </div>
      <div className="calendar-grid gap-1.5 md:gap-2">
        {Array.from({ length: data.firstWeekday }, (_, i) => (
          <div key={`empty-${i}`} className="calendar-day bg-white/40 rounded-xl" />
        ))}
        {data.days.map(renderDay)}
      </div>
    </div>
  );
};
