'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'register' | 'tryon' | 'history' | 'subscription'>('home');
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      fetchUsageInfo(savedToken);
    }
  }, []);

  useEffect(() => {
    if (token && user && (view === 'tryon' || view === 'home')) {
      fetchUsageInfo(token);
    }
  }, [view, token, user]);

  const fetchUsageInfo = async (authToken: string) => {
    try {
      const res = await axios.get(`${API_BASE}/tryon/usage`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUsageInfo(res.data);
    } catch (err) {
      console.error('Failed to fetch usage info:', err);
    }
  };

  const handleGuest = async () => {
    try {
      const res = await axios.post(`${API_BASE}/auth/guest`);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      fetchUsageInfo(res.data.token);
      setView('tryon');
    } catch (err) {
      alert('创建访客用户失败');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setUsageInfo(null);
    setMobileMenuOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('home');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 
              className="text-2xl sm:text-3xl font-light tracking-widest cursor-pointer transition-all duration-300 hover:text-amber-400" 
              onClick={() => { setView('home'); setMobileMenuOpen(false); }}
            >
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-semibold">
                LUXE
              </span>
              <span className="ml-2 text-gray-400 hidden sm:inline">TRYON</span>
            </h1>
            
            <div className="hidden md:flex gap-4 lg:gap-6 items-center">
              {user ? (
                <>
                  <span className="text-gray-300 font-light text-sm lg:text-base">
                    欢迎, <span className="text-amber-400">{user.nickname}</span>
                  </span>
                  {usageInfo && (
                    <span className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full text-xs lg:text-sm font-light">
                      {usageInfo.hasActiveSubscription ? '✨ VIP会员' : 
                       usageInfo.role === 'guest' ? `剩余 ${usageInfo.freeUsesRemaining} 次` : 
                       `剩余 ${usageInfo.registeredUsesRemaining} 次`}
                    </span>
                  )}
                  <button
                    onClick={() => { setView('tryon'); setMobileMenuOpen(false); }}
                    className="group relative px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-light tracking-wide text-sm lg:text-base overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25"
                  >
                    <span className="relative z-10">开始试衣</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                  <button
                    onClick={() => { setView('history'); setMobileMenuOpen(false); }}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 font-light text-sm lg:text-base"
                  >
                    历史记录
                  </button>
                  <button
                    onClick={() => { setView('subscription'); setMobileMenuOpen(false); }}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 font-light text-sm lg:text-base"
                  >
                    会员
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-300 font-light text-sm lg:text-base"
                  >
                    退出
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setView('login'); setMobileMenuOpen(false); }}
                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 font-light text-sm lg:text-base"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => { setView('register'); setMobileMenuOpen(false); }}
                    className="px-4 lg:px-6 py-2 lg:py-2.5 border border-amber-500/50 text-amber-400 rounded-full font-light tracking-wide text-sm lg:text-base hover:bg-amber-500/10 transition-all duration-300"
                  >
                    注册
                  </button>
                </>
              )}
            </div>

            <button 
              className="md:hidden text-gray-400 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-white/10 space-y-4">
              {user ? (
                <>
                  <div className="text-gray-300 font-light">
                    欢迎, <span className="text-amber-400">{user.nickname}</span>
                  </div>
                  {usageInfo && (
                    <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-full text-sm font-light inline-block">
                      {usageInfo.hasActiveSubscription ? '✨ VIP会员' : 
                       usageInfo.role === 'guest' ? `剩余 ${usageInfo.freeUsesRemaining} 次` : 
                       `剩余 ${usageInfo.registeredUsesRemaining} 次`}
                    </div>
                  )}
                  <button
                    onClick={() => { setView('tryon'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 text-amber-400 font-light rounded-lg hover:bg-white/5"
                  >
                    开始试衣
                  </button>
                  <button
                    onClick={() => { setView('history'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 text-gray-400 font-light rounded-lg hover:bg-white/5"
                  >
                    历史记录
                  </button>
                  <button
                    onClick={() => { setView('subscription'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 text-gray-400 font-light rounded-lg hover:bg-white/5"
                  >
                    会员
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-gray-500 font-light rounded-lg hover:bg-white/5"
                  >
                    退出
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setView('login'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 text-gray-400 font-light rounded-lg hover:bg-white/5"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => { setView('register'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 text-amber-400 font-light rounded-lg hover:bg-white/5"
                  >
                    注册
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {view === 'home' && !user && (
          <div className="text-center py-12 sm:py-24">
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6 sm:mb-8">
                <span className="text-amber-400 text-xs sm:text-sm">✨ AI驱动</span>
              </div>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extralight tracking-tight mb-8 sm:mb-12">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                重新定义
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-light">
                购物体验
              </span>
            </h2>
            <p className="text-base sm:text-xl text-gray-400 font-light max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
              无需试衣间，即可预见时尚，让AI为你完美呈现！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
              <button
                onClick={handleGuest}
                className="group relative px-8 sm:px-10 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-full font-light tracking-wider overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>立即体验</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
              <button
                onClick={() => setView('register')}
                className="px-8 sm:px-10 py-4 border border-white/20 text-white rounded-full font-light tracking-wider hover:bg-white/5 hover:border-white/40 transition-all duration-300"
              >
                了解更多
              </button>
            </div>
          </div>
        )}
        
        {view === 'home' && user && (
          <div className="text-center py-12 sm:py-24">
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6 sm:mb-8">
                <span className="text-amber-400 text-xs sm:text-sm">✨ 欢迎回来</span>
              </div>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extralight tracking-tight mb-8 sm:mb-12">
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-light">
                {user.nickname}
              </span>
            </h2>
            <p className="text-base sm:text-xl text-gray-400 font-light max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
              点击下方按钮开始您的试衣体验！
            </p>
            <div className="flex justify-center px-4">
              <button
                onClick={() => setView('tryon')}
                className="group relative px-8 sm:px-10 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-full font-light tracking-wider overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>开始试衣</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </div>
          </div>
        )}

        {view === 'login' && <LoginView setUser={setUser} setToken={setToken} setView={setView} fetchUsageInfo={fetchUsageInfo} />}
        {view === 'register' && <RegisterView setView={setView} />}
        {view === 'tryon' && user && token && <TryOnView user={user} token={token} usageInfo={usageInfo} setUsageInfo={setUsageInfo} />}
        {view === 'history' && user && token && <HistoryView token={token} />}
        {view === 'subscription' && user && token && <SubscriptionView token={token} setUsageInfo={setUsageInfo} />}
      </div>
    </main>
  );
}

function LoginView({ setUser, setToken, setView, fetchUsageInfo }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      fetchUsageInfo(res.data.token);
      setView('tryon');
    } catch (err: any) {
      alert(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('找回密码功能即将上线，敬请期待！');
  };

  return (
    <div className="max-w-md mx-auto py-12 sm:py-20 px-4">
      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-8 sm:mb-10">
          <h3 className="text-2xl sm:text-3xl font-light mb-2">欢迎回来</h3>
          <p className="text-gray-400 font-light text-sm sm:text-base">登录继续您的时尚之旅</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-light text-gray-400 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-sm sm:text-base"
              placeholder="请输入用户名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-400 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-sm sm:text-base"
              placeholder="请输入密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-xl sm:rounded-2xl font-light tracking-wide text-sm sm:text-base hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="text-center mt-6 sm:mt-8 space-y-3">
          <button
            onClick={handleForgotPassword}
            className="text-gray-400 hover:text-amber-400 transition-colors font-light text-sm"
          >
            忘记密码？
          </button>
          <p className="text-gray-500 font-light text-sm">
            还没有账号？{' '}
            <button onClick={() => setView('register')} className="text-amber-400 hover:text-amber-300 transition-colors">
              立即注册
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterView({ setView }: any) {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/register`, { username, nickname, password, confirmPassword });
      alert('注册成功，请登录');
      setView('login');
    } catch (err: any) {
      alert(err.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 sm:py-20 px-4">
      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-8 sm:mb-10">
          <h3 className="text-2xl sm:text-3xl font-light mb-2">创建账号</h3>
          <p className="text-gray-400 font-light text-sm sm:text-base">开启您的专属试衣体验</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-light text-gray-400 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-sm sm:text-base"
              placeholder="请输入用户名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-400 mb-2">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-sm sm:text-base"
              placeholder="请输入昵称"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-400 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-sm sm:text-base"
              placeholder="请输入密码"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-400 mb-2">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-sm sm:text-base"
              placeholder="请再次输入密码"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-xl sm:rounded-2xl font-light tracking-wide text-sm sm:text-base hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="text-center mt-6 sm:mt-8 text-gray-500 font-light text-sm">
          已有账号？{' '}
          <button onClick={() => setView('login')} className="text-amber-400 hover:text-amber-300 transition-colors">
            立即登录
          </button>
        </p>
      </div>
    </div>
  );
}

function TryOnView({ user, token, usageInfo, setUsageInfo }: any) {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [personImagePreview, setPersonImagePreview] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [clothingImagePreview, setClothingImagePreview] = useState<string | null>(null);
  const [keepOriginalClothing, setKeepOriginalClothing] = useState(false);
  const [stylePreference, setStylePreference] = useState('fashion');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const refreshUsage = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tryon/usage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsageInfo(res.data);
      } catch (err) {
        console.error('Failed to refresh usage info:', err);
      }
    };
    refreshUsage();
  }, [token, setUsageInfo]);

  const handlePersonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPersonImage(e.target.files[0]);
      setPersonImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleClothingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setClothingImage(e.target.files[0]);
      setClothingImagePreview(URL.createObjectURL(e.target.files[0]));
      setResultImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!personImage || !clothingImage) {
      alert('请上传人物照片和衣服照片');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setProgressMessage('准备中...');

    const formData = new FormData();
    formData.append('personImage', personImage);
    formData.append('clothingImage', clothingImage);
    formData.append('keepOriginalClothing', keepOriginalClothing.toString());
    if (!keepOriginalClothing) {
      formData.append('stylePreference', stylePreference);
    }

    try {
      const response = await fetch(`${API_BASE}/tryon/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = '生成失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                  setProgressMessage(data.message || '');
                }
                if (data.result) {
                  setResultImage(`http://localhost:3001${data.result.resultImageUrl}`);
                  setHistoryId(data.result.historyId);
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
              }
            }
          }
        }
      }

      const newUsageRes = await axios.get(`${API_BASE}/tryon/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsageInfo(newUsageRes.data);

    } catch (err: any) {
      alert(err.message || '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'virtual-try-on.jpg';
      link.click();
    }
  };

  const handleRetry = () => {
    setResultImage(null);
    setHistoryId(null);
    setProgress(0);
  };

  return (
    <div className="max-w-4xl lg:max-w-5xl mx-auto py-6 sm:py-8 px-4">
      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-light mb-2">开始试衣</h2>
          <p className="text-gray-400 font-light text-sm sm:text-base">上传照片，预见时尚</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
          <div>
            <label className="block text-sm font-light text-gray-400 mb-3 sm:mb-4">您的照片</label>
            <div 
              className="relative group cursor-pointer"
              onClick={() => document.getElementById('personInput')?.click()}
            >
              <div className={`aspect-[3/4] rounded-xl sm:rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${personImagePreview ? 'border-amber-500/50' : 'border-white/20 hover:border-amber-500/30'}`}>
                {personImagePreview ? (
                  <img src={personImagePreview} alt="人物预览" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 sm:p-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 font-light text-sm">点击上传正面全身照</p>
                  </div>
                )}
              </div>
              {personImagePreview && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setPersonImage(null); setPersonImagePreview(null); }} 
                  className="absolute top-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <input id="personInput" type="file" accept="image/*" className="hidden" onChange={handlePersonImageChange} />
          </div>

          <div>
            <label className="block text-sm font-light text-gray-400 mb-3 sm:mb-4">衣服照片</label>
            <div 
              className="relative group cursor-pointer"
              onClick={() => document.getElementById('clothingInput')?.click()}
            >
              <div className={`aspect-[3/4] rounded-xl sm:rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden ${clothingImagePreview ? 'border-amber-500/50' : 'border-white/20 hover:border-amber-500/30'}`}>
                {clothingImagePreview ? (
                  <img src={clothingImagePreview} alt="衣服预览" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 sm:p-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 font-light text-sm">点击上传衣服图片</p>
                  </div>
                )}
              </div>
              {clothingImagePreview && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setClothingImage(null); setClothingImagePreview(null); setResultImage(null); }} 
                  className="absolute top-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <input id="clothingInput" type="file" accept="image/*" className="hidden" onChange={handleClothingImageChange} />
          </div>
        </div>

        <div className="space-y-5 sm:space-y-6 mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                id="keepOriginal"
                checked={keepOriginalClothing}
                onChange={(e) => setKeepOriginalClothing(e.target.checked)}
                className="peer w-6 h-6 rounded border-2 border-white/20 bg-white/5 checked:bg-amber-500 checked:border-amber-500 appearance-none cursor-pointer transition-all duration-300"
              />
              <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <label htmlFor="keepOriginal" className="text-gray-300 font-light cursor-pointer text-sm sm:text-base">保留原照片身上的其他衣服</label>
          </div>

          {!keepOriginalClothing && (
            <div>
              <label className="block text-sm font-light text-gray-400 mb-3 sm:mb-4">搭配风格</label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {[
                  { value: 'fashion', label: '时尚' },
                  { value: 'traditional', label: '经典' },
                  { value: 'casual', label: '休闲' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setStylePreference(style.value)}
                    className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 font-light text-sm sm:text-base ${stylePreference === style.value ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-amber-500/30'}`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!resultImage ? (
          <button
            onClick={handleGenerate}
            disabled={generating || !personImage || !clothingImage}
            className="group relative w-full py-4 sm:py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-xl sm:rounded-2xl font-light tracking-wide text-sm sm:text-base overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {generating ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span>生成试衣效果</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleRetry}
              className="flex-1 py-4 sm:py-5 bg-white/5 border border-white/10 text-gray-300 rounded-xl sm:rounded-2xl font-light tracking-wide text-sm sm:text-base hover:bg-white/10 transition-all duration-300"
            >
              重新生成
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-4 sm:py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-xl sm:rounded-2xl font-light tracking-wide text-sm sm:text-base hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
            >
              下载图片
            </button>
          </div>
        )}

        {generating && (
          <div className="mt-8 sm:mt-10">
            <div className="flex justify-between mb-2 sm:mb-3">
              <span className="text-gray-400 font-light text-sm sm:text-base">{progressMessage}</span>
              <span className="text-amber-400 font-medium text-sm sm:text-base">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {resultImage && (
          <div className="mt-8 sm:mt-10">
            <h3 className="text-lg sm:text-xl font-light text-center mb-4 sm:mb-6">试衣效果</h3>
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img src={resultImage} alt="试衣效果" className="w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryView({ token }: any) {
  const [histories, setHistories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistories();
  }, []);

  const fetchHistories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tryon/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistories(res.data);
    } catch (err) {
      console.error('Failed to fetch histories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await axios.delete(`${API_BASE}/tryon/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistories();
    } catch (err) {
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 sm:py-24">
        <div className="animate-spin w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 border-4 border-amber-500/30 border-t-amber-500 rounded-full" />
        <p className="text-gray-400 font-light text-sm sm:text-base">加载中...</p>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 px-4">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-light mb-2">试衣历史</h2>
        <p className="text-gray-400 font-light text-sm sm:text-base">您的专属试衣记录</p>
      </div>
      {histories.length === 0 ? (
        <div className="text-center py-20 sm:py-24">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 font-light text-sm sm:text-base">暂无试衣记录</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {histories.map((history) => (
            <div key={history.id} className="group backdrop-blur-2xl bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-500">
              <div className="relative aspect-[3/4]">
                <img src={`http://localhost:3001${history.resultImageUrl}`} alt="试衣效果" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `http://localhost:3001${history.resultImageUrl}`;
                        link.download = `tryon-${history.id}.jpg`;
                        link.click();
                      }}
                      className="flex-1 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-light hover:bg-white/30 transition-colors"
                    >
                      下载
                    </button>
                    <button
                      onClick={() => handleDelete(history.id)}
                      className="flex-1 py-2 sm:py-2.5 bg-red-500/20 backdrop-blur-sm text-red-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-light hover:bg-red-500/30 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-gray-500 text-xs sm:text-sm font-light">{new Date(history.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionView({ token, setUsageInfo }: any) {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscription(res.data.subscription);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

  const handleSubscribe = async (plan: string) => {
    if (!confirm(`确认订阅${plan === 'monthly' ? '月度' : '年度'}VIP会员？价格：${plan === 'monthly' ? '¥9.9' : '¥99'}`)) return;
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/subscription`, { plan, wechatPaymentId: 'mock_payment_' + Date.now() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('订阅成功！');
      fetchSubscription();
      const usageRes = await axios.get(`${API_BASE}/tryon/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsageInfo(usageRes.data);
    } catch (err) {
      alert('订阅失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto py-6 sm:py-8 px-4">
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-5 sm:mb-6">
          <span className="text-amber-400 text-xs sm:text-sm">✨ VIP会员</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-light mb-3">解锁无限可能</h2>
        <p className="text-gray-400 font-light text-sm sm:text-base max-w-xl mx-auto">成为VIP会员，享受无限次试衣、优先处理等专属权益</p>
      </div>
      
      {subscription && subscription.status === 'active' ? (
        <div className="backdrop-blur-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/25">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 01-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-2xl sm:text-3xl font-light mb-2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">VIP会员已激活</h3>
          <p className="text-gray-400 font-light text-sm sm:text-base mb-2">享受无限试衣特权</p>
          <p className="text-amber-400 font-medium text-sm sm:text-base">有效期至: {new Date(subscription.endDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 hover:border-amber-500/30 transition-all duration-500">
            <div className="mb-5 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-light mb-2">月度会员</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-light text-white">¥9.9</span>
                <span className="text-gray-500 font-light text-sm sm:text-base">/月</span>
              </div>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-7 sm:mb-8">
              <li className="flex items-center gap-2 sm:gap-3 text-gray-300 font-light text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                无限次试衣
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-gray-300 font-light text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                永久保存历史记录
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-gray-300 font-light text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                优先处理
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading}
              className="w-full py-3.5 sm:py-4 border border-amber-500/50 text-amber-400 rounded-xl sm:rounded-2xl font-light tracking-wide text-sm sm:text-base hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? '处理中...' : '立即订阅'}
            </button>
          </div>

          <div className="relative backdrop-blur-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/50 rounded-2xl sm:rounded-3xl p-6 sm:p-10 overflow-hidden">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 rounded-full text-xs sm:text-sm font-semibold shadow-lg shadow-amber-500/25">
              推荐
            </div>
            <div className="mb-5 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-light mb-2">年度会员</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-light text-white">¥99</span>
                <span className="text-gray-500 font-light text-sm sm:text-base">/年</span>
              </div>
              <p className="text-amber-400 text-xs sm:text-sm mt-2 font-light">节省 ¥20+</p>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-7 sm:mb-8">
              <li className="flex items-center gap-2 sm:gap-3 text-gray-200 font-light text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                无限次试衣
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-gray-200 font-light text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                永久保存历史记录
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-gray-200 font-light text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                优先处理
              </li>
              <li className="flex items-center gap-2 sm:gap-3 text-gray-200 font-light text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                专属客服支持
              </li>
            </ul>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={loading}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-xl sm:rounded-2xl font-light tracking-wide text-sm sm:text-base hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? '处理中...' : '立即订阅'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
