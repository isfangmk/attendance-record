/**
 * API配置文件
 * 统一管理API地址和相关配置
 */

/** 应用访问前缀，与后端 ROOT_PATH 保持一致 */
export const APP_BASE_PATH = '/attendance-record';

/**
 * 获取API基础地址
 * @returns API基础地址
 */
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量配置
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // 开发/生产环境默认：带前缀的 API 路径
  return `${APP_BASE_PATH}/api`;
};

/**
 * API端点配置
 */
export const API_ENDPOINTS = {
  // 认证相关
  COOKIE_LOGIN: '/cookie-login',
  LOGIN: '/login',
  LOGOUT: '/logout',
  
  // 出勤数据
  ATTENDANCE: '/attendance',
} as const;

/**
 * 完整的API URL生成器
 * @param endpoint API端点
 * @returns 完整的API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};