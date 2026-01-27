import React, { useState, useRef, useEffect } from 'react';
import { Task, Project, ViewMode, TaskStatus, User } from '~/types';
import { 
  Calendar, Zap, Target, CheckSquare, 
  FileText, Sun, Briefcase, Plus, 
  ChevronRight, FolderKanban,
  CheckCircle2, ListChecks, Trash2, X, Check, Edit3, Settings2,
  Table as TableIcon, LayoutGrid, Info, ArrowUpRight, Search,
  Clock, User as UserIcon
} from 'lucide-react';
import { convertToHours } from '~/constants';

interface TaskViewsProps {
  mode: 'daily' | 'project';
  tasks: Task[];
  projects: Project[];
  users: User[];
  viewMode: ViewMode;
  searchTerm?: string; 
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectProject: (id: string | null) => void;
  onDeleteProject?: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onCreateProject?: (name: string) => void;
  onOpenCreateProject?: () => void; 
  selectedProjectId: string | null;
}

const TaskViews: React.FC<TaskViewsProps> = ({ 
  mode, tasks, projects, users, viewMode, searchTerm = '',
  onUpdateTask, onSelectProject, onDeleteProject, onSelectTask, onCreateProject,
  onOpenCreateProject,
  selectedProjectId
}) => {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'misc': return { icon: Zap, bg: 'bg-emerald-50', text: 'text-emerald-700', label: '雜事', accent: 'text-emerald-500' };
      case 'daily': return { icon: Sun, bg: 'bg-blue-50', text: 'text-blue-700', label: '今日事', accent: 'text-blue-500' };
      case 'long': return { icon: FolderKanban, bg: 'bg-purple-50', text: 'text-purple-700', label: '任務', accent: 'text-purple-500' };
      default: return { icon: FileText, bg: 'bg-stone-50', text: 'text-stone-700', label: '一般', accent: 'text-stone-500' };
    }
  };

  const renderFilters = () => (
    <div className="flex bg-stone-100/50 p-1 rounded-xl w-fit">
      {['all', 'todo', 'doing', 'done'].map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status as any)}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${
            filter === status 
              ? 'bg-stone-800 text-white shadow-md' 
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {status === 'all' ? '全部' : status === 'todo' ? '待辦' : status === 'doing' ? '執行中' : '已完成'}
        </button>
      ))}
    </div>
  );

  const renderProjectTable = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
            <FolderKanban size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight italic">專案戰略呈報表</h1>
            <p className="text-stone-400 text-[11px] font-black uppercase tracking-[0.3em] mt-1 italic">Strategic Asset Distribution Table</p>
          </div>
        </div>
        
        <button 
          onClick={onOpenCreateProject}
          className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-sm tracking-widest shadow-2xl hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-3"
        >
          <Plus size={20} strokeWidth={3} /> 新建戰略專案
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-stone-100 shadow-xl overflow-hidden min-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/50 border-b border-stone-100">
              <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-24">狀態</th>
              <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-40">專案編號</th>
              <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">專案名稱</th>
              <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-[30%]">策略描述</th>
              <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-center">單元數</th>
              <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">預估總工時</th>
              <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {projects.map(project => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const totalHours = projectTasks.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);
              const pjtId = `PJT-${project.id.split('-').pop()?.substring(0, 4).toUpperCase()}`;
              const isAllDone = projectTasks.length > 0 && projectTasks.every(t => t.status === 'done');

              return (
                <tr 
                  key={project.id} 
                  onClick={() => onSelectProject(project.id)}
                  className="group hover:bg-stone-50/80 cursor-pointer transition-all"
                >
                  <td className="px-10 py-8">
                    <div className={`w-3 h-3 rounded-full ${isAllDone ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-orange-500 animate-pulse'}`}></div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="font-mono font-bold text-stone-400 text-xs tracking-tighter">
                      {pjtId}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <h3 className="font-black text-stone-800 text-lg group-hover:text-orange-600 transition-colors">
                      {project.name}
                    </h3>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-stone-400 text-xs font-medium line-clamp-2 leading-relaxed italic">
                      {project.description || '該專案戰略規劃尚未細節化描述...'}
                    </p>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="text-xl font-mono font-black text-stone-800">
                      {projectTasks.length}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex flex-col items-end">
                       <span className="text-xl font-mono font-black text-stone-800">{totalHours.toFixed(1)}</span>
                       <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Hours</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center gap-4 justify-end">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if(confirm(`確定要刪除專案「${project.name}」嗎？`)) onDeleteProject?.(project.id);
                        }}
                        className="p-3 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                      <ArrowUpRight size={20} className="text-stone-200 group-hover:text-stone-800 transition-all" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTaskTable = () => {
    const displayTasks = mode === 'daily' 
      ? tasks.filter(t => !t.projectId && (filter === 'all' || t.status === filter))
      : tasks.filter(t => t.projectId === selectedProjectId && (filter === 'all' || t.status === filter));

    const currentProject = projects.find(p => p.id === selectedProjectId);
    const totalHours = displayTasks.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            {mode === 'project' ? (
              <button 
                onClick={() => onSelectProject(null)}
                className="w-14 h-14 bg-white text-stone-400 border border-stone-100 rounded-2xl flex items-center justify-center hover:text-stone-900 hover:border-stone-300 transition-all shadow-sm active:scale-90"
              >
                <ChevronRight size={28} className="rotate-180" />
              </button>
            ) : (
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                <CheckSquare size={28} />
              </div>
            )}
            <div>
              <h2 className="text-4xl font-black text-stone-900 tracking-tight italic">
                {mode === 'daily' ? '日常戰術執行表' : currentProject?.name}
              </h2>
              <p className="text-stone-400 text-[11px] font-black uppercase tracking-[0.3em] mt-1 italic">
                {mode === 'daily' ? 'Independent Tactical Units' : 'Tactical Execution Report'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white px-8 py-5 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-5">
              <div className="text-right">
                  <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest leading-none">執行單元</p>
                  <p className="text-3xl font-mono font-black text-stone-900 leading-none mt-2">{displayTasks.length}</p>
              </div>
              <div className="w-px h-10 bg-stone-100 mx-1"></div>
              <div className="text-right">
                  <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest leading-none">累計工時</p>
                  <p className="text-3xl font-mono font-black text-stone-900 leading-none mt-2">{totalHours.toFixed(1)}</p>
              </div>
            </div>
            {mode === 'project' && (
              <button 
                onClick={() => alert("請點擊右下角「＋」號並在第三步選擇此專案，即可新增關聯單元。")}
                className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-orange-600 transition-all active:scale-95"
              >
                <Plus size={32} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center bg-white p-3 px-6 rounded-[2.5rem] border border-stone-100 shadow-sm">
           {renderFilters()}
           <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
              <input 
                placeholder="搜尋戰術標題..." 
                className="pl-10 pr-4 py-2 bg-stone-50 border-none rounded-xl text-xs font-bold text-stone-600 w-64 outline-none focus:ring-2 focus:ring-orange-50 transition-all"
              />
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-stone-100 shadow-xl overflow-hidden min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-20">狀態</th>
                <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-32">維度類型</th>
                <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">戰術標題</th>
                <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-[25%]">執行細節</th>
                <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-32">截止日期</th>
                <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] w-32">負責人員</th>
                <th className="px-10 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {displayTasks.map(task => {
                const typeConfig = getTypeConfig(task.timeType);
                const TypeIcon = typeConfig.icon;
                // 優先顯示 assignments 中的被指派者，若無則使用 assigneeId
                const assignees = (task as any).assignments?.map((a: any) => a.assignee).filter(Boolean) || [];
                const user = assignees.length > 0 ? assignees[0] : users.find(u => u.id === task.assigneeId);
                const hasMultipleAssignees = assignees.length > 1;
                const isDone = task.status === 'done';

                return (
                  <tr 
                    key={task.id} 
                    onClick={() => onSelectTask(task)}
                    className="group hover:bg-stone-50/80 cursor-pointer transition-all"
                  >
                    <td className="px-10 py-7">
                      <div className={`w-3 h-3 rounded-full ${isDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-stone-200 group-hover:bg-orange-400 transition-colors'}`}></div>
                    </td>
                    <td className="px-10 py-7">
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${typeConfig.accent}`}>
                        <TypeIcon size={14} />
                        {task.timeValue}{task.timeType === 'misc' ? 'm' : task.timeType === 'daily' ? 'h' : 'd'}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <h3 className="font-black text-stone-800 text-base group-hover:text-orange-600 transition-colors leading-tight">
                        {task.title}
                      </h3>
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-stone-400 text-[11px] font-medium line-clamp-1 italic leading-relaxed">
                        {task.description || '該單元執行細項尚未詳細定義...'}
                      </p>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-stone-400">
                        <Calendar size={12} />
                        {new Date(task.dueAt).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all">
                          {user?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[11px] font-bold text-stone-600">
                          {user?.name || '未指派'}
                          {hasMultipleAssignees && ` +${assignees.length - 1}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <Settings2 size={16} className="text-stone-200 group-hover:text-stone-800 transition-all inline-block" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayTasks.length === 0 && (
            <div className="py-40 text-center flex flex-col items-center justify-center animate-pulse">
              <div className="w-24 h-24 bg-stone-50 rounded-3xl flex items-center justify-center text-stone-200 mb-6">
                <FileText size={48} />
              </div>
              <p className="text-stone-300 font-black text-sm uppercase tracking-[0.4em]">此戰術區塊尚無同步單元</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      {mode === 'project' && !selectedProjectId ? renderProjectTable() : renderTaskTable()}
    </div>
  );
};

export default TaskViews;