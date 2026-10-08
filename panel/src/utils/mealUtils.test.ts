/**
 * 餐补工具单测
 */

import { describe, expect, it } from 'vitest';
import {
  extractMealDates,
  formatMealDates,
  generateMealApplicationText,
} from './mealUtils';
import type { DayRecord } from '../types/attendance';

const day = (partial: Partial<DayRecord> & Pick<DayRecord, 'day' | 'status'>): DayRecord => ({
  weekday: 0,
  isRestDay: false,
  punches: [],
  workHours: 0,
  leaveDays: 0,
  outingDays: 0,
  ...partial,
});

describe('extractMealDates', () => {
  it('只提取 meal_allowance 日期', () => {
    const dates = extractMealDates([
      day({ day: 2, status: 'meal_allowance' }),
      day({ day: 3, status: 'present' }),
      day({ day: 10, status: 'meal_allowance' }),
    ]);
    expect(dates).toEqual([2, 10]);
  });
});

describe('formatMealDates', () => {
  it('格式化为 MM-DD', () => {
    expect(formatMealDates([2, 10], 3)).toBe('03-02 03-10');
  });
});

describe('generateMealApplicationText', () => {
  it('无记录时提示暂无', () => {
    expect(generateMealApplicationText(2026, 3, [])).toContain('暂无');
  });

  it('有记录时包含天数与金额', () => {
    const text = generateMealApplicationText(2026, 3, [2]);
    expect(text).toContain('03-02');
    expect(text).toContain('共1天');
    expect(text).toContain('20元');
  });
});
