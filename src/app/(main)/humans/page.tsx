'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TalentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  bio?: string;
  skills: string[];
  location?: string;
  isRemote: boolean;
  points: number;
  tasksCompleted: number;
  tasksAccepted: number;
  xiaohongshu?: string;
  weibo?: string;
  wechat?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

export default function HumansPage() {
  const [users, setUsers] = useState<TalentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: '',
    location: '',
    isRemote: '',
    sortBy: 'points',
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.skills) params.set('skills', filters.skills);
      if (filters.location) params.set('location', filters.location);
      if (filters.isRemote) params.set('isRemote', filters.isRemote);
      params.set('sortBy', filters.sortBy);

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e0]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">人才市场</h1>
          <p className="text-[#7c7c7c]">发现优秀的任务执行者</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                技能筛选
              </label>
              <input
                type="text"
                placeholder="如：React,Python"
                value={filters.skills}
                onChange={(e) =>
                  setFilters({ ...filters, skills: e.target.value })
                }
                className="w-full px-4 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                位置筛选
              </label>
              <input
                type="text"
                placeholder="如：北京"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                远程工作
              </label>
              <select
                value={filters.isRemote}
                onChange={(e) =>
                  setFilters({ ...filters, isRemote: e.target.value })
                }
                className="w-full px-4 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
              >
                <option value="">全部</option>
                <option value="true">仅远程</option>
                <option value="false">仅本地</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                排序方式
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                className="w-full px-4 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
              >
                <option value="points">按积分</option>
                <option value="tasksCompleted">按任务数</option>
                <option value="createdAt">最新加入</option>
              </select>
            </div>
          </div>
        </div>

        {/* User List */}
        {isLoading ? (
          <div className="text-center py-12 text-[#7c7c7c]">加载中...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-[#7c7c7c]">
            暂无符合条件的人才
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-[#e0e0e0] rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* User Header */}
                <div className="flex items-start gap-4 mb-4">
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

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1a1a1a] text-lg mb-1 truncate">
                      {user.name}
                    </h3>
                    {user.title && (
                      <p className="text-[#7c7c7c] text-sm mb-2 truncate">
                        {user.title}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-[#7c7c7c]">
                      {user.location && <span>📍 {user.location}</span>}
                      {user.isRemote && <span>🌐 远程</span>}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-[#7c7c7c] text-sm mb-4 line-clamp-2">
                    {user.bio}
                  </p>
                )}

                {/* Skills */}
                {user.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-[#fafafa] text-[#7c7c7c] text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-[#e0e0e0]">
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-[#7c7c7c]">积分</span>
                      <span className="ml-2 font-semibold text-[#ff6719]">
                        {user.points}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7c7c7c]">任务</span>
                      <span className="ml-2 font-semibold text-[#1a1a1a]">
                        {user.tasksCompleted}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7c7c7c]">采纳率</span>
                      <span className="ml-2 font-semibold text-[#1a1a1a]">
                        {user.tasksCompleted > 0
                          ? Math.round(
                              (user.tasksAccepted / user.tasksCompleted) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                {(user.xiaohongshu || user.weibo || user.wechat || user.twitter || user.github || user.website) && (
                  <div className="pt-3 border-t border-[#e0e0e0] mt-3">
                    <div className="text-xs text-[#7c7c7c] mb-2">社交账号</div>
                    <div className="flex flex-wrap gap-2">
                      {user.xiaohongshu && (
                        <a href={user.xiaohongshu} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                          小红书
                        </a>
                      )}
                      {user.weibo && (
                        <a href={user.weibo} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100">
                          微博
                        </a>
                      )}
                      {user.wechat && (
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">
                          {user.wechat}
                        </span>
                      )}
                      {user.twitter && (
                        <a href={user.twitter} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                          Twitter
                        </a>
                      )}
                      {user.github && (
                        <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                          GitHub
                        </a>
                      )}
                      {user.website && (
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                          网站
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
