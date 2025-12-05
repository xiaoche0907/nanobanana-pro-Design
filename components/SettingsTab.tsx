import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'empty'>('idle');

  useEffect(() => {
    const savedKey = localStorage.getItem('user_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setStatus('success');
    } else {
        setStatus('empty');
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem('user_api_key');
      setStatus('empty');
      return;
    }
    localStorage.setItem('user_api_key', apiKey.trim());
    setStatus('success');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="bg-pastel-card p-8 rounded-xl border border-pastel-border shadow-sm">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-pastel-text">
          <Settings className="w-6 h-6 text-pastel-highlight" />
          API 配置 (API Configuration)
        </h2>
        
        <p className="text-pastel-muted mb-8 text-sm">
          请输入您的 Google Gemini API Key 以启用所有 AI 功能。您的密钥将安全地存储在浏览器的本地存储中，不会被上传到其他服务器。<br/>
          Enter your Google Gemini API Key to power the AI features.
        </p>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-pastel-text">Google Gemini API Key</label>
          <div className="relative">
            <input
              type={isVisible ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-pastel-input border border-pastel-border rounded-lg py-3 pl-4 pr-12 text-pastel-text focus:border-pastel-pink focus:ring-1 focus:ring-pastel-pink outline-none shadow-sm transition-all"
            />
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-pastel-muted hover:text-pastel-highlight transition-colors"
            >
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {status === 'success' && (
                    <span className="flex items-center gap-1 text-sm font-medium text-green-500 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        <Check className="w-4 h-4" /> ✅ Key Saved (已保存)
                    </span>
                )}
                 {status === 'empty' && (
                    <span className="flex items-center gap-1 text-sm font-medium text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                        <AlertTriangle className="w-4 h-4" /> ⚠️ No Key Found (未检测到密钥)
                    </span>
                )}
            </div>

            <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-pastel-pink hover:bg-pastel-pinkhover text-pastel-text font-medium rounded-lg shadow-sm transition-all"
            >
                <Save className="w-4 h-4" />
                保存配置 (Save Configuration)
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;