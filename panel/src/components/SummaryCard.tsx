/**
 * 统计概览卡片组件
 * 显示出勤相关的各项统计数据
 */

import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'amber' | 'overtime';
  isLoading?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  isClickable?: boolean;
  showClickIcon?: boolean; // 是否显示点击图标
}

/**
 * 统计卡片组件
 * @param title 卡片标题
 * @param value 显示数值
 * @param subtitle 副标题
 * @param icon 图标类名
 * @param color 主题颜色
 * @param isLoading 是否加载中
 * @param onClick 点击事件
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  isLoading = false,
  onClick,
  isClickable = true,
  showClickIcon = false,
}) => {
  // 根据颜色主题获取背景色和图标颜色
  const getColorClasses = () => {
    const colorMap = {
      primary: {
        bg: 'bg-primary/10',
        text: 'text-primary',
      },
      success: {
        bg: 'bg-success/10',
        text: 'text-success',
      },
      warning: {
        bg: 'bg-warning/10',
        text: 'text-warning',
      },
      info: {
        bg: 'bg-info/10',
        text: 'text-info',
      },
      amber: {
        bg: 'bg-amber/10',
        text: 'text-amber',
      },
      overtime: {
        bg: 'bg-overtime/10',
        text: 'text-overtime',
      },
    };
    return colorMap[color];
  };

  const colorClasses = getColorClasses();

  return (
    <div 
      className={`bg-white rounded-xl shadow-card p-5 ${
        isClickable && onClick ? 'hover:shadow-card-hover' : ''
      } transition-all duration-300 relative`}
    >
      {/* 卡片头部 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-neutral-500 font-medium">{title}</h3>
        <div className={`w-10 h-10 rounded-lg ${colorClasses.bg} flex items-center justify-center ${colorClasses.text}`}>
          <i className={`fa ${icon}`}></i>
        </div>
      </div>

      {/* 数值显示 */}
      <p 
        className={`text-[clamp(1.5rem,3vw,2rem)] font-bold text-neutral-700 ${
          isClickable && onClick ? 'cursor-pointer hover:text-primary' : 'cursor-default'
        }`}
        onClick={isClickable && onClick ? onClick : undefined}
      >
        {isLoading ? (
          <span className="loading-skeleton inline-block w-16 h-8 rounded"></span>
        ) : (
          <>
            {value}
            {showClickIcon && (
              <i className="fa fa-info-circle text-xs ml-1 text-overtime/70"></i>
            )}
          </>
        )}
      </p>

      {/* 副标题 */}
      {subtitle && <p className="text-neutral-400 text-sm">{subtitle}</p>}
    </div>
  );
};