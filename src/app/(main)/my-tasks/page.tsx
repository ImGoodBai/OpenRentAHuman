'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Claim {
  id: string;
  status: string;
  claimedAt: string;
  submittedAt: string | null;
  expiresAt: string;
  task: {
    id: string;
    title: string;
    description: string;
    rewardPoints: number;
    category: string;
    creator: {
      name: string;
      displayName: string | null;
    };
  };
}

export default function MyTasksPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadClaims();
    }
  }, [isAuthenticated, filter]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      router.push('/auth/login');
    }
  };

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const url = filter === 'all'
        ? '/api/users/me/claims'
        : `/api/users/me/claims?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setClaims(data.claims);
      }
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      claimed: { text: '🟡 待提交', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { text: '🟠 待审核', color: 'bg-orange-100 text-orange-800' },
      accepted: { text: '✅ 已采纳', color: 'bg-green-100 text-green-800' },
      rejected: { text: '❌ 已拒绝', color: 'bg-red-100 text-red-800' },
      expired: { text: '⏰ 已超时', color: 'bg-gray-100 text-gray-800' }
    };
    const badge = statusMap[status] || statusMap.claimed;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getRemainingTime = (expiresAt: string, status: string) => {
    if (status !== 'claimed') return null;

    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return '已超时';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `⏰ 剩余 ${hours}h ${minutes}m`;
  };

  if (!isAuthenticated || isLoading) {
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

  return (
    <main className="flex-1 px-4 py-8 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">我的任务</h1>
          <p className="text-[#7c7c7c]">查看您领取的所有任务</p>
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
              全部
            </button>
            <button
              onClick={() => setFilter('claimed')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'claimed'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              🟡 待提交
            </button>
            <button
              onClick={() => setFilter('submitted')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'submitted'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              🟠 待审核
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'accepted'
                  ? 'bg-[#ff6719] text-white'
                  : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
              }`}
            >
              ✅ 已完成
            </button>
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-8 text-center">
              <p className="text-[#7c7c7c] mb-4">还没有领取任务</p>
              <Link
                href="/tasks"
                className="inline-block bg-[#ff6719] text-white px-6 py-2 rounded-lg hover:bg-[#e55a0f] transition-colors"
              >
                去任务大厅看看
              </Link>
            </div>
          ) : (
            claims.map((claim) => (
              <Link
                key={claim.id}
                href={`/tasks/${claim.task.id}`}
                className="block bg-white border border-[#e0e0e0] rounded-lg p-6 hover:border-[#ff6719] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#1a1a1a] flex-1">
                    {claim.task.title}
                  </h3>
                  {getStatusBadge(claim.status)}
                </div>

                <p className="text-[#7c7c7c] mb-3 line-clamp-2">{claim.task.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-[#7c7c7c]">
                    <span>发布者: @{claim.task.creator.displayName || claim.task.creator.name}</span>
                    <span>•</span>
                    <span>💰 {claim.task.rewardPoints} 积分</span>
                    {claim.status === 'claimed' && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-600 font-medium">
                          {getRemainingTime(claim.expiresAt, claim.status)}
                        </span>
                      </>
                    )}
                  </div>
                  {claim.status === 'claimed' && (
                    <span className="text-[#ff6719] font-medium text-sm">
                      继续完成 →
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
