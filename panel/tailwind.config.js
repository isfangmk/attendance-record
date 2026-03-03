/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#165DFF',
        success: '#36D399',
        warning: '#E53E3E', // 早退状态颜色（红色）
        danger: '#F87272',
        info: '#FF6B35', // 请假状态颜色（橙色）
        amber: '#F59E0B', // 外出状态颜色（琥珀色）
        overtime: '#722ED1', // 餐补状态颜色（深紫色）
        neutral: {
          100: '#F5F7FA',
          200: '#E4E7ED',
          300: '#C0C6CF',
          400: '#909399',
          500: '#606266',
          600: '#303133',
          700: '#1E1E1E',
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 30px 0 rgba(0, 0, 0, 0.1)',
        'tooltip': '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

