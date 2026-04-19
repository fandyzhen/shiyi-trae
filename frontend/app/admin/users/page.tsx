'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

interface User {
  id: string;
  nickname: string;
  email: string | null;
  username: string | null;
  role: string;
  createdAt: string;
  isAdmin: boolean;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const getCacheKey = () => {
    return `admin_users_${page}_${search}_${roleFilter}`;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const cacheKey = getCacheKey();
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      });
      
      const res = await axios.get(`${API_BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data: UsersResponse = res.data;
      setUsers(data.users);
      setTotalPages(data.totalPages);
      
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err: any) {
      setError(err.response?.data?.error || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE}/admin/users/${editingUser.id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingUser(null);
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('admin_users_')) {
          sessionStorage.removeItem(key);
        }
      }
      
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      guest: '访客',
      registered: '注册用户',
      subscriber: '订阅用户',
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      guest: 'bg-gray-500/20 text-gray-400',
      registered: 'bg-blue-500/20 text-blue-400',
      subscriber: 'bg-amber-500/20 text-amber-400',
    };
    return classes[role] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">用户管理</h1>
        <p className="text-gray-400 mt-2">管理系统用户</p>
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
            placeholder="搜索昵称、邮箱或用户名..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">所有角色</option>
            <option value="guest">访客</option>
            <option value="registered">注册用户</option>
            <option value="subscriber">订阅用户</option>
          </select>
          <button
            onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}
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
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">昵称</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">邮箱</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">角色</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">注册时间</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/30">
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                    {user.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {user.nickname}
                    {user.isAdmin && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">管理员</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {user.email || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEditRole(user)}
                      className="text-amber-400 hover:text-amber-300 text-sm"
                    >
                      编辑角色
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            暂无用户数据
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

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">编辑用户角色</h3>
            <p className="text-gray-400 mb-4">
              用户: {editingUser.nickname}
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 focus:outline-none focus:border-amber-500"
            >
              <option value="guest">访客</option>
              <option value="registered">注册用户</option>
              <option value="subscriber">订阅用户</option>
            </select>
            <div className="flex gap-4">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleSaveRole}
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
