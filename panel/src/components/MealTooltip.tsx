/**
 * 餐补提示框组件
 * 显示餐补日期详情
 */

import React, { useEffect, useCallback } from 'react';
import { generateMealApplicationText } from '../utils/mealUtils';

interface MealTooltipProps {
  isVisible: boolean;
  mealDates: number[];
  year: number;
  month: number; // 0-11
  onClose: () => void;
}

/**
 * 餐补提示框组件
 * @param isVisible 是否显示
 * @param mealDates 餐补日期数组
 * @param year 年份
 * @param month 月份（0-11）
 * @param onClose 关闭事件
 */
export const MealTooltip: React.FC<MealTooltipProps> = ({
  isVisible,
  mealDates,
  year,
  month,
  onClose,
}) => {

  // 转换为显示月份（1-12）
  const displayMonth = month + 1;

  // 生成餐补申请文本
  const applicationText = generateMealApplicationText(year, displayMonth, mealDates);



  /**
   * 处理点击外部关闭
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.meal-tooltip-container')) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isVisible, onClose]);

  /**
   * 处理提示框内部点击，阻止事件冒泡
   */
  const handleTooltipClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="meal-tooltip-container absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 md:w-80 z-50" onClick={handleTooltipClick}>
      <div className="tooltip show bg-white rounded-lg shadow-tooltip p-4 border border-neutral-100">
        {/* 箭头 */}
        <div className="tooltip-arrow"></div>
        
        <div className="meal-tooltip-content">
          {/* 标题 */}
          <div className="space-y-3">
            <h4 className="font-medium text-neutral-800 flex items-center">
              <i className="fa fa-cutlery text-overtime mr-2"></i>
              餐补申请明细
            </h4>

            {/* 内容 */}
            <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {applicationText}
            </div>

            {/* 提示信息 */}
            <div className="mt-2 text-xs text-neutral-500 bg-neutral-50 p-2 rounded">
              <i className="fa fa-lightbulb-o mr-1"></i>
              提示：餐补标准为20元/天，需根据公司规定提交申请
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};