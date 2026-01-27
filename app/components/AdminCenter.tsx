
import React, { useState, useMemo } from 'react';
import { AppState, User, LogEntry, LoginLogEntry, Task, FeatureRequest, Announcement, AnnouncementLevel } from '~/types';
import { 
  Users, History, Shield, Eye, Monitor, Smartphone, X, FileText,
  ShieldCheck, Lock, ChevronDown, Check, RefreshCw, ArrowRight, HelpCircle,
  MessageSquareWarning, MoreHorizontal, Settings, Globe, Clock, Bot, Trash2, Plus,
  Layers, ChevronRight, Edit2, Layout, Lightbulb, CheckCircle2, AlertCircle, Sparkles, Terminal,
  UserCheck, Image as ImageIcon, ExternalLink, Tags, Tag as TagIcon, Search, FolderPlus, Save,
  BarChart3, Activity, PieChart as PieIcon, Star, UserPlus, ZapOff, TrendingUp, Calendar, Map,
  Key, Cpu, Database, Network, BarChart as BarChartIcon, Trash, Info, ChevronLeft, Save as SaveIcon,
  Folder, LogIn, AlertTriangle, Code, Activity as Pulse, Coins, ToggleLeft, Share2, Wrench, Download, Database as DbIcon,
  User as UserIconSimple, Megaphone, Wrench as WrenchIcon, Sparkles as SparklesIcon,
  ArrowUpRight, AlertOctagon, UserMinus, UserCheckIcon, Zap, ArrowLeft, CheckSquare, Square,
  ShieldAlert, MessageCircle, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';

const UI_TOKEN = {
  H1: "text-[28px] font-black text-stone-900 tracking-tight",
  SUB: "text-stone-500 text-sm font-medium mt-1",
  NAV_ACTIVE: "text-[14px] font-bold text-stone-950 border-b-[5px] border-stone-900 pb-4 transition-all",
  NAV_INACTIVE: "text-[14px] font-medium text-stone-400 hover:text-stone-800 pb-4 transition-colors",
  CARD: "bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden",
  BADGE: "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
};

// --- Added Component: DashboardOverview ---
const DashboardOverview = ({ data }: { data: AppState }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
    <div className={UI_TOKEN.CARD + " p-8"}>
      <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">總任務數</h3>
      <p className="text-4xl font-black text-stone-800">{data.tasks.length}</p>
    </div>
    <div className={UI_TOKEN.CARD + " p-8"}>
      <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">活躍專案</h3>
      <p className="text-4xl font-black text-stone-800">{data.projects.length}</p>
    </div>
    <div className={UI_TOKEN.CARD + " p-8"}>
      <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">系統使用者</h3>
      <p className="text-4xl font-black text-stone-800">{data.users.length}</p>
    </div>
  </div>
);

// --- Added Component: PermissionManagementView ---
const PermissionManagementView = ({ data }: { data: AppState }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className={UI_TOKEN.CARD + " p-8"}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-stone-800">權限模板列表</h3>
        <button className="bg-stone-900 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg">新增模板</button>
      </div>
      <div className="space-y-4">
        {['系統管理員', '部門主管', '一般員工'].map(role => (
          <div key={role} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <span className="font-bold text-stone-700">{role}</span>
            <button className="text-stone-400 hover:text-stone-800"><Settings size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Added Component: AddDepartmentModal ---
const AddDepartmentModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4">
    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-6">
      <h3 className="text-2xl font-black text-stone-800">新增部門</h3>
      <input type="text" placeholder="部門名稱" className="w-full p-4 rounded-xl border border-stone-200" />
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 py-4 bg-stone-100 rounded-xl font-bold">取消</button>
        <button className="flex-1 py-4 bg-stone-900 text-white rounded-xl font-bold">建立</button>
      </div>
    </div>
  </div>
);

// --- Added Component: CreateAnnouncementModal ---
const CreateAnnouncementModal = ({ announcement, onClose }: { announcement: any, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4">
    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 space-y-6">
      <h3 className="text-2xl font-black text-stone-800">{announcement ? '編輯公告' : '新增公告'}</h3>
      <input type="text" placeholder="標題" defaultValue={announcement?.title} className="w-full p-4 rounded-xl border border-stone-200" />
      <textarea placeholder="內容" defaultValue={announcement?.content} className="w-full p-4 rounded-xl border border-stone-200 h-32" />
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 py-4 bg-stone-100 rounded-xl font-bold">取消</button>
        <button className="flex-1 py-4 bg-stone-900 text-white rounded-xl font-bold">發布</button>
      </div>
    </div>
  </div>
);

// --- Added Component: UserGuideView ---
const UserGuideView = () => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6">
    <h2 className="text-2xl font-black text-stone-800">使用教學管理</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {['新手入職', '任務操作', '時間分配', '專案管理'].map(guide => (
        <div key={guide} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center group cursor-pointer hover:border-stone-300">
          <span className="font-bold text-stone-700">{guide}</span>
          <ChevronRight size={18} className="text-stone-300 group-hover:text-stone-900" />
        </div>
      ))}
    </div>
  </div>
);

const PERMISSION_GROUPS = [
  {
    name: '工單管理',
    items: [
      { id: 'tickets.create', label: '建立工單', desc: '可建立新工單' },
      { id: 'tickets.delete', label: '刪除工單', desc: '可刪除工單' },
      { id: 'tickets.update', label: '編輯工單', desc: '可編輯工單內容' },
      { id: 'tickets.view', label: '查看工單', desc: '可查看 QA 溝通工單' },
    ]
  },
  {
    name: '工廠管理',
    items: [
      { id: 'factory.vault', label: '工廠報價資料庫', desc: '可存取工廠報價資料庫' },
    ]
  },
  {
    name: '系統管理',
    items: [
      { id: 'system.announcements', label: '公告管理', desc: '可管理系統公告' },
      { id: 'system.integrations', label: '整合管理', desc: '可管理外部整合設定' },
      { id: 'system.logs', label: '日誌查看', desc: '可查看系統日誌' },
      { id: 'system.settings', label: '系統管理', desc: '可存取系統設定頁面' },
      { id: 'system.users', label: '使用者管理', desc: '可管理使用者帳號' },
    ]
  },
];

const AdminCenter: React.FC<{ data: AppState }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'departments' | 'categories' | 'tags' | 'logs' | 'announcements' | 'guide' | 'ai' | 'system'>('overview');
  const [logSubTab, setLogSubTab] = useState<'op' | 'login' | 'error' | 'api'>('op');
  const [sysSubTab, setSysSubTab] = useState<'general' | 'exchange' | 'fields' | 'flags' | 'integration' | 'tools'>('general');
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [catSearch, setCatSearch] = useState('');
  const [activeTagCategory, setActiveTagCategory] = useState('聯絡狀態');

  const navItems = [
    { id: 'overview', label: '統計儀表板', icon: BarChartIcon },
    { id: 'permissions', label: '權限管理', icon: Users },
    { id: 'departments', label: '部門清單', icon: Layers },
    { id: 'categories', label: '類別管理', icon: FolderPlus },
    { id: 'tags', label: '標籤管理', icon: TagIcon },
    { id: 'logs', label: '日誌中心', icon: History },
    { id: 'announcements', label: '公告管理', icon: Megaphone },
    { id: 'guide', label: '使用教學', icon: Smartphone },
    { id: 'ai', label: 'AI 模型設定', icon: Bot },
    { id: 'system', label: '系統設定', icon: Settings },
  ] as const;

  const tagCategories = ['聯絡狀態', '服務項目', '廠商評價', '其他'];
  const logTabs = [ { id: 'op', label: '操作日誌', icon: Pulse }, { id: 'login', label: '登入日誌', icon: LogIn }, { id: 'error', label: '錯誤日誌', icon: AlertTriangle }, { id: 'api', label: 'API 日誌', icon: Code } ] as const;

  return (
    <div className="max-w-screen-xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <header><h1 className={UI_TOKEN.H1}>系統管理中心</h1><p className={UI_TOKEN.SUB}>組織營運核心稽核與數據監測</p></header>
      <div className="flex gap-10 border-b border-stone-200 sticky top-0 bg-stone-50/90 backdrop-blur-sm z-30 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {navItems.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={activeTab === tab.id ? UI_TOKEN.NAV_ACTIVE : UI_TOKEN.NAV_INACTIVE}><div className="flex items-center gap-2.5"><tab.icon size={18} />{tab.label}</div></button>
        ))}
      </div>
      <div className="min-h-[500px] space-y-8">
        {activeTab === 'overview' && <DashboardOverview data={data} />}
        {activeTab === 'permissions' && <PermissionManagementView data={data} />}
        {activeTab === 'departments' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-4 rounded-[1.5rem] border border-stone-100 shadow-sm flex justify-between items-center px-10"><h2 className="text-xl font-black text-stone-800">組織架構</h2><button onClick={() => setShowAddDeptModal(true)} className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-stone-800 shadow-xl shadow-stone-200 active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{[ { name: '研發部', code: 'RD', count: 8 }, { name: '設計部', code: 'DESIGN', count: 4 }, { name: '業務部', code: 'SALES', count: 12 }, { name: 'Management', code: 'MGMT', count: 2 } ].map((d, idx) => ( <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm flex justify-between items-center group hover:shadow-xl hover:-translate-y-1 transition-all"><div className="space-y-1"><h4 className="text-2xl font-black text-stone-800">{d.name}</h4><p className="text-[10px] text-stone-300 font-black uppercase tracking-widest">{d.code}</p></div><div className="text-right"><p className="text-5xl font-black text-stone-800">{d.count}</p><p className="text-[10px] text-stone-300 font-black uppercase tracking-widest mt-1">MEMBERS</p></div></div> ))}</div>
              {showAddDeptModal && <AddDepartmentModal onClose={() => setShowAddDeptModal(false)} />}
           </div>
        )}
        {activeTab === 'categories' && (
           <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500"><div className="w-full lg:w-1/3"><div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-8"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400"><Folder size={24} /></div><h3 className="text-2xl font-black text-stone-800">新增類別</h3></div><div className="space-y-3"><label className="text-[11px] font-black text-stone-400 uppercase tracking-widest block">類別名稱</label><input type="text" placeholder="例如 : 特殊處理物件" className="w-full p-5 bg-stone-50 border border-stone-100 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-stone-100 font-bold text-stone-700" /></div><button className="w-full bg-stone-500 text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest shadow-xl shadow-stone-100 hover:bg-stone-600 transition-all active:scale-95">建立新類別</button></div></div><div className="flex-1"><div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-10 min-h-[600px]"><div className="flex flex-col md:flex-row justify-between items-center gap-6"><h3 className="text-2xl font-black text-stone-800">類別列表 ({data.goals.length})</h3><div className="relative w-full md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} /><input value={catSearch} onChange={e => setCatSearch(e.target.value)} type="text" placeholder="關鍵字搜尋..." className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-stone-100" /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{data.goals.filter(g => g.toLowerCase().includes(catSearch.toLowerCase())).map((goal) => ( <div key={goal} className="bg-white border border-stone-100 rounded-[2rem] p-6 flex items-center gap-5 group hover:border-stone-300 transition-all cursor-pointer"><div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-800 font-black text-lg shadow-sm group-hover:scale-105 transition-transform">{goal.charAt(0)}</div><span className="text-xl font-black text-stone-800 tracking-tight">{goal}</span></div> ))}</div></div></div></div>
        )}
        {activeTab === 'tags' && (
           <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 items-start"><div className="w-full lg:w-[280px] bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-4 space-y-2">{tagCategories.map(cat => ( <button key={cat} onClick={() => setActiveTagCategory(cat)} className={`w-full p-6 rounded-2xl flex justify-between items-center transition-all ${activeTagCategory === cat ? 'bg-stone-900 text-white shadow-xl shadow-stone-200' : 'text-stone-500 hover:bg-stone-50'}`}><span className="font-black text-base">{cat}</span><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${activeTagCategory === cat ? 'bg-stone-100 text-stone-400' : 'bg-stone-100 text-stone-400'}`}>0</div></button> ))}</div><div className="flex-1 w-full bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-12 min-h-[400px]"><h2 className="text-3xl font-black text-stone-800 mb-12">{activeTagCategory} 標籤庫</h2><div className="flex gap-4 items-center"><div className="flex-1 relative"><input type="text" placeholder="輸入新標籤..." className="w-full p-6 bg-stone-50 border border-stone-100 rounded-[1.5rem] outline-none font-bold text-stone-400 text-lg" /></div><button className="px-10 py-6 bg-stone-900 text-white rounded-[1.5rem] font-black text-lg flex items-center gap-3 shadow-2xl shadow-stone-200 hover:bg-stone-800 transition-all active:scale-95"><Plus size={24} strokeWidth={3} /> 新增</button></div><div className="mt-20 flex flex-col items-center justify-center text-stone-200"><TagIcon size={80} strokeWidth={1} /><p className="mt-4 font-black text-stone-300 uppercase tracking-widest">目前尚無標籤數據</p></div></div></div>
        )}
        {activeTab === 'logs' && (
           <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
               {logTabs.map(tab => ( 
                 <button key={tab.id} onClick={() => setLogSubTab(tab.id)} className={`px-8 py-3 rounded-full flex items-center gap-3 font-black text-sm transition-all whitespace-nowrap border-2 ${logSubTab === tab.id ? 'bg-stone-900 text-white border-stone-900 shadow-xl shadow-stone-200' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}>
                   <tab.icon size={18} /> {tab.label}
                 </button> 
               ))}
             </div>
             
             <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm flex items-center gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                 <input type="text" placeholder="搜尋..." className="w-full pl-16 pr-8 py-5 bg-stone-50/50 border border-stone-100 rounded-3xl text-sm font-bold text-stone-600 outline-none focus:bg-white focus:ring-2 focus:ring-stone-100 transition-all" />
               </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden min-h-[500px]">
               <table className="w-full text-left">
                 <thead className="bg-stone-50/30 border-b border-stone-50">
                   <tr className="text-[11px] font-black text-stone-300 uppercase tracking-[0.2em]">
                     {logSubTab === 'op' && (<><th className="px-8 py-6">時間</th><th className="px-8 py-6">人員</th><th className="px-8 py-6">動作</th><th className="px-8 py-6">對象</th><th className="px-8 py-6">詳情</th></>)}
                     {logSubTab === 'login' && (<><th className="px-8 py-6">時間</th><th className="px-8 py-6">人員</th><th className="px-8 py-6">IP 位址</th><th className="px-8 py-6">裝置</th><th className="px-8 py-6">狀態</th></>)}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-50">
                   {logSubTab === 'op' && data.logs.map(l => ( 
                     <tr key={l.id} className="hover:bg-stone-50/30 transition-colors"><td className="px-8 py-6 text-xs text-stone-400 font-mono">{new Date(l.timestamp).toLocaleString()}</td><td className="px-8 py-6 font-black text-stone-700 text-sm">系統管理員</td><td className="px-8 py-6"><span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px] font-black uppercase">{l.action.toLowerCase()}</span></td><td className="px-8 py-6 text-stone-500 text-sm">{l.target}</td><td className="px-8 py-6 text-stone-400 text-xs font-medium">{l.details}</td></tr> 
                   ))}
                   {logSubTab === 'login' && data.loginLogs.map(l => ( 
                     <tr key={l.id} className="hover:bg-stone-50/30 transition-colors"><td className="px-8 py-6 text-xs text-stone-400 font-mono">{new Date(l.timestamp).toLocaleString()}</td><td className="px-8 py-6 font-black text-stone-700 text-sm">{l.userName}</td><td className="px-8 py-6 text-stone-500 font-mono text-xs">{l.ipAddress}</td><td className="px-8 py-6 text-stone-400 text-xs">{l.device}</td><td className="px-8 py-6"><span className={`px-3 py-1 rounded text-[9px] font-black uppercase ${l.status==='success'?'bg-stone-900 text-white':'bg-red-500 text-white'}`}>{l.status}</span></td></tr> 
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}
        {activeTab === 'announcements' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div><h2 className="text-2xl font-black text-stone-800">公告管理</h2><p className="text-sm text-stone-400 mt-1 font-medium">發布系統維護通知、新功能上線或一般訊息。</p></div>
                <button onClick={() => { setEditingAnnouncement(null); setShowCreateAnnouncement(true); }} className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-stone-800 transition-all active:scale-95"><Plus size={20} /> 新增公告</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[ { id: '1', title: '系統維護通知', content: '系統將於今晚進行維護更新。', createdAt: '2023-10-27T00:00:00.000Z', isActive: true, level: 'warning' } ].map((ann) => (
                    <div key={ann.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all h-[280px]">
                      <div className="space-y-4"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-400"><Megaphone size={20} /></div><div className="min-w-0 flex-1"><h4 className="font-black text-lg text-stone-800 truncate">{ann.title}</h4><p className="text-[9px] font-mono text-stone-300">{ann.createdAt}</p></div></div><p className="text-stone-400 text-sm font-medium line-clamp-4 leading-relaxed">{ann.content}</p></div>
                      <div className="pt-6 flex justify-between items-center border-t border-stone-50"><span className="px-3 py-1 bg-stone-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest">ACTIVE</span><div className="flex gap-4 text-stone-300"><button onClick={() => { setEditingAnnouncement(ann); setShowCreateAnnouncement(true); }} className="hover:text-stone-800 transition-colors"><Edit2 size={16} /></button><button className="hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div></div>
                    </div>
                ))}
              </div>
              {showCreateAnnouncement && <CreateAnnouncementModal announcement={editingAnnouncement} onClose={() => setShowCreateAnnouncement(false)} />}
           </div>
        )}
        {activeTab === 'guide' && <UserGuideView />}
        {activeTab === 'ai' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className={UI_TOKEN.CARD + " p-8 space-y-4"}><h4 className="text-sm font-black text-stone-800 flex items-center gap-2"><Bot size={18}/> 核心模型設定</h4><div className="p-6 bg-stone-50 rounded-2xl border border-stone-100"><p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">當前模型</p><p className="font-mono font-bold text-stone-800">gemini-3-flash-preview</p></div></div><div className={UI_TOKEN.CARD + " p-8 space-y-4"}><h4 className="text-sm font-black text-stone-800">系統提示詞 (唯讀)</h4><div className="p-6 bg-stone-900 text-emerald-400 rounded-2xl font-mono text-xs h-32 overflow-hidden opacity-80 leading-relaxed">{`System Instruction: 您是一位具備多年專案管理經驗的 AI 助手。`}</div></div></div>)}
        {activeTab === 'system' && (
           <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in duration-500 items-start"><div className="w-full lg:w-[260px] bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-4 space-y-2 shrink-0">{[ { id: 'general', label: '一般設定', icon: Settings } ].map(item => ( <button key={item.id} onClick={() => setSysSubTab(item.id as any)} className={`w-full p-6 rounded-2xl flex items-center gap-4 transition-all ${sysSubTab === item.id ? 'bg-stone-900 text-white shadow-xl shadow-stone-200' : 'text-stone-500 hover:bg-stone-50'}`}><item.icon size={20} /><span className="font-black text-base">{item.label}</span></button> ))}</div><div className="flex-1 w-full bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-12 min-h-[600px] relative overflow-hidden">{sysSubTab === 'general' && ( <div className="space-y-12 animate-in slide-in-from-right-4"><div className="flex items-center gap-4 text-stone-800"><Settings size={28} className="text-stone-300" /><h2 className="text-3xl font-black">基本參數設定</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-10"><div className="space-y-4"><label className="text-[11px] font-black text-stone-400 uppercase tracking-widest">系統顯示名稱</label><input type="text" defaultValue="Chronos 任務大師決策台" className="w-full p-6 bg-stone-50 border border-stone-100 rounded-[1.5rem] font-bold text-stone-800 outline-none" /></div><div className="space-y-4"><label className="text-[11px] font-black text-stone-400 uppercase tracking-widest">閒置登出時間 (分鐘)</label><input type="number" defaultValue={60} className="w-full p-6 bg-stone-50 border border-stone-100 rounded-[1.5rem] font-bold text-stone-800 outline-none" /></div></div><div className="pt-10 flex justify-end"><button className="bg-stone-900 text-white px-12 py-5 rounded-[1.5rem] font-black tracking-widest shadow-2xl hover:bg-stone-800 transition-all active:scale-95">儲存變更</button></div></div> )}</div></div>
        )}
      </div>
    </div>
  );
};

export default AdminCenter;
