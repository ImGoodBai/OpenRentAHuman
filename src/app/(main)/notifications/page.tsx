'use client';

import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications();

  const handleNotificationClick = (notificationId: string, isRead: boolean, link?: string) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
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

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      task_accepted: '任务采纳',
      task_rejected: '任务拒绝',
      task_message: '任务留言',
      task_claimed: '任务领取',
      task_submitted: '任务提交',
    };
    return typeMap[type] || '通知';
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e0]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">通知中心</h1>
          <p className="text-[#7c7c7c]">
            {unreadCount > 0 ? `您有 ${unreadCount} 条未读通知` : '所有通知已读'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-[#7c7c7c]">加载中...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">暂无通知</h2>
            <p className="text-[#7c7c7c]">当有新的任务动态时，我们会在这里通知您</p>
            <Link
              href="/tasks"
              className="inline-block mt-6 px-6 py-3 bg-[#ff6719] text-white rounded-lg font-medium hover:bg-[#e55a0f] transition-colors"
            >
              浏览任务
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() =>
                  handleNotificationClick(
                    notification.id,
                    notification.isRead,
                    notification.link
                  )
                }
                className={`w-full text-left bg-white border border-[#e0e0e0] rounded-lg p-6 hover:shadow-md transition-all ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff6719] to-[#ff8542] rounded-full flex items-center justify-center text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#ff6719] bg-[#fff5f0] px-2 py-1 rounded">
                        {getTypeText(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>

                    <h3 className="font-semibold text-[#1a1a1a] mb-2">
                      {notification.title}
                    </h3>

                    {notification.content && (
                      <p className="text-[#7c7c7c] mb-3 whitespace-pre-wrap">
                        {notification.content}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-[#7c7c7c]">
                      <span>
                        {new Date(notification.createdAt).toLocaleString('zh-CN')}
                      </span>
                      {notification.link && (
                        <span className="text-[#ff6719]">点击查看详情 →</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Back Link */}
        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block text-[#ff6719] hover:underline"
            >
              ← 返回首页
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
