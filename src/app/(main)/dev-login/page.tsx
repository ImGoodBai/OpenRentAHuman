'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

export default function DevLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
      });

      if (response.ok) {
        // 登录成功，跳转回任务页面
        router.push('/tasks');
      } else {
        toast.error('Dev login failed');
      }
    } catch (error) {
      console.error('Dev login error:', error);
      toast.error('Dev login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-4">开发者快速登录</h1>
        <p className="text-[#7c7c7c] mb-6">
          这是一个测试辅助功能，仅在开发环境可用。点击下方按钮即可快速登录为测试用户。
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ 此功能仅用于开发测试，与实际 Google 登录流程完全一致（相同的 session、权限、用户数据结构）
          </p>
        </div>

        <button
          onClick={handleDevLogin}
          disabled={isLoading}
          className="w-full bg-[#ff6719] text-white py-3 rounded-lg font-semibold hover:bg-[#e55a0f] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? '登录中...' : '快速登录为测试用户'}
        </button>

        <div className="mt-6 text-sm text-[#7c7c7c]">
          <p className="font-semibold mb-2">测试用户信息：</p>
          <ul className="space-y-1">
            <li>• 邮箱: dev-test@example.com</li>
            <li>• 名称: Dev Test User</li>
            <li>• Google ID: dev-google-123456789</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
