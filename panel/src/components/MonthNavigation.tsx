/**
 * 月份导航组件
 * 提供月份切换、快速跳转等功能
 */

import React from 'react';

interface MonthNavigationProps {
  currentYear: number;
  currentMonth: number; // 0-11，与Date对象一致
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onLastMonth: () => void;
  onFullYear: () => void;
}

/**
 * 月份导航组件
 * @param currentYear 当前年份
 * @param currentMonth 当前月份（0-11）
 * @param onPrevMonth 上月按钮点击事件
 * @param onNextMonth 下月按钮点击事件
 * @param onCurrentMonth 本月按钮点击事件
 * @param onLastMonth 上月按钮点击事件
 * @param onFullYear 全年按钮点击事件
 */
export const MonthNavigation: React.FC<MonthNavigationProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onLastMonth,
  onFullYear,
}) => {
  // 月份名称数组（用于显示）
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // 下月：不可超过本月；上月：不可跨入去年
  const now = new Date();
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
  const isYearFloor = currentYear === now.getFullYear() && currentMonth === 0;

  return (
    <div className="surface-panel rounded-2xl p-5 md:p-6 mb-6">
      {/* 月份选择器 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        {/* 月份切换按钮组 */}
        <div className="flex items-center gap-4">
          {/* 上月按钮 */}
          <button
            onClick={onPrevMonth}
            disabled={isYearFloor}
            className={`w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center transition-colors duration-200 ${
              isYearFloor ? 'btn-disabled' : 'hover:bg-neutral-100'
            }`}
            aria-label="上个月"
          >
            <i className="fa fa-chevron-left text-neutral-500"></i>
          </button>

          {/* 当前月份显示 */}
          <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold text-neutral-700">
            {currentYear}年{monthNames[currentMonth]}
          </h2>

          {/* 下月按钮 */}
          <button
            onClick={onNextMonth}
            disabled={isCurrentMonth}
            className={`w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center transition-colors duration-200 ${
              isCurrentMonth 
                ? 'btn-disabled' 
                : 'hover:bg-neutral-100'
            }`}
            aria-label="下个月"
          >
            <i className="fa fa-chevron-right text-neutral-500"></i>
          </button>
        </div>

        {/* 快速切换按钮组 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCurrentMonth}
            className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors duration-200"
          >
            本月
          </button>
          <button
            onClick={onLastMonth}
            disabled={isYearFloor}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 ${
              isYearFloor
                ? 'btn-disabled bg-neutral-100 text-neutral-400'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            上月
          </button>
          <button
            onClick={onFullYear}
            className="px-3 py-1.5 text-sm rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors duration-200"
          >
            全年
          </button>
        </div>
      </div>

      {/* 图例说明 */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-neutral-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-success"></span>
          <span>正常出勤 (≥9小时)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-warning"></span>
          <span>早退 (&lt;9小时)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-working"></span>
          <span>进行中（当天未下班）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-overtime"></span>
          <span>餐补 (≥11小时)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-info"></span>
          <span>请假</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-outing"></span>
          <span>外出</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rest"></span>
          <span>双休日</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rest"></span>
          <span>假期</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-absent"></span>
          <span>未打卡</span>
        </div>
      </div>
    </div>
  );
};