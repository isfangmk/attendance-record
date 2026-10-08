/**
 * 出勤数据 Hook：拉月度数据、切换月份
 */

import { useCallback, useState } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import type { ApiEnvelope, MonthAttendance } from '../types/attendance';

/**
 * 管理当前年月与出勤数据
 */
export const useAttendanceData = () => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  // 前端月份索引 0-11，请求后端时转为 1-12
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [data, setData] = useState<MonthAttendance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * 加载指定年月出勤
   * @param year 年
   * @param month 月（0-11）
   * @param userEmail 已登录邮箱
   */
  const loadData = useCallback(async (year: number, month: number, userEmail?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!userEmail) {
        setData(null);
        return;
      }
      setData(null);
      const response = await fetch(getApiUrl(API_ENDPOINTS.ATTENDANCE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month: month + 1,
          email: userEmail,
        }),
      });
      if (!response.ok) {
        throw new Error(`请求失败，状态码: ${response.status}`);
      }
      const envelope: ApiEnvelope<MonthAttendance> = await response.json();
      if (envelope.msg === '请先登录' || envelope.data == null) {
        setData(null);
        localStorage.removeItem('loggedInEmail');
        localStorage.removeItem('displayName');
        localStorage.removeItem('loginMethod');
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
        return;
      }
      if (!envelope.data.summary || !envelope.data.days) {
        throw new Error('后端返回数据格式不正确');
      }
      setData({ ...envelope.data, month });
    } catch (err) {
      console.error('获取出勤数据失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToPrevMonth = useCallback(() => {
    const todayYear = new Date().getFullYear();
    // 不允许翻到去年及更早
    if (currentYear < todayYear) return;
    if (currentYear === todayYear && currentMonth === 0) return;
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, [currentYear, currentMonth]);

  const goToNextMonth = useCallback(() => {
    const today = new Date();
    if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
      return;
    }
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, [currentYear, currentMonth]);

  const goToCurrentMonth = useCallback(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, []);

  const goToLastMonth = useCallback(() => {
    const last = new Date(currentYear, currentMonth - 1, 1);
    // 快速跳转上月同样禁止跨到去年
    if (last.getFullYear() < new Date().getFullYear()) return;
    setCurrentYear(last.getFullYear());
    setCurrentMonth(last.getMonth());
  }, [currentYear, currentMonth]);

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
    clearError,
  };
};
