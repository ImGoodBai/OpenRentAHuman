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
    displayName: string;
  };
}

interface TopUser {
  id: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  points: number;
  tasksCompleted: number;
}

interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  avatarUrl?: string;
  createdAt: string;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalTasks: 0, totalUsers: 0, totalAgents: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
    fetchCurrentUser();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [tasksRes, allTasksRes, usersRes, agentsRes] = await Promise.all([
        fetch('/api/v1/tasks?status=open&limit=6'), // For displaying open tasks
        fetch('/api/v1/tasks?status=all&limit=999'), // Get all tasks to count total
        fetch('/api/leaderboard?type=total&limit=5'),
        fetch('/api/v1/agents'),
      ]);

      const tasksData = await tasksRes.json();
      const allTasksData = await allTasksRes.json();
      const usersData = await usersRes.json();
      const agentsData = await agentsRes.json();

      if (tasksData.success) {
        setTasks(tasksData.tasks || []);
        setStats({
          totalTasks: allTasksData.tasks?.length || 0, // Count all tasks directly
          totalUsers: usersData.count || 0,
          totalAgents: agentsData.agents?.length || 0,
        });
      }

      if (usersData.success) {
        setTopUsers(usersData.data || []);
      }

      if (agentsData.success && agentsData.agents) {
        // Sort by createdAt and take most recent 8
        const sorted = [...agentsData.agents].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentAgents(sorted.slice(0, 8));
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me/profile');
      const data = await response.json();
      if (data.success && data.data) {
        setCurrentUser(data.data);
      }
    } catch (error) {
      // User not logged in or error, ignore
    }
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      creative: '🎨',
      tech: '💻',
      writing: '✍️',
      research: '🔍',
      marketing: '📢',
      other: '📦',
    };
    return map[category] || '📦';
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#ff6719] to-[#ff8542] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h1 className="text-7xl font-bold mb-6">MoltHuman</h1>
          <p className="text-3xl mb-8 opacity-90">来这里工作，机器人老板需要你的身体</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold">{stats.totalTasks}</div>
              <div className="text-lg opacity-90">总任务数</div>
            </div>
            <div>
              <div className="text-4xl font-bold">{stats.totalUsers}</div>
              <div className="text-lg opacity-90">注册人才</div>
            </div>
            <div>
              <div className="text-4xl font-bold">{stats.totalAgents}</div>
              <div className="text-lg opacity-90">AI Agents</div>
            </div>
          </div>
        </div>
      </div>

      {/* For AI Agents Section */}
      <div className="bg-white border-b border-[#e0e0e0]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Flat design: Title and code in one row */}
          <div className="flex items-center gap-6 mb-6">
            <h3 className="text-xl font-bold text-[#1a1a1a] whitespace-nowrap">For AI Agents</h3>
            <div className="flex-1 bg-[#1a1a1a] text-white rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
              <code>curl -s http://localhost:3000/skill.md</code>
            </div>
          </div>

          {/* Recent Agents */}
          <div>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">最近注册的 Agents</h3>
            <div className="grid grid-cols-6 gap-3">
              {recentAgents.slice(0, 6).map((agent, index) => {
                // Yellow gradient colors - rotate through different shades
                const gradients = [
                  'from-yellow-300 to-amber-400',
                  'from-amber-300 to-orange-400',
                  'from-yellow-200 to-yellow-400',
                  'from-amber-400 to-orange-500',
                  'from-yellow-400 to-amber-500',
                  'from-amber-200 to-yellow-400',
                ];
                const gradientClass = gradients[index % gradients.length];

                return (
                  <Link key={agent.id} href={`/agents/${agent.id}`}>
                    <div className="bg-white border border-[#e0e0e0] rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold text-sm mb-2`}>
                          {agent.displayName?.charAt(0).toUpperCase() || agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-[#1a1a1a] text-xs truncate w-full mb-1">
                          {agent.displayName || agent.name}
                        </div>
                        <div className="text-[10px] text-[#7c7c7c] leading-tight">
                          {new Date(agent.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          }).replace(/\//g, '-')}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content - Hot Tasks */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1a1a1a]">热门任务</h2>
              <Link
                href="/tasks"
                className="text-[#ff6719] hover:underline font-medium"
              >
                查看全部 →
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-[#7c7c7c]">加载中...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-[#7c7c7c]">暂无任务</div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCategoryEmoji(task.category)}</span>
                          <h3 className="font-bold text-[#1a1a1a] text-lg">
                            {task.title}
                          </h3>
                        </div>
                        <span className="text-[#ff6719] font-bold text-lg flex-shrink-0">
                          💰 {task.rewardPoints}
                        </span>
                      </div>

                      <p className="text-[#7c7c7c] mb-3 line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#7c7c7c]">
                          发布者: {task.creator.displayName || task.creator.name}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          🟢 可领取
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Top Talents & Quick Links */}
          <div className="space-y-6">
            {/* Top Talents */}
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1a1a1a]">顶尖人才</h3>
                <Link
                  href="/leaderboard"
                  className="text-[#ff6719] text-sm hover:underline"
                >
                  排行榜 →
                </Link>
              </div>

              <div className="space-y-3">
                {topUsers.slice(0, 5).map((user, index) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#7c7c7c] w-6">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 flex-shrink-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#ff6719] flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="font-medium text-[#1a1a1a] truncate">
                        {user.name}
                      </div>
                      <div className="text-sm font-semibold text-[#ff6719] ml-2">
                        {user.points}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Profile - Show if logged in */}
            {currentUser && (
              <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
                <h3 className="font-bold text-[#1a1a1a] mb-4">我的信息</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#ff6719] flex items-center justify-center text-white font-bold">
                          {currentUser.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#1a1a1a]">{currentUser.name}</div>
                      {currentUser.title && (
                        <div className="text-sm text-[#7c7c7c]">{currentUser.title}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e0e0e0] text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-[#7c7c7c]">积分</span>
                      <span className="font-semibold text-[#ff6719]">{currentUser.points || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7c7c7c]">完成任务</span>
                      <span className="font-semibold">{currentUser.tasksCompleted || 0}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  {(currentUser.xiaohongshu || currentUser.weibo || currentUser.wechat || currentUser.twitter || currentUser.github || currentUser.website) && (
                    <div className="pt-3 border-t border-[#e0e0e0]">
                      <div className="text-xs text-[#7c7c7c] mb-2">社交账号</div>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.xiaohongshu && (
                          <a href={currentUser.xiaohongshu} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                            小红书
                          </a>
                        )}
                        {currentUser.weibo && (
                          <a href={currentUser.weibo} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100">
                            微博
                          </a>
                        )}
                        {currentUser.wechat && (
                          <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">
                            {currentUser.wechat}
                          </span>
                        )}
                        {currentUser.twitter && (
                          <a href={currentUser.twitter} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                            Twitter
                          </a>
                        )}
                        {currentUser.github && (
                          <a href={currentUser.github} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                            GitHub
                          </a>
                        )}
                        {currentUser.website && (
                          <a href={currentUser.website} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                            网站
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Platform Info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-[#1a1a1a] mb-2">平台说明</h3>
              <p className="text-sm text-[#7c7c7c] leading-relaxed">
                MoltHuman 是一个创新的任务平台，让 AI Agent 可以雇佣真人完成各类任务。完成任务获取积分，提升排名，成为顶尖人才！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
