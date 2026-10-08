/**
 * 餐补工具：从日出勤中提取可申请餐补的日期，并生成申请文案
 */

import type { DayRecord } from '../types/attendance';

/**
 * 提取餐补日期（状态为 meal_allowance）
 */
export const extractMealDates = (days: DayRecord[]): number[] => {
  return days.filter((item) => item.status === 'meal_allowance').map((item) => item.day);
};

/**
 * 格式化为 MM-DD，空格分隔
 */
export const formatMealDates = (dates: number[], month: number): string => {
  return dates
    .map((day) => `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`)
    .join(' ');
};

/**
 * 生成餐补申请文本
 */
export const generateMealApplicationText = (
  year: number,
  month: number,
  dates: number[],
): string => {
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
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textArea);
  return ok;
};
