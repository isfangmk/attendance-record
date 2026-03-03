/**
 * 餐补相关的工具函数
 * 处理餐补日期提取、格式化等功能
 */

// 日历日期数据接口
interface CalendarDay {
  date: number;
  status: 'present' | 'early_leave' | 'overtime' | 'holiday' | 'none';
  checkIns?: any[];
  workHours?: number;
  isHoliday?: boolean;
  holidayType?: string;
}

/**
 * 从日历数据中提取餐补日期
 * @param days 日历日期数据数组
 * @returns 符合餐补条件的日期数组
 */
export const extractMealDates = (days: CalendarDay[]): number[] => {
  return days
    .filter(day => day.status === 'overtime' && day.date)
    .map(day => day.date);
};

/**
 * 格式化餐补日期为 MM-DD 格式
 * @param dates 日期数组
 * @param month 月份（1-12）
 * @returns 格式化后的日期字符串，用空格分隔
 */
export const formatMealDates = (dates: number[], month: number): string => {
  return dates
    .map(date => `${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`)
    .join(' ');
};

/**
 * 生成餐补申请文本
 * @param year 年份
 * @param month 月份（1-12）
 * @param dates 餐补日期数组
 * @returns 格式化的餐补申请文本
 */
export const generateMealApplicationText = (year: number, month: number, dates: number[]): string => {
  if (dates.length === 0) {
    return `${year}年${month}月暂无符合条件的餐补记录`;
  }

  const totalDays = dates.length;
  const totalAmount = totalDays * 20;
  const formattedDates = formatMealDates(dates, month);

  return `${year}年${month}月需要申请餐补日期: ${formattedDates} 共${totalDays}天 ${totalAmount}元`;
};

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 复制是否成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // 优先使用现代的Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案：使用document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};