import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { apiService } from '../services/apiService';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      const isValid = await apiService.verifyPassword(password);
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-xl font-serif font-bold text-ink-900 mb-2">身份验证</h3>
          <p className="text-sm text-ink-500 mb-6">此为公开展示区域，请输入访问密码以继续操作。</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="请输入密码"
                className={`w-full p-3 bg-ink-50 border rounded-md outline-none font-serif tracking-widest text-center transition-colors ${
                  error ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-300' : 'border-ink-200 focus:border-ink-500'
                }`}
              />
              {error && <p className="text-xs text-red-500 mt-2 text-center">密码错误，请重试</p>}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-sm">
                取消
              </Button>
              <Button type="submit" className="flex-1 text-sm" isLoading={isLoading}>
                确认
              </Button>
            </div>
          </form>
        </div>
        <div className="h-1 bg-ink-100 w-full overflow-hidden">
          <div className="h-full bg-ink-900 w-full origin-left transform scale-x-0 transition-transform duration-500" style={{ transform: error ? 'scaleX(1)' : 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
};