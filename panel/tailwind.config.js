/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 品牌色（按钮/导航，不参与状态图例）
        primary: '#165DFF',
        // 出勤状态色：色相环 + 冷暖/明度错开，图例一眼可辨
        success: '#16A34A', // 正常出勤 · 翠绿
        warning: '#E11D48', // 早退 · 玫红
        working: '#0EA5E9', // 进行中 · 天蓝（避开品牌蓝）
        overtime: '#C026D3', // 餐补 · 品红紫
        info: '#F59E0B', // 请假 · 琥珀
        outing: '#0891B2', // 外出 · 青
        rest: '#57534E', // 双休日 / 假期 · 暖石灰
        absent: '#CBD5E1', // 未打卡 · 浅冷灰
        danger: '#F87272',
        neutral: {
          100: '#F5F7FA',
          200: '#E4E7ED',
          300: '#C0C6CF',
          400: '#909399',
          500: '#606266',
          600: '#303133',
          700: '#1E1E1E',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 30px 0 rgba(0, 0, 0, 0.1)',
        tooltip:
          '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
