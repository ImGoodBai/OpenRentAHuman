'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  skills: string[];
  location?: string;
  points: number;
  tasksCompleted: number;
  tasksAccepted: number;
  currentStreak: number;
  todayPoints?: number;
}

type LeaderboardType = 'total' | 'today' | 'streak';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [type, setType] = useState<LeaderboardType>('total');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?type=${type}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getDisplayValue = (user: LeaderboardUser) => {
    switch (type) {
      case 'today':
        return `${user.todayPoints || 0} 积分`;
      case 'streak':
        return `${user.currentStreak} 天`;
      case 'total':
      default:
        return `${user.points} 积分`;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e0]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">排行榜</h1>
          <p className="text-[#7c7c7c]">看看谁是最优秀的人才</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Type Selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setType('total')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              type === 'total'
                ? 'bg-[#ff6719] text-white'
                : 'bg-white text-[#7c7c7c] border border-[#e0e0e0] hover:border-[#ff6719]'
            }`}
          >
            总积分
          </button>
          <button
            onClick={() => setType('today')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              type === 'today'
                ? 'bg-[#ff6719] text-white'
                : 'bg-white text-[#7c7c7c] border border-[#e0e0e0] hover:border-[#ff6719]'
            }`}
          >
            今日榜
          </button>
          <button
            onClick={() => setType('streak')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              type === 'streak'
                ? 'bg-[#ff6719] text-white'
                : 'bg-white text-[#7c7c7c] border border-[#e0e0e0] hover:border-[#ff6719]'
            }`}
          >
            连胜榜
          </button>
        </div>

        {/* Leaderboard List */}
        {isLoading ? (
          <div className="text-center py-12 text-[#7c7c7c]">加载中...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-[#7c7c7c]">
            暂无数据
          </div>
        ) : (
          <div className="bg-white border border-[#e0e0e0] rounded-lg overflow-hidden">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-6 border-b border-[#e0e0e0] last:border-b-0 hover:bg-[#fafafa] transition-colors"
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                  {getRankEmoji(index + 1) ? (
                    <span className="text-3xl">{getRankEmoji(index + 1)}</span>
                  ) : (
                    <span className="text-xl font-bold text-[#7c7c7c]">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-16 h-16 flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#ff6719] flex items-center justify-center text-white font-bold text-xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#1a1a1a] text-lg truncate">
                      {user.name}
                    </h3>
                    {user.title && (
                      <span className="text-sm text-[#7c7c7c] truncate">
                        • {user.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#7c7c7c]">
                    <span>完成 {user.tasksCompleted} 个任务</span>
                    {user.location && <span>📍 {user.location}</span>}
                  </div>
                  {user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-[#fafafa] text-[#7c7c7c] text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span className="px-2 py-1 text-[#7c7c7c] text-xs">
                          +{user.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-[#ff6719]">
                    {getDisplayValue(user).split(' ')[0]}
                  </div>
                  <div className="text-sm text-[#7c7c7c]">
                    {getDisplayValue(user).split(' ')[1]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/tasks"
            className="inline-block text-[#ff6719] hover:underline"
          >
            ← 返回任务大厅
          </Link>
        </div>
      </div>
    </div>
  );
}
