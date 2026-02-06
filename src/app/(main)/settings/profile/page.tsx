'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  title?: string;
  bio?: string;
  skills: string[];
  location?: string;
  isRemote: boolean;
  xiaohongshu?: string;
  weibo?: string;
  wechat?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    skills: [] as string[],
    skillInput: '',
    location: '',
    isRemote: true,
    xiaohongshu: '',
    weibo: '',
    wechat: '',
    twitter: '',
    github: '',
    website: '',
  });

  // Skill templates
  const skillTemplates = [
    '写作', '翻译', '数据标注', '转录', '研究',
    '设计', '编程', '测试', '视频剪辑', '文案策划'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me/profile');
      const data = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          title: data.data.title || '',
          bio: data.data.bio || '',
          skills: data.data.skills || [],
          skillInput: '',
          location: data.data.location || '',
          isRemote: data.data.isRemote ?? true,
          xiaohongshu: data.data.xiaohongshu || '',
          weibo: data.data.weibo || '',
          wechat: data.data.wechat || '',
          twitter: data.data.twitter || '',
          github: data.data.github || '',
          website: data.data.website || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = () => {
    const skill = formData.skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
        skillInput: '',
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          title: formData.title || null,
          bio: formData.bio || null,
          skills: formData.skills,
          location: formData.location || null,
          isRemote: formData.isRemote,
          xiaohongshu: formData.xiaohongshu || null,
          weibo: formData.weibo || null,
          wechat: formData.wechat || null,
          twitter: formData.twitter || null,
          github: formData.github || null,
          website: formData.website || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('个人信息已更新');
        router.push('/my-tasks');
      } else {
        toast.error('更新失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('更新失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-[#7c7c7c]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e0]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">编辑个人信息</h1>
          <p className="text-[#7c7c7c]">完善你的个人资料，让 Agent 更好地了解你</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white border border-[#e0e0e0] rounded-lg p-8">
          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
              placeholder="你的名字"
            />
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              职业头衔
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
              placeholder="如：全栈工程师、文案策划"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              个人简介
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719] resize-none"
              placeholder="介绍一下你的技能和经验..."
            />
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              技能标签
            </label>

            {/* Skill Templates */}
            <div className="mb-3">
              <div className="text-xs text-[#7c7c7c] mb-2">常用技能（点击快速添加）</div>
              <div className="flex flex-wrap gap-2">
                {skillTemplates.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => {
                      if (!formData.skills.includes(template)) {
                        setFormData({
                          ...formData,
                          skills: [...formData.skills, template],
                        });
                      }
                    }}
                    disabled={formData.skills.includes(template)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      formData.skills.includes(template)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-50 text-[#ff6719] hover:bg-orange-100 cursor-pointer'
                    }`}
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={formData.skillInput}
                onChange={(e) =>
                  setFormData({ ...formData, skillInput: e.target.value })
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-4 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
                placeholder="自定义技能（按回车确认）"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-6 py-2 bg-[#ff6719] text-white rounded-lg hover:bg-[#e55a0f] transition-colors"
              >
                添加
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-[#fafafa] text-[#1a1a1a] rounded-full flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#7c7c7c] hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              所在地
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
              placeholder="如：北京、上海"
            />
          </div>

          {/* Social Media Links */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">社交账号</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  小红书
                </label>
                <input
                  type="url"
                  value={formData.xiaohongshu}
                  onChange={(e) =>
                    setFormData({ ...formData, xiaohongshu: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
                  placeholder="https://www.xiaohongshu.com/user/profile/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  微博
                </label>
                <input
                  type="url"
                  value={formData.weibo}
                  onChange={(e) =>
                    setFormData({ ...formData, weibo: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
                  placeholder="https://weibo.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  微信公众号
                </label>
                <input
                  type="text"
                  value={formData.wechat}
                  onChange={(e) =>
                    setFormData({ ...formData, wechat: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
                  placeholder="公众号名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Twitter/X
                </label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  GitHub
                </label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) =>
                    setFormData({ ...formData, github: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  个人网站
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg focus:outline-none focus:border-[#ff6719]"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Is Remote */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRemote}
                onChange={(e) =>
                  setFormData({ ...formData, isRemote: e.target.checked })
                }
                className="w-5 h-5 text-[#ff6719] border-[#e0e0e0] rounded focus:ring-[#ff6719]"
              />
              <span className="text-sm text-[#1a1a1a]">
                我可以接受远程工作
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#ff6719] text-white py-3 rounded-lg font-semibold hover:bg-[#e55a0f] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存更新'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 border border-[#e0e0e0] text-[#7c7c7c] rounded-lg font-semibold hover:border-[#ff6719] transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
