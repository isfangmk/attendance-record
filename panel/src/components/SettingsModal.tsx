/**
 * 提醒配置弹窗（按当前登录用户隔离）
 */

import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINTS, getApiUrl } from '../config/api';

interface ReminderSettings {
  wechatWebhookUrl: string;
  checkinCronHour: number;
  checkinCronMinute: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 当前登录邮箱，用于读写该用户专属配置 */
  email: string;
}

/**
 * 提醒配置：Webhook、提醒时间
 */
export const SettingsModal = ({ isOpen, onClose, email }: SettingsModalProps) => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!email) {
      setError('请先登录后再配置提醒');
      setSettings(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${getApiUrl(API_ENDPOINTS.SETTINGS)}?email=${encodeURIComponent(email)}`,
      );
      const body = await response.json();
      if (body.data) {
        setSettings({
          wechatWebhookUrl: body.data.wechatWebhookUrl,
          checkinCronHour: body.data.checkinCronHour,
          checkinCronMinute: body.data.checkinCronMinute,
        });
      } else {
        setError(body.msg || '加载配置失败');
      }
    } catch {
      setError('网络异常，无法加载配置');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setError(null);
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  const handleSave = async () => {
    if (!settings || !email) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.SETTINGS), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...settings }),
      });
      const body = await response.json();
      if (body.msg === '保存成功' && body.data) {
        setSettings(body.data);
        setMessage('提醒配置已保存（仅当前账号生效）');
      } else {
        setError(body.msg || '保存失败');
      }
    } catch {
      setError('网络异常，保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings || !email) return;
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.TEST_WEBHOOK), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          wechatWebhookUrl: settings.wechatWebhookUrl,
        }),
      });
      const body = await response.json();
      if (body.msg === '测试消息已发送') {
        setMessage('测试消息已发送，请查看企业微信群');
      } else {
        setError(body.msg || '测试失败');
      }
    } catch {
      setError('网络异常，测试失败');
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-neutral-900/70 to-primary/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-neutral-800">提醒配置</h3>
            <p className="text-sm text-neutral-500 mt-1">
              {email ? `账号：${email}` : '请先登录'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="关闭"
          >
            <i className="fa fa-times" />
          </button>
        </div>

        {!email ? (
          <div className="py-10 text-center text-neutral-500">请先登录后再配置专属提醒</div>
        ) : loading || !settings ? (
          <div className="py-10 text-center text-neutral-500">
            <i className="fa fa-circle-o-notch fa-spin mr-2" />
            加载中...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                企业微信 Webhook
              </label>
              <textarea
                value={settings.wechatWebhookUrl}
                onChange={(e) =>
                  setSettings({ ...settings, wechatWebhookUrl: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  提醒小时（0-23）
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.checkinCronHour}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      checkinCronHour: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  提醒分钟（0-59）
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={settings.checkinCronMinute}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      checkinCronMinute: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {message && (
              <div className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">
                {message}
              </div>
            )}
            {error && (
              <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !settings.wechatWebhookUrl}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {testing ? '发送中...' : '发送测试消息'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
