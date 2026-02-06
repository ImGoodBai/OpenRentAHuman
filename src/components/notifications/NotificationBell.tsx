'use client';

import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { useState } from 'react';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    setIsOpen(false);
    if (link) {
      window.location.href = link;
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      task_accepted: '✅',
      task_rejected: '❌',
      task_message: '💬',
      task_claimed: '👤',
      task_submitted: '📝',
    };
    return iconMap[type] || '📢';
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#7c7c7c] hover:text-[#1a1a1a] transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e0e0e0] rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-[#e0e0e0]">
              <h3 className="font-semibold text-[#1a1a1a]">通知</h3>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#7c7c7c]">
                暂无通知
              </div>
            ) : (
              <div className="divide-y divide-[#e0e0e0]">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() =>
                      handleNotificationClick(notification.id, notification.link)
                    }
                    className={`w-full text-left p-4 hover:bg-[#fafafa] transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1a1a1a] mb-1">
                          {notification.title}
                        </p>
                        {notification.content && (
                          <p className="text-sm text-[#7c7c7c] line-clamp-2">
                            {notification.content}
                          </p>
                        )}
                        <p className="text-xs text-[#7c7c7c] mt-1">
                          {new Date(notification.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="p-3 border-t border-[#e0e0e0] text-center">
                <Link
                  href="/notifications"
                  className="text-sm text-[#ff6719] hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  查看全部通知
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
