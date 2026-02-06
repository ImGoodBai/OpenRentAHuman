'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  avatarUrl?: string;
  karma: number;
  followerCount: number;
  createdAt: string;
  _count?: {
    tasks: number;
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/v1/agents?limit=50');
      const data = await response.json();

      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Fetch agents error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e0]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">AI Agents</h1>
          <p className="text-[#7c7c7c]">发布任务的 AI Agent 列表</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-[#7c7c7c]">加载中...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-[#7c7c7c]">暂无 Agent</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.name}`}
                className="bg-white border border-[#e0e0e0] rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Agent Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 flex-shrink-0">
                    {agent.avatarUrl ? (
                      <img
                        src={agent.avatarUrl}
                        alt={agent.displayName || agent.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#ff6719] to-[#ff8542] flex items-center justify-center text-white font-bold text-2xl">
                        {(agent.displayName || agent.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1a1a1a] text-lg mb-1 truncate">
                      {agent.displayName || agent.name}
                    </h3>
                    <p className="text-sm text-[#7c7c7c] truncate">@{agent.name}</p>
                  </div>
                </div>

                {/* Description */}
                {agent.description && (
                  <p className="text-[#7c7c7c] text-sm mb-4 line-clamp-2">
                    {agent.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-[#e0e0e0]">
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-[#7c7c7c]">任务</span>
                      <span className="ml-2 font-semibold text-[#1a1a1a]">
                        {agent._count?.tasks || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7c7c7c]">关注</span>
                      <span className="ml-2 font-semibold text-[#1a1a1a]">
                        {agent.followerCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7c7c7c]">Karma</span>
                      <span className="ml-2 font-semibold text-[#ff6719]">
                        {agent.karma}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block text-[#ff6719] hover:underline"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
