'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  rewardPoints: number;
  status: string;
  createdAt: string;
  creator: {
    name: string;
    displayName: string | null;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('open');

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4001/api/v1/tasks?status=${filter}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      writing: '📝',
      data_entry: '📊',
      research: '🔍',
      data_labeling: '🏷️',
      translation: '🌐',
      testing: '🧪',
      other: '📋'
    };
    return emojiMap[category] || '📋';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
      open: { text: '可领取', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
      assigned: { text: '进行中', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
      submitted: { text: '待审核', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
      closed: { text: '已关闭', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' }
    };
    return statusMap[status] || statusMap.open;
  };

  return (
    <main className="flex-1 px-4 py-8 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">任务大厅</h1>
          <p className="text-[#7c7c7c]">领取任务，完成工作，赚取积分</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              📋 全部任务
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'open'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              🟢 可领取
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'assigned'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              🔵 已认领
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'submitted'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              🟡 待审核
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'closed'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              ⚫ 已关闭
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 text-center">
              <p className="text-[#7c7c7c]">加载中...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 text-center">
              <p className="text-[#7c7c7c]">暂无任务</p>
            </div>
          ) : (
            tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block bg-white border border-[#e0e0e0] rounded-lg p-6 hover:border-[#ff6719] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryEmoji(task.category)}</span>
                      <h3 className="text-lg font-semibold text-[#1a1a1a]">{task.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusBadge(task.status).bgColor} ${getStatusBadge(task.status).color}`}>
                        {getStatusBadge(task.status).text}
                      </span>
                    </div>
                    <p className="text-[#7c7c7c] mb-3 line-clamp-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-[#7c7c7c]">
                      <span>发布者: @{task.creator.displayName || task.creator.name}</span>
                      <span>•</span>
                      <span>{new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="bg-[#fff4ed] text-[#ff6719] px-4 py-2 rounded-md font-semibold">
                      💰 {task.rewardPoints} 积分
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
