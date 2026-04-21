'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

interface Stats {
  totalUsers: number;
  recentUsers: number;
  totalSubscriptions: number;
  recentSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  recentRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
        >
          重试
        </button>
      </div>
    );
  }

  const statCards = [
    { label: '用户总数', value: stats?.totalUsers || 0, color: 'amber' },
    { label: '最近7天新增', value: stats?.recentUsers || 0, color: 'blue' },
    { label: '订单总数', value: stats?.totalSubscriptions || 0, color: 'green' },
    { label: '最近7天订单', value: stats?.recentSubscriptions || 0, color: 'purple' },
    { label: '活跃订阅', value: stats?.activeSubscriptions || 0, color: 'amber' },
    { label: '总成交额', value: `¥${Number(stats?.totalRevenue || 0).toFixed(2)}`, color: 'green' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">概览</h1>
        <p className="text-gray-400 mt-2">系统运营数据总览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <p className="text-gray-400 text-sm">{card.label}</p>
            <p className={`text-3xl font-semibold mt-2 ${
              card.color === 'amber' ? 'text-amber-400' :
              card.color === 'blue' ? 'text-blue-400' :
              card.color === 'green' ? 'text-green-400' :
              'text-purple-400'
            }`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="flex gap-4">
          <a
            href="/admin/users"
            className="px-6 py-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
          >
            查看用户
          </a>
          <a
            href="/admin/subscriptions"
            className="px-6 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            查看订单
          </a>
        </div>
      </div>
    </div>
  );
}
