/**
 * 主应用组件
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAttendanceData } from './hooks/useAttendanceData';
import { extractMealDates } from './utils/mealUtils';
import { Header } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { MonthNavigation } from './components/MonthNavigation';
import { Calendar } from './components/Calendar';
import { LoginModal } from './components/LoginModal';
import { MealTooltip } from './components/MealTooltip';

/**
 * 主应用组件
 */
function App() {
  // 认证状态管理
  const { 
    isLoggedIn, 
    email, 
    isLoading: authLoading, 
    error: authError, 
    loginWithCookie, 
    loginWithPassword,
    switchLoginMethod,
    loginMethod,
    logout, 
    clearError 
  } = useAuth();

  // 出勤数据管理
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

  // UI状态管理
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMealTooltip, setShowMealTooltip] = useState(false);

  // 餐补相关状态
  const [mealDates, setMealDates] = useState<number[]>([]);

  // 加载当前月份的出勤数据
  useEffect(() => {
    loadData(currentYear, currentMonth, email);
  }, [currentYear, currentMonth, email, loadData]);

  // 更新餐补日期数据
  useEffect(() => {
    if (attendanceData?.days) {
      const dates = extractMealDates(attendanceData.days);
      setMealDates(dates);
    } else {
      setMealDates([]);
    }
  }, [attendanceData]);

  // 处理登录点击
  const handleLoginClick = useCallback(() => {
    setShowLoginModal(true);
    clearError();
  }, [clearError]);

  // 处理登录关闭
  const handleLoginClose = useCallback(() => {
    setShowLoginModal(false);
    clearError();
  }, [clearError]);

  // 处理登出
  const handleLogout = useCallback(async () => {
    await logout();
    setShowMealTooltip(false);
  }, [logout]);

  // 处理餐补卡片点击
  const handleMealCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('餐补卡片被点击', { isLoggedIn, showMealTooltip, mealDatesLength: mealDates.length });
    
    if (!isLoggedIn) {
      // 未登录时不做任何操作
      return;
    }
    
    // 切换提示框显示状态
    const newState = !showMealTooltip;
    setShowMealTooltip(newState);
    console.log('设置餐补提示框状态:', newState);
  }, [isLoggedIn, showMealTooltip, mealDates.length]);

  // 处理餐补提示框关闭
  const handleMealTooltipClose = useCallback(() => {
    setShowMealTooltip(false);
  }, []);



  // 处理重试
  const handleRetry = useCallback(() => {
    loadData(currentYear, currentMonth, email);
  }, [loadData, currentYear, currentMonth, email]);

  // 处理全年按钮点击
  const handleFullYear = useCallback(() => {
    alert('全年视图功能请联系后端开发扩展支持');
  }, []);

  // 获取统计数据，如果未登录则显示默认值
  const getSummaryValue = (key: 'totalAttendance' | 'avgHours' | 'earlyLeaveCount' | 'leaveDays' | 'outDays' | 'overtimeDays' | 'workDays') => {
    if (!attendanceData?.summary) {
      return '-';
    }
    return attendanceData.summary[key];
  };

  return (
    <div className="font-inter bg-neutral-100 text-neutral-700 min-h-screen flex flex-col">
      {/* 头部导航 */}
      <Header
        userEmail={email}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
      />

      {/* 主内容区 */}
      <main className="flex-grow container mx-auto max-w-[min(85vw,1020px)] px-4 py-6">
        {/* 统计概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {/* 本月出勤 */}
          <SummaryCard
            title="本月出勤"
            value={getSummaryValue('totalAttendance')}
            subtitle={`共${getSummaryValue('workDays')}个工作日`}
            icon="fa-check"
            color="primary"
            isLoading={dataLoading}
          />

          {/* 平均时长 */}
          <SummaryCard
            title="平均时长"
            value={getSummaryValue('avgHours')}
            subtitle="小时/天"
            icon="fa-clock-o"
            color="success"
            isLoading={dataLoading}
          />

          {/* 早退次数 */}
          <SummaryCard
            title="早退次数"
            value={getSummaryValue('earlyLeaveCount')}
            subtitle="需注意出勤规范"
            icon="fa-exclamation-triangle"
            color="warning"
            isLoading={dataLoading}
          />

          {/* 请假天数 */}
          <SummaryCard
            title="请假天数"
            value={getSummaryValue('leaveDays')}
            subtitle="不区分请假类型"
            icon="fa-calendar-o"
            color="info"
            isLoading={dataLoading}
          />

          {/* 外出天数 */}
          <SummaryCard
            title="外出天数"
            value={getSummaryValue('outDays')}
            subtitle="因公外出记录"
            icon="fa-sign-out"
            color="amber"
            isLoading={dataLoading}
          />

          {/* 餐补天数 */}
          <div className="relative">
            <SummaryCard
              title="餐补天数"
              value={isLoggedIn ? mealDates.length : "-"}
              subtitle="点击数字可以复制餐补数据"
              icon="fa-cutlery"
              color="overtime"
              isLoading={dataLoading}
              onClick={handleMealCardClick}
              isClickable={isLoggedIn}
            />
            
            {/* 餐补提示框 */}
            {isLoggedIn && (
              <MealTooltip
                isVisible={showMealTooltip}
                mealDates={mealDates}
                year={currentYear}
                month={currentMonth}
                onClose={handleMealTooltipClose}
              />
            )}
          </div>
        </div>

        {/* 月份导航 */}
        <MonthNavigation
          currentYear={currentYear}
          currentMonth={currentMonth}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onCurrentMonth={goToCurrentMonth}
          onLastMonth={goToLastMonth}
          onFullYear={handleFullYear}
        />

        {/* 日历组件 */}
        <Calendar
          data={attendanceData}
          isLoading={dataLoading}
          error={dataError}
          onRetry={handleRetry}
        />
      </main>

      {/* 登录模态框 */}
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
    </div>
  );
}

export default App;