'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

interface User {
  id: string;
  nickname: string;
  email: string | null;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  user: User | null;
}

interface SubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingSubscription, setViewingSubscription] = useState<Subscription | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, search, statusFilter]);

  const getCacheKey = () => {
    return `admin_subscriptions_${page}_${search}_${statusFilter}`;
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      const cacheKey = getCacheKey();
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setSubscriptions(data.subscriptions);
        setTotalPages(data.totalPages);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      
      const res = await axios.get(`${API_BASE}/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data: SubscriptionsResponse = res.data;
      setSubscriptions(data.subscriptions);
      setTotalPages(data.totalPages);
      
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err: any) {
      setError(err.response?.data?.error || '获取订阅列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStatus = (sub: Subscription) => {
    setEditingSubscription(sub);
    setNewStatus(sub.status);
  };

  const handleSaveStatus = async () => {
    if (!editingSubscription) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}/admin/subscriptions/${editingSubscription.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingSubscription(null);
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('admin_subscriptions_')) {
          sessionStorage.removeItem(key);
        }
      }
      
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.response?.data?.error || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      monthly: '月度会员',
      yearly: '年度会员',
    };
    return labels[plan] || plan;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '活跃',
      expired: '已过期',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      expired: 'bg-gray-500/20 text-gray-400',
      cancelled: 'bg-red-500/20 text-red-400',
    };
    return classes[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getPlanBadgeClass = (plan: string) => {
    const classes: Record<string, string> = {
      monthly: 'bg-blue-500/20 text-blue-400',
      yearly: 'bg-amber-500/20 text-amber-400',
    };
    return classes[plan] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">订单管理</h1>
        <p className="text-gray-400 mt-2">管理用户订阅订单</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="搜索订单ID、用户昵称或邮箱..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">所有状态</option>
            <option value="active">活跃</option>
            <option value="expired">已过期</option>
            <option value="cancelled">已取消</option>
          </select>
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            重置
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">订单ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">用户</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">套餐</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">金额</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">状态</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">创建时间</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-700/30">
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                    {sub.id.substring(0, 12)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {sub.user?.nickname || '-'}
                    {sub.user?.email && (
                      <span className="text-gray-500 text-xs block">{sub.user.email}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getPlanBadgeClass(sub.plan)}`}>
                      {getPlanLabel(sub.plan)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-semibold">
                    ¥{Number(sub.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(sub.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingSubscription(sub)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleEditStatus(sub)}
                        className="text-amber-400 hover:text-amber-300 text-sm"
                      >
                        编辑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subscriptions.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            暂无订单数据
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              上一页
            </button>
            <span className="text-gray-400">
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {viewingSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">订单详情</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">订单ID</label>
                <p className="text-white font-mono">{viewingSubscription.id}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">用户</label>
                <p className="text-white">{viewingSubscription.user?.nickname || '-'}</p>
                {viewingSubscription.user?.email && (
                  <p className="text-gray-500 text-sm">{viewingSubscription.user.email}</p>
                )}
              </div>
              <div>
                <label className="text-gray-400 text-sm">套餐</label>
                <p className="text-white">{getPlanLabel(viewingSubscription.plan)}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">金额</label>
                <p className="text-white text-xl font-semibold">¥{Number(viewingSubscription.amount).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">状态</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(viewingSubscription.status)}`}>
                  {getStatusLabel(viewingSubscription.status)}
                </span>
              </div>
              <div>
                <label className="text-gray-400 text-sm">有效期</label>
                <p className="text-white">
                  {new Date(viewingSubscription.startDate).toLocaleDateString('zh-CN')} -{' '}
                  {new Date(viewingSubscription.endDate).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">创建时间</label>
                <p className="text-white">
                  {new Date(viewingSubscription.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewingSubscription(null)}
              className="w-full mt-6 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {editingSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">编辑订单状态</h3>
            <p className="text-gray-400 mb-4">
              订单ID: {editingSubscription.id.substring(0, 12)}...
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 focus:outline-none focus:border-amber-500"
            >
              <option value="active">活跃</option>
              <option value="expired">已过期</option>
              <option value="cancelled">已取消</option>
            </select>
            <div className="flex gap-4">
              <button
                onClick={() => setEditingSubscription(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
