/**
 * 应用根组件：组合认证、汇总、日历与登录弹窗
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAttendanceData } from './hooks/useAttendanceData';
import { extractMealDates } from './utils/mealUtils';
import { Header } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { MonthNavigation } from './components/MonthNavigation';
import { Calendar } from './components/Calendar';
import { LoginModal } from './components/LoginModal';
import { MealTooltip } from './components/MealTooltip';
import { SettingsModal } from './components/SettingsModal';
import type { MonthSummary } from './types/attendance';

function App() {
  const {
    isLoggedIn,
    email,
    displayName,
    isLoading: authLoading,
    error: authError,
    loginWithCookie,
    loginWithPassword,
    switchLoginMethod,
    loginMethod,
    logout,
    clearError,
  } = useAuth();

  const {
    data: attendanceData,
    isLoading: dataLoading,
    error: dataError,
    currentYear,
    currentMonth,
    loadData,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    goToLastMonth,
  } = useAttendanceData();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMealTooltip, setShowMealTooltip] = useState(false);
  const [mealDates, setMealDates] = useState<number[]>([]);

  // Cookie 自动恢复登录
  useEffect(() => {
    const savedCookie = localStorage.getItem('savedCookie');
    const method = localStorage.getItem('loginMethod');
    if (savedCookie && method === 'cookie' && !isLoggedIn && !authLoading) {
      loginWithCookie(savedCookie);
    }
  }, [loginWithCookie, isLoggedIn, authLoading]);

  useEffect(() => {
    loadData(currentYear, currentMonth, email);
  }, [currentYear, currentMonth, email, loadData]);

  useEffect(() => {
    if (attendanceData?.days) {
      setMealDates(extractMealDates(attendanceData.days));
    } else {
      setMealDates([]);
    }
  }, [attendanceData]);

  const handleLoginClick = useCallback(() => {
    setShowLoginModal(true);
    clearError();
  }, [clearError]);

  const handleLoginClose = useCallback(() => {
    setShowLoginModal(false);
    clearError();
  }, [clearError]);

  const handleLogout = useCallback(async () => {
    await logout();
    setShowMealTooltip(false);
  }, [logout]);

  const handleMealCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) return;
      setShowMealTooltip((prev) => !prev);
    },
    [isLoggedIn],
  );

  const handleRetry = useCallback(() => {
    loadData(currentYear, currentMonth, email);
  }, [loadData, currentYear, currentMonth, email]);

  const handleFullYear = useCallback(() => {
    alert('全年视图功能请联系后端开发扩展支持');
  }, []);

  const summaryValue = (key: keyof MonthSummary) => {
    if (!attendanceData?.summary) return '-';
    return attendanceData.summary[key];
  };

  return (
    <div className="app-shell font-sans text-neutral-700 min-h-screen flex flex-col">
      <Header
        isLoggedIn={isLoggedIn}
        displayName={displayName}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      <main className="flex-grow container mx-auto max-w-[min(85vw,1020px)] px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <SummaryCard
            title="本月出勤"
            value={summaryValue('attendedDays')}
            subtitle={`共${summaryValue('workdayCount')}个工作日`}
            icon="fa-check"
            color="primary"
            isLoading={dataLoading}
          />
          <SummaryCard
            title="平均时长"
            value={summaryValue('averageHours')}
            subtitle="小时/天"
            icon="fa-clock-o"
            color="success"
            isLoading={dataLoading}
          />
          <SummaryCard
            title="早退次数"
            value={summaryValue('earlyLeaveCount')}
            subtitle="需注意出勤规范"
            icon="fa-exclamation-triangle"
            color="warning"
            isLoading={dataLoading}
          />
          <SummaryCard
            title="请假天数"
            value={summaryValue('leaveDays')}
            subtitle="不区分请假类型"
            icon="fa-calendar-o"
            color="info"
            isLoading={dataLoading}
          />
          <SummaryCard
            title="外出天数"
            value={summaryValue('outingDays')}
            subtitle="因公外出记录"
            icon="fa-sign-out"
            color="amber"
            isLoading={dataLoading}
          />
          <div className="relative">
            <SummaryCard
              title="餐补天数"
              value={isLoggedIn ? mealDates.length : '-'}
              subtitle="点击数字可以复制餐补数据"
              icon="fa-cutlery"
              color="overtime"
              isLoading={dataLoading}
              onClick={handleMealCardClick}
              isClickable={isLoggedIn}
            />
            {isLoggedIn && (
              <MealTooltip
                isVisible={showMealTooltip}
                mealDates={mealDates}
                year={currentYear}
                month={currentMonth}
                onClose={() => setShowMealTooltip(false)}
              />
            )}
          </div>
        </div>

        <MonthNavigation
          currentYear={currentYear}
          currentMonth={currentMonth}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onCurrentMonth={goToCurrentMonth}
          onLastMonth={goToLastMonth}
          onFullYear={handleFullYear}
        />

        <Calendar
          data={attendanceData}
          isLoading={dataLoading}
          error={dataError}
          onRetry={handleRetry}
        />
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={handleLoginClose}
        onLogin={loginWithPassword}
        onCookieLogin={loginWithCookie}
        onSwitchMethod={switchLoginMethod}
        loginMethod={loginMethod}
        isLoading={authLoading}
        error={authError}
        prefillEmail={email || ''}
        isEmailDisabled={!!email}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        email={email}
      />
    </div>
  );
}

export default App;
