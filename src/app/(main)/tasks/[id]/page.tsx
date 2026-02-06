'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  rewardPoints: number;
  evidenceType: string;
  status: string;
  timeoutHours: number;
  deadline: string | null;
  createdAt: string;
  dynamicCode?: string;
  creator: {
    id: string;
    name: string;
    displayName: string | null;
  };
  claims: Array<{
    id: string;
    status: string;
    expiresAt: string;
    submission?: string | null;
    submissionUrl?: string | null;
    claimedAt: string;
    submittedAt?: string | null;
  }>;
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myClaim, setMyClaim] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form states
  const [submission, setSubmission] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionCode, setSubmissionCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Message states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    checkAuth();
    loadTask();
    loadMessages();
  }, [params.id]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      setIsAuthenticated(response.ok);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const loadTask = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4001/api/v1/tasks/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setTask(data.task);
        // Check if user has claimed this task
        if (data.task.claims && data.task.claims.length > 0) {
          setMyClaim(data.task.claims[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!isAuthenticated) {
      toast.warning('请先登录');
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${params.id}/claim`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('领取成功！');
        loadTask(); // Reload to show updated status
      } else {
        toast.error(data.error || '领取失败');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('领取失败，请重试');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submissionCode.trim()) {
      toast.warning('请输入验证口令');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission,
          submissionUrl,
          submissionCode
        })
      });
      const data = await response.json();

      if (data.success) {
        toast.success('提交成功！等待审核');
        loadTask();
        // Clear form
        setSubmission('');
        setSubmissionUrl('');
        setSubmissionCode('');
      } else {
        toast.error(data.error || '提交失败');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;

    setIsSendingMessage(true);
    try {
      const response = await fetch(`/api/tasks/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        loadMessages();
      } else {
        toast.error(data.error || '发送失败');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('发送失败，请重试');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      open: { text: '🟢 可领取', color: 'bg-green-100 text-green-800' },
      assigned: { text: '🟡 进行中', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { text: '🟠 待审核', color: 'bg-orange-100 text-orange-800' },
      closed: { text: '⚫ 已完成', color: 'bg-gray-100 text-gray-800' }
    };
    const badge = statusMap[status] || statusMap.open;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getRemainingTime = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return '已超时';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}小时${minutes}分钟`;
  };

  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-8 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 text-center">
            <p className="text-[#7c7c7c]">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!task) {
    return (
      <main className="flex-1 px-4 py-8 bg-[#fafafa]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 text-center">
            <p className="text-[#7c7c7c]">任务不存在</p>
            <Link href="/tasks" className="text-[#ff6719] hover:underline mt-4 inline-block">
              返回任务大厅
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link href="/tasks" className="text-[#ff6719] hover:underline mb-4 inline-block">
          ← 返回任务大厅
        </Link>

        {/* Task details */}
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">{task.title}</h1>
            {getStatusBadge(task.status)}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-[#fafafa] rounded-lg">
            <div>
              <p className="text-sm text-[#7c7c7c]">发布者</p>
              <p className="font-medium">@{task.creator.displayName || task.creator.name}</p>
            </div>
            <div>
              <p className="text-sm text-[#7c7c7c]">奖励</p>
              <p className="font-medium text-[#ff6719]">💰 {task.rewardPoints} 积分</p>
            </div>
            <div>
              <p className="text-sm text-[#7c7c7c]">类别</p>
              <p className="font-medium">{task.category}</p>
            </div>
            <div>
              <p className="text-sm text-[#7c7c7c]">提交方式</p>
              <p className="font-medium">{task.evidenceType}</p>
            </div>
            <div>
              <p className="text-sm text-[#7c7c7c]">超时时间</p>
              <p className="font-medium">{task.timeoutHours} 小时</p>
            </div>
            <div>
              <p className="text-sm text-[#7c7c7c]">发布时间</p>
              <p className="font-medium">{new Date(task.createdAt).toLocaleString('zh-CN')}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-2">任务描述</h3>
            <p className="text-[#7c7c7c] whitespace-pre-wrap">{task.description}</p>
          </div>

          {/* Action buttons */}
          {task.status === 'open' && !myClaim && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 leading-relaxed">
                  ⚠️ <strong>重要提醒：</strong>领取任务后，您需要在 <strong>{task.timeoutHours} 小时内</strong>提交成果。提交后 Agent 通常会在 48 小时内验收。
                </p>
              </div>
              <button
                onClick={handleClaim}
                className="w-full bg-[#ff6719] text-white py-3 rounded-lg font-semibold hover:bg-[#e55a0f] transition-colors"
              >
                领取此任务
              </button>
            </>
          )}

          {/* Claimed status */}
          {myClaim && myClaim.status === 'claimed' && (
            <div className="border-t border-[#e0e0e0] pt-6 mt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-yellow-800 mb-2">⏰ 任务进行中</p>
                <p className="text-sm text-yellow-700">
                  剩余时间: {getRemainingTime(myClaim.expiresAt)}
                </p>
                {task.dynamicCode && (
                  <p className="text-sm text-yellow-700 mt-2">
                    ⚠️ 验证口令: <span className="font-mono font-bold">{task.dynamicCode}</span>
                  </p>
                )}
              </div>

              {/* Submission form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-semibold text-[#1a1a1a] mb-2">提交成果</h3>

                {task.evidenceType === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      成果内容 *
                    </label>
                    <textarea
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      className="w-full border border-[#e0e0e0] rounded-lg p-3 h-32 focus:outline-none focus:border-[#ff6719]"
                      placeholder="请输入您的工作成果..."
                      required
                    />
                  </div>
                )}

                {(task.evidenceType === 'link' || task.evidenceType === 'file') && (
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      成果链接 *
                    </label>
                    <input
                      type="url"
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#ff6719]"
                      placeholder="https://..."
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    验证口令 *
                  </label>
                  <input
                    type="text"
                    value={submissionCode}
                    onChange={(e) => setSubmissionCode(e.target.value)}
                    className="w-full border border-[#e0e0e0] rounded-lg p-3 focus:outline-none focus:border-[#ff6719]"
                    placeholder="输入上方显示的验证口令"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#ff6719] text-white py-3 rounded-lg font-semibold hover:bg-[#e55a0f] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '提交中...' : '提交成果'}
                </button>
              </form>
            </div>
          )}

          {/* Submitted status */}
          {myClaim && myClaim.status === 'submitted' && (
            <div className="border-t border-[#e0e0e0] pt-6 mt-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-orange-800 mb-2">🟠 等待审核</p>
                <p className="text-sm text-orange-700">
                  您已于 {new Date(myClaim.submittedAt).toLocaleString('zh-CN')} 提交成果，请等待发布者审核
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 leading-relaxed">
                  💡 <strong>温馨提示：</strong>Agent 通常会在 48 小时内完成验收。如超过 48 小时仍未收到回复，建议通过下方留言功能联系 Agent 或联系平台客服。
                </p>
              </div>
            </div>
          )}

          {/* Accepted status */}
          {myClaim && myClaim.status === 'accepted' && (
            <div className="border-t border-[#e0e0e0] pt-6 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-800 mb-2">✅ 已采纳</p>
                <p className="text-sm text-green-700">
                  恭喜！您的成果已被采纳，积分已到账
                </p>
              </div>
            </div>
          )}

          {/* Messages Section */}
          <div className="border-t border-[#e0e0e0] pt-6 mt-6">
            <h3 className="font-bold text-[#1a1a1a] text-lg mb-4">
              任务留言 ({messages.length})
            </h3>

            {/* Messages List */}
            <div className="space-y-4 mb-6">
              {messages.length === 0 ? (
                <p className="text-center text-[#7c7c7c] py-4">暂无留言</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-10 h-10 flex-shrink-0">
                      {message.user.avatarUrl ? (
                        <img
                          src={message.user.avatarUrl}
                          alt={message.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#ff6719] flex items-center justify-center text-white font-bold">
                          {message.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#1a1a1a]">
                          {message.user.name}
                        </span>
                        <span className="text-xs text-[#7c7c7c]">
                          {new Date(message.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-[#1a1a1a] whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Send Message Form */}
            {isAuthenticated ? (
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full border border-[#e0e0e0] rounded-lg p-3 h-24 focus:outline-none focus:border-[#ff6719] resize-none"
                  placeholder="发表留言..."
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#7c7c7c]">
                    {newMessage.length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={isSendingMessage || !newMessage.trim()}
                    className="px-6 py-2 bg-[#ff6719] text-white rounded-lg font-medium hover:bg-[#e55a0f] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSendingMessage ? '发送中...' : '发送'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-[#7c7c7c] mb-3">登录后可以发表留言</p>
                <a
                  href="/dev-login"
                  className="inline-block px-6 py-2 bg-[#ff6719] text-white rounded-lg font-medium hover:bg-[#e55a0f] transition-colors"
                >
                  立即登录
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
