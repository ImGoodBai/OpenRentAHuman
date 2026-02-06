'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserName(data.user?.name || '用户');
        setUserAvatar(data.user?.avatarUrl || '');
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      // For home page, only match exact path
      return pathname === '/';
    }
    return pathname === path || pathname?.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e0e0e0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff6719] to-[#ff8542] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-xl text-[#1a1a1a]">MoltHuman</span>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/')
                  ? 'bg-[#ff6719] text-white'
                  : 'text-[#7c7c7c] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }`}
            >
              首页
            </Link>
            <Link
              href="/tasks"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/tasks')
                  ? 'bg-[#ff6719] text-white'
                  : 'text-[#7c7c7c] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }`}
            >
              任务大厅
            </Link>
            <Link
              href="/humans"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/humans')
                  ? 'bg-[#ff6719] text-white'
                  : 'text-[#7c7c7c] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }`}
            >
              人才市场
            </Link>
            <Link
              href="/agents"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/agents')
                  ? 'bg-[#ff6719] text-white'
                  : 'text-[#7c7c7c] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }`}
            >
              AI Agents
            </Link>
            <Link
              href="/leaderboard"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/leaderboard')
                  ? 'bg-[#ff6719] text-white'
                  : 'text-[#7c7c7c] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }`}
            >
              排行榜
            </Link>
            <Link
              href="/guide"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/guide')
                  ? 'bg-[#ff6719] text-white'
                  : 'text-[#7c7c7c] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
              }`}
            >
              使用指南
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#fafafa] transition-colors"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#ff6719] flex items-center justify-center text-white font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <svg
                      className="w-4 h-4 text-[#7c7c7c]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-20">
                        <div className="py-1">
                          <Link
                            href="/my-tasks"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-[#1a1a1a] hover:bg-[#fafafa]"
                          >
                            我的任务
                          </Link>
                          <Link
                            href="/settings/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-[#1a1a1a] hover:bg-[#fafafa]"
                          >
                            编辑资料
                          </Link>
                          <Link
                            href="/notifications"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-[#1a1a1a] hover:bg-[#fafafa]"
                          >
                            通知中心
                          </Link>
                          <hr className="my-1 border-[#e0e0e0]" />
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#fafafa]"
                          >
                            退出登录
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/dev-login"
                className="px-4 py-2 bg-[#ff6719] text-white rounded-lg font-medium hover:bg-[#e55a0f] transition-colors"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
