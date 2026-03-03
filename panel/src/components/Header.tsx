/**
 * 头部导航组件
 * 显示应用标题、用户信息和登录/登出功能
 */

import React from 'react';

interface HeaderProps {
  userEmail?: string;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

/**
 * 头部导航组件
 * @param userEmail 用户邮箱
 * @param onLoginClick 登录按钮点击事件
 * @param onLogoutClick 登出按钮点击事件
 */
export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onLoginClick,
  onLogoutClick,
}) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto max-w-[min(85vw,1020px)] px-4 py-3 flex items-center justify-between">
        {/* 左侧标题区域 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
            <i className="fa fa-calendar-check-o text-xl"></i>
          </div>
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-bold text-neutral-700">
            出勤统计面板
          </h1>
        </div>

        {/* 右侧用户信息区域 */}
        <div className="flex items-center gap-4">
          {userEmail ? (
            <>
              {/* 用户信息显示（不可点击） */}
              <div className="hidden md:flex items-center gap-2 text-neutral-600">
                <i className="fa fa-user-o"></i>
                <span className="font-medium">{userEmail.split('@')[0]}</span>
              </div>
              {/* 退出按钮 */}
              <button
                onClick={onLogoutClick}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="退出登录"
              >
                <i className="fa fa-sign-out"></i>
                <span className="hidden sm:inline">退出</span>
              </button>
            </>
          ) : (
            /* 登录按钮 */
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <i className="fa fa-sign-in"></i>
              <span>登录</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};