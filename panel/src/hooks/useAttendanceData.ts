/**
 * 出勤数据管理相关的自定义Hook
 * 管理出勤数据的获取、月份切换等功能
 */

import { useState, useCallback } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

// 打卡记录接口
interface CheckInRecord {
  time: string;
  type?: string;
}

// 日历日期数据接口
interface CalendarDay {
  date: number;
  status: 'present' | 'early_leave' | 'overtime' | 'holiday' | 'none';
  checkIns?: CheckInRecord[];
  workHours?: number;
  isHoliday?: boolean;
  holidayType?: string;
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

// 出勤数据响应接口
interface AttendanceData {
  year: number;
  month: number; // 0-11，与Date对象一致
  firstDayOfMonth: number; // 该月第一天是星期几（0=周一，6=周日）
  days: CalendarDay[];
  summary: Summary;
}

// API响应接口
interface ApiResponse {
  msg: string;
  data?: AttendanceData;
}

/**
 * 出勤数据管理Hook
 * @returns 出勤数据相关的状态和方法
 */
export const useAttendanceData = () => {
  // 当前显示的年月（与Date对象月份索引一致：0-11）
  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth());

  // 数据状态
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 加载指定年月的出勤数据
   * @param year 年份
   * @param month 月份（0-11）
   * @param userEmail 用户邮箱
   */
  const loadData = useCallback(async (year: number, month: number, userEmail?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // 如果未登录，显示提示信息但不报错
      if (!userEmail) {
        setData(null);
        return;
      }

      // 显示加载状态
      setData(null);

      // 发送请求给后端（月份转换为1-12格式）
      const displayMonth = month + 1;
      const response = await fetch(getApiUrl(API_ENDPOINTS.ATTENDANCE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: year,
          month: displayMonth,
          email: userEmail,
        }),
      });

      // 处理HTTP错误状态码
      if (!response.ok) {
        let errorData: any = null;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }
        throw new Error(errorData?.message || `请求失败，状态码: ${response.status}`);
      }

      // 解析响应数据
      const responseData: ApiResponse = await response.json();

      // 检查是否需要重新登录
      if (responseData.msg === '请先登录' || responseData.data === null) {
        setData(null);
        // 清除本地登录状态
        localStorage.removeItem('loggedInEmail');
        localStorage.removeItem('loginMethod');
        // 触发页面重新渲染以更新登录状态
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
        return;
      }

      // 验证数据结构完整性
      if (!responseData.data || !responseData.data.summary || !responseData.data.days) {
        throw new Error('后端返回数据格式不正确');
      }

      // 更新数据（确保月份索引为0-11）
      setData({
        ...responseData.data,
        month: month, // 使用传入的月份索引（0-11）
      });
    } catch (err) {
      console.error('获取出勤数据失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 切换到上个月
   */
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11; // 1月的上月是12月
      }
      return prev - 1;
    });
  }, []);

  /**
   * 切换到下个月
   */
  const goToNextMonth = useCallback(() => {
    // 检查是否为当前月份，如果是则不允许切换
    const now = new Date();
    const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
    if (isCurrentMonth) return;

    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0; // 12月的下月是1月
      }
      return prev + 1;
    });
  }, [currentYear, currentMonth]);

  /**
   * 切换到当前月份
   */
  const goToCurrentMonth = useCallback(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  }, []);

  /**
   * 切换到上个月
   */
  const goToLastMonth = useCallback(() => {
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentYear(lastMonthDate.getFullYear());
    setCurrentMonth(lastMonthDate.getMonth());
  }, [currentYear, currentMonth]);

  /**
   * 检查是否为当前月份（用于控制下月按钮状态）
   */
  const isCurrentMonth = (): boolean => {
    const now = new Date();
    return currentYear === now.getFullYear() && currentMonth === now.getMonth();
  };

  return {
    data,
    isLoading,
    error,
    currentYear,
    currentMonth,
    loadData,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    goToLastMonth,
    isCurrentMonth,
    clearError,
  };
};