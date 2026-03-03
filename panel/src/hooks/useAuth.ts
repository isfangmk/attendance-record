/**
 * 认证相关的自定义Hook
 * 管理用户登录状态、登录、登出等功能
 */

import { useState, useCallback, useEffect } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

// 登录响应接口
interface LoginResponse {
  msg: string;
  data?: any;
}

// 登录方式常量
export const LoginMethod = {
  COOKIE: 'cookie',
  PASSWORD: 'password'
} as const;

export type LoginMethod = typeof LoginMethod[keyof typeof LoginMethod];

/**
 * 认证状态管理Hook
 * @returns 认证相关的状态和方法
 */
export const useAuth = () => {
  // 从localStorage获取已登录邮箱
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('loggedInEmail');
  });
  
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('loggedInEmail') || '';
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(() => {
    return (localStorage.getItem('loginMethod') as LoginMethod) || LoginMethod.COOKIE;
  }); // 默认使用cookie登录

  // 监听storage事件和自定义事件，同步登录状态
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loggedInEmail') {
        const newEmail = e.newValue || '';
        setIsLoggedIn(!!newEmail);
        setEmail(newEmail);
      }
      if (e.key === 'loginMethod') {
        setLoginMethod((e.newValue as LoginMethod) || LoginMethod.COOKIE);
      }
    };

    const handleAuthStateChange = () => {
      const newEmail = localStorage.getItem('loggedInEmail') || '';
      const newLoginMethod = (localStorage.getItem('loginMethod') as LoginMethod) || LoginMethod.COOKIE;
      setIsLoggedIn(!!newEmail);
      setEmail(newEmail);
      setLoginMethod(newLoginMethod);
    };

    // 监听storage事件和自定义事件
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 使用cookie登录
   * @param cookie cookie字符串
   * @returns 登录是否成功
   */
  const loginWithCookie = useCallback(async (cookie: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.COOKIE_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cookie: cookie,
        }),
      });

      const data: LoginResponse = await response.json();

      if (data.msg === '登录成功') {
        const userEmail = data.data;
        setIsLoggedIn(true);
        setEmail(userEmail);
        localStorage.setItem('loggedInEmail', userEmail);
        localStorage.setItem('loginMethod', LoginMethod.COOKIE);
        return true;
      } else {
        const errorMsg = data.msg || 'Cookie登录失败';
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Cookie登录失败:', err);
      setError('网络异常，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 使用用户名密码登录
   * @param loginEmail 邮箱
   * @param password 密码
   * @returns 登录是否成功
   */
  const loginWithPassword = useCallback(async (loginEmail: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (data.msg === '登录成功') {
        setIsLoggedIn(true);
        setEmail(loginEmail);
        localStorage.setItem('loggedInEmail', loginEmail);
        localStorage.setItem('loginMethod', LoginMethod.PASSWORD);
        return true;
      } else {
        const errorMsg = data.msg || '登录失败，请检查账号密码';
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('登录失败:', err);
      setError('网络异常，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 用户登录（保持向后兼容）
   * @param loginEmail 邮箱
   * @param password 密码
   * @returns 登录是否成功
   */
  const login = useCallback(async (loginEmail: string, password: string): Promise<boolean> => {
    return await loginWithPassword(loginEmail, password);
  }, [loginWithPassword]);

  /**
   * 切换登录方式
   */
  const switchLoginMethod = useCallback((method: LoginMethod) => {
    setLoginMethod(method);
    clearError();
  }, [clearError]);

  /**
   * 用户登出
   */
  const logout = useCallback(async (): Promise<void> => {
    if (!isLoggedIn) return;

    try {
      // 调用后端登出接口
      await fetch(getApiUrl(API_ENDPOINTS.LOGOUT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });
    } catch (err) {
      console.error('登出失败:', err);
    } finally {
      // 无论后端调用是否成功，都清除本地状态
      setIsLoggedIn(false);
      setEmail('');
      setLoginMethod(LoginMethod.COOKIE);
      localStorage.removeItem('loggedInEmail');
      localStorage.removeItem('loginMethod');
      clearError();
      // 触发自定义事件，确保其他组件也能感知到状态变化
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    }
  }, [isLoggedIn, email, clearError]);

  return {
    isLoggedIn,
    email,
    isLoading,
    error,
    login,
    loginWithCookie,
    loginWithPassword,
    switchLoginMethod,
    loginMethod,
    logout,
    clearError,
  };
};