import React from 'react';
import { NavTab, User } from '../types';
import { LayoutDashboard, CheckSquare, FolderKanban, BookOpen, Settings, Plus, CalendarClock } from 'lucide-react';

interface LayoutProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenCreate: () => void;
  children: React.ReactNode;
  currentUser?: User; // Pass current user to check role
}

const Layout: React.FC<LayoutProps> = ({ currentTab, onNavigate, onOpenCreate, children, currentUser }) => {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '戰情室' },
    // 'create' is usually a modal, but we keep the ID for the main flow if needed, 
    // though the button below handles the modal. 
    // We will treat "Create" as a modal action, not a main tab, but listed in structure.
    { id: 'daily', icon: CheckSquare, label: '日常任務' },
    { id: 'projects', icon: FolderKanban, label: '專案任務' },
    { id: 'timeline', icon: CalendarClock, label: '時間分配' },
    { id: 'knowledge', icon: BookOpen, label: '知識庫' },
    { id: 'admin', icon: Settings, label: '管理中心', requiredRole: 'admin' }, // Only admins
  ];

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-xl font-bold text-stone-50 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-stone-900 font-bold">C</div>
            CHRONOS
          </h1>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest">任務大師</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="mb-4">
             <button 
                onClick={onOpenCreate}
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus size={20} /> 新建任務
              </button>
          </div>

          {navItems.map(item => {
            if (item.requiredRole === 'admin' && currentUser?.role !== 'admin') {
              return null;
            }
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as NavTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentTab === item.id 
                    ? 'bg-stone-800 text-amber-500 shadow-lg shadow-stone-900/50 translate-x-1' 
                    : 'hover:bg-stone-800 hover:text-stone-100'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-800 text-xs text-stone-500 text-center">
           v2.1.0 Enterprise Edition
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-7xl mx-auto p-8">
           {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
