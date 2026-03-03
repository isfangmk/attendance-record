/**
 * 日历组件
 * 显示月度出勤数据的日历视图
 */

import React from 'react';

// 打卡记录接口
interface CheckInRecord {
  time: string;
  type?: string;
}

// 日历日期数据接口
interface CalendarDay {
  date: number;
  status: 'present' | 'early_leave' | 'overtime' | 'leave' | 'out' | 'holiday' | 'none';
  checkIns?: CheckInRecord[];
  workHours?: number;
  isHoliday?: boolean;
  holidayType?: string;
  leaveDays?: number;
  outDays?: number;
}

// 统计摘要接口
interface Summary {
  totalAttendance: number;
  avgHours: number;
  earlyLeaveCount: number;
  leaveDays: number;
  outDays: number;
  overtimeDays: number;
  workDays: number;
}

// 出勤数据接口
interface AttendanceData {
  year: number;
  month: number; // 0-11
  firstDayOfMonth: number; // 0=周一, 6=周日
  days: CalendarDay[];
  summary: Summary;
}

interface CalendarProps {
  data: AttendanceData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * 日历组件
 * @param data 出勤数据
 * @param isLoading 是否加载中
 * @param error 错误信息
 * @param onRetry 重试按钮点击事件
 */
export const Calendar: React.FC<CalendarProps> = ({
  data,
  isLoading,
  error,
  onRetry,
}) => {
  // 星期标题
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  /**
   * 渲染单个日期单元格
   */
  const renderDayCell = (day: CalendarDay) => {
    // 基础样式类
    let dayClass = 'calendar-day rounded-lg p-2 flex flex-col transition-all duration-200';

    // 根据出勤状态设置样式
    switch (day.status) {
      case 'present': // 正常出勤
        dayClass += ' bg-white border border-success/20 hover:border-success shadow-sm';
        break;
      case 'early_leave': // 早退
        dayClass += ' bg-white border border-warning/20 hover:border-warning shadow-sm';
        break;
      case 'overtime': // 餐补状态
        dayClass += ' bg-white border border-overtime/20 hover:border-overtime shadow-sm';
        break;
      case 'leave': // 请假状态
        dayClass += ' bg-white border border-info/20 hover:border-info shadow-sm';
        break;
      case 'out': // 外出状态
        dayClass += ' bg-white border border-amber/20 hover:border-amber shadow-sm';
        break;
      case 'holiday': // 假期
        dayClass += ' bg-primary/10 border border-primary/30';
        break;
      default: // 未打卡
        dayClass += ' bg-neutral-50 border border-transparent';
        break;
    }

    // 处理鼠标悬停效果
    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      if (day.status !== 'none') {
        const element = e.currentTarget;
        element.classList.add('shadow-md');
        element.style.transform = 'translateY(-2px)';
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (day.status !== 'none') {
        const element = e.currentTarget;
        element.classList.remove('shadow-md');
        element.style.transform = 'translateY(0)';
      }
    };

    return (
      <div
        key={day.date}
        className={dayClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 日期和状态指示器 */}
        <div className="flex justify-between items-start mb-1">
          <span className={`text-sm font-medium ${day.isHoliday ? 'text-primary' : 'text-neutral-700'}`}>
            {day.date}
          </span>
          {day.status !== 'none' && day.status !== 'holiday' && day.status !== 'leave' && day.status !== 'out' && (
            <span className={`w-2 h-2 rounded-full self-end ${
              day.status === 'present' ? 'bg-success' :
              day.status === 'early_leave' ? 'bg-warning' :
              day.status === 'overtime' ? 'bg-overtime' :
              'bg-neutral'
            }`}></span>
          )}
        </div>

        {/* 假期标记 */}
        {day.isHoliday ? (
          <div className="mt-auto text-center py-2">
            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {day.holidayType || '假'}
            </span>
          </div>
        ) : day.checkIns && day.checkIns.length > 0 ? (
          /* 打卡记录 */
          <div className="mt-auto space-y-1 text-xs">
            {/* 按type显示打卡记录 */}
            {(() => {
              const checkInRecords = day.checkIns || [];
              const inRecord = checkInRecords.find(record => record.type === 'in');
              const outRecord = checkInRecords.find(record => record.type === 'out');

              return (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">上班</span>
                    <span className="text-neutral-700 font-medium">{inRecord?.time || ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">下班</span>
                    <span className="text-neutral-700 font-medium">{outRecord?.time || ''}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-neutral-100">
                    <span className="text-neutral-500">时长</span>
                    <span className={`font-medium ${
                      day.status === 'early_leave' ? 'text-warning' :
                      day.status === 'overtime' ? 'text-overtime' : 
                      day.status === 'leave' ? 'text-info' :
                      day.status === 'out' ? 'text-amber' :
                      'text-success'
                    }`}>
                      {day.workHours}h
                    </span>
                  </div>
                  {/* 状态标签 */}
                  {day.status === 'overtime' && (
                    <div className="text-center mt-1">
                      <span className="text-overtime text-[10px] bg-overtime/10 px-1.5 py-0.5 rounded">
                        餐补
                      </span>
                    </div>
                  )}
                  {day.status === 'early_leave' && (
                    <div className="text-center mt-1">
                      <span className="text-warning text-[10px] bg-warning/10 px-1.5 py-0.5 rounded">
                        早退
                      </span>
                    </div>
                  )}
                  {day.status === 'leave' && (
                    <div className="text-center mt-1 relative">
                      <span className="text-info text-[10px] bg-info/10 px-1.5 py-0.5 rounded relative inline-flex items-center">
                        请假
                        {day.leaveDays !== undefined && day.leaveDays > 0 && (
                          <span className="ml-1 text-info text-[10px] font-medium">
                            {day.leaveDays}d
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {day.status === 'out' && (
                    <div className="text-center mt-1 relative">
                      <span className="text-amber text-[10px] bg-amber/10 px-1.5 py-0.5 rounded relative inline-flex items-center">
                        外出
                        {day.outDays !== undefined && day.outDays > 0 && (
                          <span className="ml-1 text-amber text-[10px] font-medium">
                            {day.outDays}d
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : day.status === 'leave' ? (
          /* 请假状态（无打卡记录） */
          <div className="mt-auto text-center py-2">
            <span className="text-info text-[10px] bg-info/10 px-1.5 py-0.5 rounded inline-flex items-center">
              请假
              {day.leaveDays !== undefined && day.leaveDays > 0 && (
                <span className="ml-1 text-info text-[10px] font-medium">
                  {day.leaveDays}d
                </span>
              )}
            </span>
          </div>
        ) : day.status === 'out' ? (
          /* 外出状态（无打卡记录） */
          <div className="mt-auto text-center py-2">
            <span className="text-amber text-[10px] bg-amber/10 px-1.5 py-0.5 rounded inline-flex items-center">
              外出
              {day.outDays !== undefined && day.outDays > 0 && (
                <span className="ml-1 text-amber text-[10px] font-medium">
                  {day.outDays}d
                </span>
              )}
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  /**
   * 渲染加载状态
   */
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-5 md:p-6">
        <div className="calendar-grid gap-1 md:gap-2">
          <div className="col-span-7 flex justify-center items-center py-16">
            <div className="text-center">
              <i className="fa fa-circle-o-notch fa-spin text-primary text-2xl mb-3"></i>
              <p className="text-neutral-500">加载出勤数据中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 渲染错误状态
   */
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-card p-5 md:p-6">
        <div className="calendar-grid gap-1 md:gap-2">
          <div className="col-span-7 flex justify-center items-center py-16">
            <div className="text-center">
              <i className="fa fa-exclamation-circle text-danger text-2xl mb-3"></i>
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
      </div>
    );
  }

  /**
   * 渲染未登录状态
   */
  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-card p-5 md:p-6">
        <div className="calendar-grid gap-1 md:gap-2">
          <div className="col-span-7 flex justify-center items-center py-16">
            <div className="text-center">
              <i className="fa fa-user-o text-neutral-400 text-2xl mb-3"></i>
              <p className="text-neutral-500">请先登录以查看出勤数据</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-5 md:p-6">
      {/* 日历头部（星期） */}
      <div className="calendar-grid mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center py-2 text-neutral-500 font-medium text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* 日历主体 */}
      <div className="calendar-grid gap-1 md:gap-2">
        {/* 月初空白格子 */}
        {Array.from({ length: data.firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="calendar-day bg-neutral-50 rounded-lg"></div>
        ))}

        {/* 日期格子 */}
        {data.days.map(renderDayCell)}
      </div>
    </div>
  );
};