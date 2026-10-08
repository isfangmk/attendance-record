/**
 * 认证 Hook：登录态、邮箱与中文显示名
 */

import { useCallback, useEffect, useState } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

interface LoginUser {
  email: string;
  realName: string;
}

interface LoginResponse {
  msg: string;
  data?: LoginUser | null;
}

export const LoginMethod = {
  COOKIE: 'cookie',
  PASSWORD: 'password',
} as const;

export type LoginMethod = (typeof LoginMethod)[keyof typeof LoginMethod];

/**
 * 认证状态管理
 */
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('loggedInEmail'));
  const [email, setEmail] = useState(() => localStorage.getItem('loggedInEmail') || '');
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem('displayName') || '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    () => (localStorage.getItem('loginMethod') as LoginMethod) || LoginMethod.COOKIE,
  );

  const syncFromStorage = useCallback(() => {
    const nextEmail = localStorage.getItem('loggedInEmail') || '';
    const nextName = localStorage.getItem('displayName') || '';
    const nextMethod =
      (localStorage.getItem('loginMethod') as LoginMethod) || LoginMethod.COOKIE;
    setIsLoggedIn(!!nextEmail);
    setEmail(nextEmail);
    setDisplayName(nextName);
    setLoginMethod(nextMethod);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'loggedInEmail' || e.key === 'displayName' || e.key === 'loginMethod') {
        syncFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-state-changed', syncFromStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-state-changed', syncFromStorage);
    };
  }, [syncFromStorage]);

  const clearError = useCallback(() => setError(null), []);

  const applyLogin = useCallback((user: LoginUser, method: LoginMethod, cookie?: string) => {
    setIsLoggedIn(true);
    setEmail(user.email);
    setDisplayName(user.realName);
    localStorage.setItem('loggedInEmail', user.email);
    localStorage.setItem('displayName', user.realName);
    localStorage.setItem('loginMethod', method);
    if (cookie !== undefined) {
      localStorage.setItem('savedCookie', cookie);
    }
  }, []);

  const loginWithCookie = useCallback(
    async (cookie: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl(API_ENDPOINTS.COOKIE_LOGIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cookie }),
        });
        const data: LoginResponse = await response.json();
        if (data.msg === '登录成功' && data.data) {
          applyLogin(data.data, LoginMethod.COOKIE, cookie);
          return true;
        }
        setError(data.msg || 'Cookie登录失败');
        localStorage.removeItem('savedCookie');
        return false;
      } catch (err) {
        console.error('Cookie登录失败:', err);
        setError('网络异常，请稍后重试');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [applyLogin],
  );

  const loginWithPassword = useCallback(
    async (loginEmail: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl(API_ENDPOINTS.LOGIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password }),
        });
        const data: LoginResponse = await response.json();
        if (data.msg === '登录成功' && data.data) {
          applyLogin(data.data, LoginMethod.PASSWORD);
          return true;
        }
        setError(data.msg || '登录失败，请检查账号密码');
        return false;
      } catch (err) {
        console.error('登录失败:', err);
        setError('网络异常，请稍后重试');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [applyLogin],
  );

  const login = useCallback(
    async (loginEmail: string, password: string) => loginWithPassword(loginEmail, password),
    [loginWithPassword],
  );

  const switchLoginMethod = useCallback(
    (method: LoginMethod) => {
      setLoginMethod(method);
      clearError();
    },
    [clearError],
  );

  const logout = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      await fetch(getApiUrl(API_ENDPOINTS.LOGOUT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error('登出失败:', err);
    } finally {
      setIsLoggedIn(false);
      setEmail('');
      setDisplayName('');
      setLoginMethod(LoginMethod.COOKIE);
      localStorage.removeItem('loggedInEmail');
      localStorage.removeItem('displayName');
      localStorage.removeItem('loginMethod');
      localStorage.removeItem('savedCookie');
      clearError();
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    }
  }, [isLoggedIn, email, clearError]);

  return {
    isLoggedIn,
    email,
    displayName,
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
