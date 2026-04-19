'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const cachedAdmin = sessionStorage.getItem('isAdmin');
        if (cachedAdmin === 'true') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        console.log('Checking admin access with token...');
        const response = await axios.get(`${API_BASE}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Admin access granted:', response.data);
        setIsAdmin(true);
        sessionStorage.setItem('isAdmin', 'true');
      } catch (error: any) {
        console.error('Admin access denied:', error);
        const errorMsg = error.response?.data?.error || error.message || '访问被拒绝';
        setErrorMessage(`错误: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('isAdmin');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!isAdmin && !errorMessage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">需要登录</h2>
          <p className="text-gray-300 mb-6">请先登录管理员账号</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/admin-login"
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer"
            >
              去登录
            </Link>
            <Link
              href="/"
              className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 cursor-pointer"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-4">无法访问管理后台</h2>
          <p className="text-gray-300 mb-6">{errorMessage}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/admin-login"
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              去登录
            </Link>
            <Link
              href="/"
              className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { path: '/admin', label: '概览' },
    { path: '/admin/users', label: '用户管理' },
    { path: '/admin/subscriptions', label: '订单管理' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        <aside className="w-64 bg-gray-800 min-h-screen border-r border-gray-700 relative">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-xl font-semibold text-amber-400">管理后台</h1>
            <p className="text-gray-400 text-sm mt-1">虚拟试衣系统</p>
          </div>
          
          <nav className="p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-4 py-3 rounded-lg mb-2 transition-colors ${
                  pathname === item.path
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="absolute bottom-6 left-4 right-4">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </div>
        </aside>
        
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
