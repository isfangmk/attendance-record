/**
 * 登录模态框组件
 * 提供用户登录界面，支持cookie和密码两种登录方式
 */

import React, { useState, useEffect } from 'react';
import { LoginMethod } from '../hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onCookieLogin: (cookie: string) => Promise<boolean>;
  onSwitchMethod: (method: LoginMethod) => void;
  loginMethod: LoginMethod;
  isLoading: boolean;
  error: string | null;
  prefillEmail?: string;
  isEmailDisabled?: boolean;
}

/**
 * 登录模态框组件
 * @param isOpen 是否显示模态框
 * @param onClose 关闭事件
 * @param onLogin 登录事件
 * @param isLoading 是否加载中
 * @param error 错误信息
 * @param prefillEmail 预填充邮箱
 * @param isEmailDisabled 是否禁用邮箱输入
 */
export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onCookieLogin,
  onSwitchMethod,
  loginMethod,
  isLoading,
  error,
  prefillEmail = '',
  isEmailDisabled = false,
}) => {
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [cookie, setCookie] = useState('');

  // 当预填充邮箱改变时更新本地状态
  useEffect(() => {
    setEmail(prefillEmail);
  }, [prefillEmail]);

  // 当模态框关闭时清空表单
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setCookie('');
    }
  }, [isOpen]);

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMethod === LoginMethod.COOKIE) {
      if (!cookie.trim()) return;
      const success = await onCookieLogin(cookie.trim());
      if (success) {
        onClose();
      }
    } else {
      if (!email || !password) return;
      const success = await onLogin(email, password);
      if (success) {
        onClose();
      }
    }
  };

  /**
   * 处理关闭按钮点击
   */
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  /**
   * 处理背景点击（不关闭，只能通过X按钮关闭）
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // 不执行任何操作，只能通过X按钮关闭
      e.stopPropagation();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        #cookie::placeholder {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 400;
          color: #94a3b8;
          font-size: 14px;
        }
        #cookie:-ms-input-placeholder {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 400;
          color: #94a3b8;
          font-size: 14px;
        }
        #cookie::-ms-input-placeholder {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-weight: 400;
          color: #94a3b8;
          font-size: 14px;
        }
      `}</style>
    <div 
      className="fixed inset-0 bg-gradient-to-br from-neutral-900/70 to-primary/20 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="login-card bg-white/95 rounded-2xl w-full max-w-md p-8 transform transition-all">
        {/* 头部 */}
        <div className="relative mb-6">
          <div>
            <h3 className="text-2xl font-bold text-neutral-800 tracking-tight">欢迎回来</h3>
            <p className="text-neutral-500 mt-2">请登录您的账号Moka以继续使用</p>
          </div>
          
          {/* 登录方式切换 */}
          <div className="mt-4 p-1 bg-gray-100 rounded-lg">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => onSwitchMethod(LoginMethod.COOKIE)}
                className={`py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  loginMethod === LoginMethod.COOKIE
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="fa fa-globe mr-2"></i>
                Cookie登录
              </button>
              <button
                type="button"
                onClick={() => onSwitchMethod(LoginMethod.PASSWORD)}
                className={`py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  loginMethod === LoginMethod.PASSWORD
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className="fa fa-key mr-2"></i>
                密码登录
              </button>
            </div>
          </div>
          {/* 关闭按钮 - 绝对定位在右上角 */}
          <button 
            onClick={handleClose}
            className="absolute top-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            disabled={isLoading}
            aria-label="关闭"
          >
            <i className="fa fa-times"></i>
          </button>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cookie登录输入 */}
          {loginMethod === LoginMethod.COOKIE && (
            <div className="space-y-2">
              <label htmlFor="cookie" className="block text-sm font-medium text-neutral-700">
                Cookie
                <span className="ml-2 text-xs text-slate-400 font-light">（从浏览器开发者工具中获取）</span>
              </label>
              <textarea
                id="cookie"
                name="cookie"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                disabled={isLoading}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono text-sm"
                placeholder="请粘贴完整的Cookie字符串"
              />
            </div>
          )}

          {/* 密码登录输入 */}
          {loginMethod === LoginMethod.PASSWORD && (
            <>
              {/* 邮箱输入 */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                  邮箱
                </label>
                <div className="relative">
                  <i className="fa fa-envelope-o absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailDisabled || isLoading}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="请输入邮箱"
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                    密码
                  </label>
                  <a 
                    href="https://core.mokahr.com/user/login" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="forget-password text-sm text-neutral-500 hover:text-primary transition"
                  >
                    忘记密码?
                  </a>
                </div>
                <div className="relative">
                  <i className="fa fa-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="请输入密码"
                  />
                </div>
              </div>
            </>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="login-error text-danger text-sm">
              <i className="fa fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* 登录按钮 */}
          <button 
            type="submit" 
            disabled={isLoading || (loginMethod === LoginMethod.COOKIE ? !cookie.trim() : (!email || !password))}
            className={`login-btn w-full text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
            style={{
              background: 'linear-gradient(135deg, #165DFF 0%, #0F4CD0 100%)',
            }}
          >
            <span>{isLoading ? '登录中...' : (loginMethod === LoginMethod.COOKIE ? 'Cookie登录' : '密码登录')}</span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>
        </form>
      </div>
    </div>
    </>
  );
};