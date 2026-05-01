'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const API_BASE = '/api';

const quillModules = {
  toolbar: [
    [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'align',
  'link',
];

interface Recipient {
  id: string;
  email: string;
  nickname: string;
}

interface LogEntry {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  content: string;
  fromEmail: string;
  fromName: string;
  status: string;
  errorMessage: string | null;
  sentAt: string;
}

interface TaskSummary {
  taskId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  sentAt: string;
  total: number;
  success: number;
  failed: number;
}

interface Template {
  id: string;
  name: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  content: string;
}

export default function BulkEmailPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'logs'>('compose');

  const [fromEmail, setFromEmail] = useState('hello@dzqjiaju.com');
  const [fromName, setFromName] = useState('试衣助手');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set());
  const [todaySent, setTodaySent] = useState(0);
  const [todayRemaining, setTodayRemaining] = useState(100);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  const [userSearch, setUserSearch] = useState('');

  const [sending, setSending] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ total: 0, sent: 0, success: 0, failed: 0, isCompleted: false });
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [logs, setLogs] = useState<TaskSummary[]>([]);
  const [logDetail, setLogDetail] = useState<LogEntry[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewingLogContent, setViewingLogContent] = useState<LogEntry | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE}/admin/bulk-email/send`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && Array.isArray(res.data.recipients)) {
        setRecipients(res.data.recipients);
        setTodaySent(res.data.todaySent || 0);
        setTodayRemaining(res.data.todayRemaining || 100);
      }
    } catch (err) {
      console.error('Failed to fetch recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE}/admin/bulk-email/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && Array.isArray(res.data.templates)) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const loadLogs = async (page: number = 1) => {
    try {
      setLoadingLogs(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE}/admin/bulk-email/logs?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setLogs(res.data.tasks || []);
        setLogsTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadLogDetail = async (tid: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE}/admin/bulk-email/logs?taskId=${tid}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setLogDetail(res.data.logs || []);
        setSelectedTaskId(tid);
      }
    } catch (err) {
      console.error('Failed to fetch log detail:', err);
    }
  };

  useEffect(() => {
    loadRecipients();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs(logsPage);
    }
  }, [activeTab, logsPage]);

  const startPolling = (tid: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE}/admin/bulk-email/progress?taskId=${tid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setProgress({
          total: data.total || 0,
          sent: data.sent || 0,
          success: data.success || 0,
          failed: data.failed || 0,
          isCompleted: !!data.isCompleted,
        });
        if (data.isCompleted) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setSending(false);
          setShowCompleteModal(true);
        }
      } catch {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setSending(false);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const toggleExclude = (id: string) => {
    setExcludeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('请输入模板名称');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.post(`${API_BASE}/admin/bulk-email/templates`, {
        name: templateName,
        fromEmail,
        fromName,
        subject,
        content,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowTemplateModal(false);
      setTemplateName('');
      loadTemplates();
      alert('模板保存成功！');
    } catch (err: any) {
      alert(err.response?.data?.error || '保存模板失败');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('确定删除此模板？')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.delete(`${API_BASE}/admin/bulk-email/templates?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadTemplates();
    } catch (err: any) {
      alert(err.response?.data?.error || '删除模板失败');
    }
  };

  const handleApplyTemplate = (t: Template) => {
    setFromEmail(t.fromEmail);
    setFromName(t.fromName);
    setSubject(t.subject);
    setContent(t.content);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      alert('请填写邮件标题');
      return;
    }
    if (!content.trim() || content.trim() === '<p><br></p>') {
      alert('请填写邮件内容');
      return;
    }
    const finalRecipients = recipients.filter(r => !excludeIds.has(r.id));
    if (finalRecipients.length === 0) {
      alert('没有可发送的收件人');
      return;
    }
    const confirmed = window.confirm(
      `即将向 ${finalRecipients.length} 位用户发送邮件，今日已发送 ${todaySent} 封，剩余额度 ${todayRemaining} 封。确认发送？`
    );
    if (!confirmed) return;
    try {
      setSending(true);
      setProgress({ total: 0, sent: 0, success: 0, failed: 0, isCompleted: false });
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.post(
        `${API_BASE}/admin/bulk-email/send`,
        { fromEmail, fromName, subject, content, excludeUserIds: Array.from(excludeIds) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newTaskId = res.data.taskId;
      const total = res.data.total || 0;
      setTaskId(newTaskId);
      setProgress(prev => ({ ...prev, total }));
      startPolling(newTaskId);
    } catch (err: any) {
      alert(err.response?.data?.error || '发送失败');
      setSending(false);
    }
  };

  const filteredRecipients = recipients.filter(r => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (r.nickname || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q);
  });

  const effectiveRecipients = recipients.filter(r => !excludeIds.has(r.id)).length;
  const progressPercent = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0;

  const excludedList = recipients.filter(r => excludeIds.has(r.id));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">邮件群发</h1>
        <p className="text-gray-400 mt-2">向注册用户批量发送邮件</p>
      </div>

      <div className="flex border-b border-gray-700 mb-6">
        <button onClick={() => setActiveTab('compose')} className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'compose' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-gray-300'}`}>发送邮件</button>
        <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'logs' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-gray-300'}`}>发送日志</button>
      </div>

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">邮件设置</h2>
                <div className="flex gap-2">
                  {templates.length > 0 && (
                    <select
                      className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-amber-400"
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          const t = templates.find(t => t.id === e.target.value);
                          if (t) handleApplyTemplate(t);
                        }
                      }}
                    >
                      <option value="">使用模板...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 text-sm hover:bg-gray-600"
                  >
                    保存为模板
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">发件人名称</label>
                  <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="发件人名称" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">发件人邮箱</label>
                  <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="请输入发件人邮箱" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">邮件标题</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-400" placeholder="请输入邮件标题" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">邮件内容</label>
                <div className="rounded-lg overflow-hidden border border-gray-600">
                  <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} formats={quillFormats} style={{ minHeight: '250px' }} />
                </div>
              </div>
            </div>

            {sending && (
              <div className="bg-gray-800 rounded-xl p-6 border border-amber-500/30">
                <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  正在发送中...
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">已发送 {progress.sent} / {progress.total} 封</span>
                    <span className="text-amber-400 font-medium">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span><span className="text-green-400">成功: {progress.success}</span></div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full"></span><span className="text-red-400">失败: {progress.failed}</span></div>
                </div>
              </div>
            )}

            {!sending && !progress.isCompleted && (
              <button onClick={handleSend} disabled={effectiveRecipients === 0} className="w-full px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                发送邮件 ({effectiveRecipients} 人)
              </button>
            )}

            {progress.isCompleted && (
              <div className="bg-gray-800 rounded-xl p-6 border-2 border-green-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-400">发送完成！</h3>
                    <p className="text-gray-400 text-xs">所有邮件已处理完毕</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{progress.total}</div>
                    <div className="text-xs text-gray-400 mt-1">总计</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{progress.success}</div>
                    <div className="text-xs text-gray-400 mt-1">成功</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">{progress.failed}</div>
                    <div className="text-xs text-gray-400 mt-1">失败</div>
                  </div>
                </div>
                <button onClick={() => { setProgress({ total: 0, sent: 0, success: 0, failed: 0, isCompleted: false }); setTaskId(null); loadRecipients(); }} className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors">
                  继续发送
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2">发送额度</h2>
              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-400">今日已发送</span><span className="text-white">{todaySent} 封</span></div>
                <div className="flex justify-between"><span className="text-gray-400">今日剩余</span><span className={todayRemaining > 0 ? 'text-green-400' : 'text-red-400'}>{todayRemaining} 封</span></div>
                <div className="flex justify-between"><span className="text-gray-400">每日上限</span><span className="text-white">100 封</span></div>
              </div>
            </div>

            {excludedList.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-amber-400 mb-2">已排除的用户 ({excludedList.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {excludedList.map(r => (
                    <span key={r.id} className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                      {r.nickname || r.email}
                      <button onClick={() => toggleExclude(r.id)} className="text-red-400 hover:text-red-300 ml-1 font-bold">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2">排除用户</h2>
              <p className="text-xs text-gray-500 mb-3">搜索并勾选要排除的用户</p>
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full px-3 py-2 mb-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
                placeholder="搜索用户名或邮箱..."
              />
              {loadingRecipients ? (
                <div className="text-gray-400 text-sm py-4 text-center">加载中...</div>
              ) : filteredRecipients.length === 0 ? (
                <div className="text-gray-500 text-sm py-4 text-center">{userSearch ? '未找到匹配的用户' : '没有可发送的用户'}</div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredRecipients.map(r => (
                    <label key={r.id} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 cursor-pointer text-sm">
                      <input type="checkbox" checked={excludeIds.has(r.id)} onChange={() => toggleExclude(r.id)} className="rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-400" />
                      <span className="text-white truncate">{r.nickname || '未命名'}</span>
                      <span className="text-gray-500 text-xs truncate">{r.email}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {templates.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold mb-2">已保存模板</h2>
                <div className="space-y-2">
                  {templates.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{t.name}</div>
                        <div className="text-gray-500 text-xs truncate">{t.subject}</div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => handleApplyTemplate(t)} className="text-amber-400 hover:text-amber-300 text-xs px-2 py-1">应用</button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1">删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          {selectedTaskId ? (
            <div>
              <button onClick={() => { setSelectedTaskId(null); setLogDetail([]); }} className="mb-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm">
                ← 返回日志列表
              </button>
              {logDetail.length === 0 ? (
                <div className="text-gray-500 text-center py-8">暂无详细记录</div>
              ) : (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700 bg-gray-700/30">
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">收件人</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">昵称</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">状态</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">失败原因</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">发送时间</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logDetail.map((log) => (
                          <tr key={log.id} className="border-b border-gray-700/50">
                            <td className="px-4 py-3 text-white">{log.recipientEmail}</td>
                            <td className="px-4 py-3 text-gray-300">{log.recipientName || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {log.status === 'success' ? '成功' : '失败'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-red-400 text-xs max-w-xs truncate">{log.errorMessage || '-'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{log.sentAt ? new Date(log.sentAt).toLocaleString('zh-CN') : '-'}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => setViewingLogContent(log)} className="text-amber-400 hover:text-amber-300 text-xs">查看内容</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {loadingLogs ? (
                <div className="text-gray-400 text-center py-8">加载中...</div>
              ) : logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">暂无发送记录</div>
              ) : (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700 bg-gray-700/30">
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">标题</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">发件人</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">发送时间</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">总数</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">成功</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">失败</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((task) => (
                          <tr key={task.taskId} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="px-4 py-3 text-white">{task.subject || '-'}</td>
                            <td className="px-4 py-3 text-gray-300 text-xs">{task.fromName || '-'} &lt;{task.fromEmail || ''}&gt;</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{task.sentAt ? new Date(task.sentAt).toLocaleString('zh-CN') : '-'}</td>
                            <td className="px-4 py-3 text-white">{task.total}</td>
                            <td className="px-4 py-3 text-green-400">{task.success}</td>
                            <td className="px-4 py-3 text-red-400">{task.failed}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => loadLogDetail(task.taskId)} className="text-amber-400 hover:text-amber-300 text-xs">查看详情</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {logsTotal > 10 && (
                <div className="flex justify-center gap-2">
                  <button onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm">上一页</button>
                  <span className="px-4 py-2 text-gray-400 text-sm">第 {logsPage} 页 / 共 {Math.ceil(logsTotal / 10)} 页</span>
                  <button onClick={() => setLogsPage(p => p + 1)} disabled={logsPage >= Math.ceil(logsTotal / 10)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm">下一页</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-green-500/30 rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-400 mb-2">发送完毕！</h3>
            <p className="text-gray-400 mb-6">邮件群发任务已完成</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-xl font-bold text-white">{progress.total}</div>
                <div className="text-xs text-gray-400">总计</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3">
                <div className="text-xl font-bold text-green-400">{progress.success}</div>
                <div className="text-xs text-gray-400">成功</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3">
                <div className="text-xl font-bold text-red-400">{progress.failed}</div>
                <div className="text-xs text-gray-400">失败</div>
              </div>
            </div>
            <button onClick={() => setShowCompleteModal(false)} className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
              确定
            </button>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">保存为模板</h3>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 focus:outline-none focus:border-amber-400"
              placeholder="请输入模板名称"
              autoFocus
            />
            <div className="bg-gray-700/50 rounded-lg p-3 mb-4 text-xs text-gray-400">
              <p>将保存当前邮件的发件人、标题和内容</p>
              <p className="mt-1">标题：{subject || '(未填写)'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowTemplateModal(false); setTemplateName(''); }} className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">取消</button>
              <button onClick={handleSaveTemplate} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">保存</button>
            </div>
          </div>
        </div>
      )}

      {viewingLogContent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">邮件内容</h3>
              <button onClick={() => setViewingLogContent(null)} className="text-gray-400 hover:text-gray-300 text-xl">&times;</button>
            </div>
            <div className="space-y-3 mb-4 text-sm">
              <div className="flex gap-2"><span className="text-gray-400 w-20">发件人:</span><span className="text-white">{viewingLogContent.fromName} &lt;{viewingLogContent.fromEmail}&gt;</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-20">收件人:</span><span className="text-white">{viewingLogContent.recipientEmail}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-20">标题:</span><span className="text-white">{viewingLogContent.subject}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-20">状态:</span><span className={viewingLogContent.status === 'success' ? 'text-green-400' : 'text-red-400'}>{viewingLogContent.status === 'success' ? '成功' : '失败'}</span></div>
            </div>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-900" dangerouslySetInnerHTML={{ __html: viewingLogContent.content || '' }} />
            <button onClick={() => setViewingLogContent(null)} className="w-full mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
