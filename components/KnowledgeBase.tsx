import React, { useState } from 'react';
import { Task, GoalCategory, TimeType, ViewMode, User } from '../types';
import { Search, Archive, FileText, Calendar, FolderOpen, LayoutGrid, List, Folder, Filter, User as UserIcon, Clock, Star } from 'lucide-react';
import { INITIAL_GOALS, VIEW_MODES } from '../constants';

interface KnowledgeBaseProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ tasks, users, onSelectTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [filterGoal, setFilterGoal] = useState<GoalCategory | 'all'>('all');
  const [filterTimeType, setFilterTimeType] = useState<TimeType | 'all'>('all');
  
  // Filter only completed tasks
  const completedTasks = tasks.filter(t => t.status === 'done');
  
  const filtered = completedTasks.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      t.title.toLowerCase().includes(searchLower) || 
      t.description.toLowerCase().includes(searchLower) ||
      t.goal.includes(searchTerm) ||
      (t.submission?.problemSolved && t.submission.problemSolved.toLowerCase().includes(searchLower)); // Include Problem Solved field
    
    const matchesGoal = filterGoal === 'all' || t.goal === filterGoal;
    const matchesTime = filterTimeType === 'all' || t.timeType === filterTimeType;
    
    return matchesSearch && matchesGoal && matchesTime;
  });

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || '未知';
  };

  const renderStars = (count: number) => (
    <div className="flex text-amber-400">
      {Array.from({length: 5}).map((_, i) => (
        <Star key={i} size={12} fill={i < count ? "currentColor" : "none"} strokeWidth={i < count ? 0 : 2} className={i < count ? "" : "text-stone-300"}/>
      ))}
    </div>
  );

  // --- RENDERERS ---

  const renderCard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map(task => (
        <div 
          key={task.id} 
          onClick={() => onSelectTask(task)}
          className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col group cursor-pointer"
        >
           <div className="flex justify-between items-start mb-4">
             <span className="bg-stone-50 text-stone-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-stone-100">{task.goal}</span>
             {task.submission?.rating ? renderStars(task.submission.rating) : <div className="h-4"></div>}
           </div>
           
           <h3 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-emerald-600 transition-colors">{task.title}</h3>
           <p className="text-stone-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
             {task.submission?.problemSolved ? (
               <span className="text-stone-600 italic">"解決: {task.submission.problemSolved}"</span>
             ) : (
               task.description || '無描述內容。'
             )}
           </p>
           
           <div className="mt-auto pt-5 border-t border-stone-50 flex justify-between items-center text-xs font-medium text-stone-400">
              <div className="flex items-center gap-2">
                <UserIcon size={14} />
                {getUserName(task.creatorId)}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {new Date(task.updatedAt).toLocaleDateString('zh-TW')}
              </div>
           </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden p-2">
      <table className="w-full text-left border-collapse">
        <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold tracking-wider">
          <tr>
            <th className="p-5 w-40">目標分類</th>
            <th className="p-5">知識主題 / 解決問題</th>
            <th className="p-5 w-32">評分</th>
            <th className="p-5 w-40">建立人</th>
            <th className="p-5 w-40">結案日期</th>
            <th className="p-5 w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {filtered.map(task => (
            <tr 
              key={task.id} 
              onClick={() => onSelectTask(task)}
              className="hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <td className="p-5">
                <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-bold">{task.goal}</span>
              </td>
              <td className="p-5">
                <div className="font-bold text-stone-800">{task.title}</div>
                {task.submission?.problemSolved && (
                  <div className="text-xs text-stone-500 mt-1 italic line-clamp-1">解: {task.submission.problemSolved}</div>
                )}
              </td>
              <td className="p-5">
                 {task.submission?.rating && renderStars(task.submission.rating)}
              </td>
              <td className="p-5 text-sm text-stone-600">{getUserName(task.creatorId)}</td>
              <td className="p-5 text-xs font-mono text-stone-400">{new Date(task.updatedAt).toLocaleDateString('zh-TW')}</td>
              <td className="p-5 text-right">
                <button className="text-stone-300 hover:text-stone-600"><FileText size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGroup = () => {
    // Group by Goal
    const grouped: Record<string, Task[]> = {};
    INITIAL_GOALS.forEach(g => grouped[g] = []);
    filtered.forEach(t => {
      if (!grouped[t.goal]) grouped[t.goal] = [];
      grouped[t.goal].push(t);
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(grouped).map(([goal, tasks]) => {
          if (tasks.length === 0) return null;
          return (
            <div key={goal} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-stone-800">{goal}</h3>
                 <span className="bg-stone-100 text-stone-500 px-3 py-1 rounded-full text-xs font-bold">{tasks.length}</span>
               </div>
               
               <div className="flex-1 space-y-3">
                 {tasks.slice(0, 5).map(task => (
                   <div 
                     key={task.id} 
                     onClick={() => onSelectTask(task)}
                     className="p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                   >
                      <div className="flex justify-between mb-1">
                        <div className="font-bold text-stone-700 text-sm">{task.title}</div>
                        {task.submission?.rating && (
                          <div className="flex text-amber-400">
                            <Star size={10} fill="currentColor" />
                            <span className="text-[10px] ml-1 text-stone-500">{task.submission.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs text-stone-400">
                         <span>{getUserName(task.creatorId)}</span>
                         <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                      </div>
                   </div>
                 ))}
                 {tasks.length > 5 && (
                   <button className="w-full py-2 text-xs font-bold text-stone-400 hover:text-stone-600">
                     查看更多 ({tasks.length - 5})
                   </button>
                 )}
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">知識庫</h1>
          <p className="text-stone-500 font-medium">已結案任務存檔與知識沉澱</p>
        </div>
        
        {/* View Switcher */}
        <div className="flex items-center bg-stone-200 p-1 rounded-xl">
           {[
             { id: 'card', icon: LayoutGrid },
             { id: 'list', icon: List },
             { id: 'group', icon: Folder },
           ].map(v => (
             <button 
               key={v.id}
               onClick={() => setViewMode(v.id as ViewMode)}
               className={`p-2 rounded-lg transition-all ${viewMode === v.id ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
             >
               <v.icon size={20} />
             </button>
           ))}
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-stone-100">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋知識、解決方案..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <select 
            value={filterGoal} 
            onChange={(e) => setFilterGoal(e.target.value as any)}
            className="px-4 py-3 rounded-xl bg-stone-50 border-transparent font-medium text-stone-600 text-sm focus:ring-2 focus:ring-emerald-100 outline-none"
          >
            <option value="all">所有目標</option>
            {INITIAL_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select 
            value={filterTimeType} 
            onChange={(e) => setFilterTimeType(e.target.value as any)}
            className="px-4 py-3 rounded-xl bg-stone-50 border-transparent font-medium text-stone-600 text-sm focus:ring-2 focus:ring-emerald-100 outline-none"
          >
            <option value="all">所有類型</option>
            <option value="misc">零碎工作</option>
            <option value="daily">當日工作</option>
            <option value="long">長期任務</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          {viewMode === 'card' && renderCard()}
          {viewMode === 'list' && renderList()}
          {viewMode === 'group' && renderGroup()}
        </>
      ) : (
        <div className="py-20 text-center">
           <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
             <Archive size={48} />
           </div>
           <p className="text-stone-400 font-medium">找不到符合的存檔資料</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;