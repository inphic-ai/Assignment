import React, { useState, useRef, useEffect } from 'react';
import { NavTab, User, Announcement } from '../types';
import { 
  LayoutDashboard, CheckSquare, FolderKanban, BookOpen, Settings, 
  Plus, CalendarClock, Megaphone, AlertTriangle, Info, Repeat, 
  UserCircle, ListTodo, ChevronDown, HelpCircle, Target, Moon,
  Check, Users, Building, ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenCreate: () => void;
  children: React.ReactNode;
  currentUser: User;
  users: User[];
  onSwitchUser: (userId: string) => void;
  activeAnnouncement?: Announcement;
}

const Layout: React.FC<LayoutProps> = ({ 
  currentTab, onNavigate, onOpenCreate, children, currentUser, 
  users, onSwitchUser, activeAnnouncement
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '戰情室', category: '資源導覽' },
    { id: 'personal_dashboard', icon: UserCircle, label: '個人儀表板', category: '資源導覽' },
    { id: 'daily', icon: CheckSquare, label: '日常任務', category: '資源導覽' },
    { id: 'task_list', icon: ListTodo, label: '任務清單', category: '資源導覽' },
    { id: 'timeline', icon: CalendarClock, label: '時間分配', category: '資源導覽' },
    { id: 'projects', icon: FolderKanban, label: '專案任務', category: '資源導覽' },
    { id: 'routines', icon: Repeat, label: '例行工作', category: '資源導覽' },
    { id: 'knowledge', icon: BookOpen, label: '知識庫', category: '管理中心' },
    { id: 'announcement', icon: Megaphone, label: '系統公告', category: '管理中心' },
    { id: 'feature_request', icon: HelpCircle, label: '功能建議', category: '管理中心' },
    { id: 'admin', icon: Settings, label: '系統管理', category: '管理中心', requiredRole: 'admin' }, 
  ];

  // 取得當前使用者可見的導覽項目
  const visibleItems = navItems.filter(item => {
    if (item.requiredRole === 'admin' && currentUser.role !== 'admin') return false;
    return true;
  });

  // 按部門分組使用者 (用於切換器)
  const groupedUsers = users.reduce((acc, user) => {
    const dept = user.department || '核心部隊';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-stone-900">
      {/* 側邊導覽欄 */}
      <aside className="w-[280px] bg-white border-r border-stone-100 flex flex-col z-20">
        
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center text-white shadow-lg">
               <Moon size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">精英團隊</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          {['資源導覽', '管理中心'].map((cat) => {
            // 檢查該分類下是否有使用者可見的項目
            const categoryItems = visibleItems.filter(item => item.category === cat);
            if (categoryItems.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <h3 className="px-4 text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] mb-4">
                  {cat}
                </h3>
                <div className="space-y-1">
                  {categoryItems.map(item => {
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id as NavTab)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                          isActive 
                            ? 'bg-[#44403c] text-white shadow-xl' 
                            : 'text-stone-400 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        <item.icon size={20} className={isActive ? 'text-white' : 'text-stone-300 group-hover:text-stone-500'} />
                        <span className="text-[14px] font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* 使用者切換器 */}
        <div className="p-6 border-t border-stone-50 relative" ref={menuRef}>
          {showUserMenu && (
            <div className="absolute bottom-full left-6 right-6 mb-4 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-stone-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300 z-50">
               <div className="p-5 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Users size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">切換角色視角</span>
                  </div>
               </div>
               
               <div className="max-h-[400px] overflow-y-auto p-2 space-y-4 custom-scrollbar">
                  {Object.entries(groupedUsers).map(([dept, deptUsers]) => (
                    <div key={dept} className="space-y-1">
                       <div className="px-3 py-2 flex items-center gap-2">
                          <div className="w-1 h-3 bg-stone-200 rounded-full"></div>
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{dept}</span>
                       </div>
                       {deptUsers.map(u => (
                         <button 
                            key={u.id}
                            onClick={() => { onSwitchUser(u.id); setShowUserMenu(false); }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${currentUser.id === u.id ? 'bg-amber-50 shadow-sm' : 'hover:bg-stone-50'}`}
                         >
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] uppercase shadow-sm ${currentUser.id === u.id ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                 {u.name.charAt(0)}
                               </div>
                               <div className="text-left">
                                  <p className={`text-[12px] font-black ${currentUser.id === u.id ? 'text-amber-900' : 'text-stone-700'}`}>{u.name}</p>
                                  <p className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter">{u.role}</p>
                               </div>
                            </div>
                            {currentUser.id === u.id && <Check size={14} className="text-amber-500" />}
                         </button>
                       ))}
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group ${showUserMenu ? 'bg-stone-100 shadow-inner' : 'hover:bg-stone-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-stone-100 p-0.5 overflow-hidden shadow-sm">
                <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs uppercase transition-colors ${showUserMenu ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                  {currentUser.name.charAt(0)}
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-[13px] font-black text-stone-900 leading-tight">{currentUser.name}</p>
                <p className="text-[11px] font-medium text-stone-300 uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-stone-300 transition-transform duration-300 ${showUserMenu ? 'rotate-180 text-amber-500' : ''}`} />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-stone-50/30 relative">
        <div className="p-12 max-w-7xl mx-auto">
           {children}
        </div>

        <button 
          onClick={onOpenCreate}
          className="fixed bottom-8 right-8 w-16 h-16 bg-stone-800 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[90]"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </main>
    </div>
  );
};

export default Layout;