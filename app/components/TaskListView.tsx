

import React, { useState } from 'react';
import { 
  Filter, Search, Clock, ListTodo, Flame, Crown, CheckCircle2, Circle, ChevronRight, User as UserIcon, Briefcase, Zap, Sun
} from 'lucide-react';
import { Task, User, GoalCategory, TimeType } from '~/types';
import { INITIAL_GOALS } from '~/constants';
import { QUADRANTS, getQuadrant } from '~/components/PersonalDashboard';

interface TaskListViewProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({ 
    tasks = [], 
    users = [],
    onSelectTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<GoalCategory | 'all'>('all');
  const [selectedEmp, setSelectedEmp] = useState('all');
  const [selectedQuad, setSelectedQuad] = useState('all');

  // Filter Logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const goalMatch = selectedGoal === 'all' || t.goal === selectedGoal;
    const empMatch = selectedEmp === 'all' || t.assignedToId === selectedEmp;
    const quadMatch = selectedQuad === 'all' || getQuadrant(t.goal).toString() === selectedQuad;
    return matchesSearch && goalMatch && empMatch && quadMatch;
  });

  const getVisualConfig = (quadrant: number) => {
     switch(quadrant) {
         case 1: return {
             container: "p-8 border-l-[8px] border-red-500 bg-red-50/40 shadow-xl ring-1 ring-red-100 relative overflow-hidden",
             titleSize: "text-xl font-black text-stone-900",
             iconSize: 24,
             badge: "bg-red-500 text-white px-4 py-1 text-[10px] font-black shadow-md uppercase tracking-wider",
             layout: "flex-col md:flex-row gap-6"
         };
         case 2: return {
             container: "p-6 border-l-[6px] border-blue-500 bg-white shadow-sm hover:shadow-lg transition-all",
             titleSize: "text-lg font-bold text-stone-800",
             iconSize: 20,
             badge: "bg-blue-50 text-blue-600 px-3 py-1 text-[10px] font-bold border border-blue-100",
             layout: "flex-col md:flex-row gap-4"
         };
         default: return { 
             container: "p-4 border-l-[3px] border-stone-300 bg-stone-50/50 hover:bg-white transition-all",
             titleSize: "text-sm font-bold text-stone-700",
             iconSize: 16,
             badge: "bg-white text-stone-400 px-2.5 py-1 text-[9px] font-bold border border-stone-100",
             layout: "flex-col md:flex-row gap-3 items-start md:items-center"
         };
     }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-stone-800 flex items-center gap-3">
            <ListTodo className="text-amber-500" size={32}/> 任務清單詳閱
          </h2>
          <p className="text-stone-500 font-medium mt-1 uppercase tracking-widest text-xs">全方位任務視覺化層級檢視</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-xl mb-8 flex flex-wrap gap-4 items-center sticky top-4 z-20 backdrop-blur-xl bg-white/80">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="搜尋標題或關鍵字..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-all font-medium text-sm"
          />
        </div>
        
        <select 
          className="bg-stone-50 border border-transparent text-stone-700 text-sm font-bold rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none cursor-pointer"
          value={selectedGoal}
          onChange={(e) => setSelectedGoal(e.target.value as any)}
        >
          <option value="all">所有目標</option>
          {INITIAL_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select 
          className="bg-stone-50 border border-transparent text-stone-700 text-sm font-bold rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none cursor-pointer"
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        >
          <option value="all">所有人員</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <div className="h-8 w-px bg-stone-200 mx-2 hidden md:block"></div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setSelectedQuad('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${selectedQuad === 'all' ? 'bg-stone-800 text-white shadow-lg' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
          >全部</button>
          {[1,2,3,4].map(qId => (
            <button 
              key={qId}
              onClick={() => setSelectedQuad(qId.toString())}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 border-2 ${selectedQuad === qId.toString() ? `bg-white shadow-md text-stone-800` : 'bg-stone-50 border-transparent text-stone-400 hover:bg-white hover:border-stone-200'}`}
              style={selectedQuad === qId.toString() ? {borderColor: QUADRANTS[qId].color} : {}}
            >
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: QUADRANTS[qId].color}}></div>
              {QUADRANTS[qId].title}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Hierarchy List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.sort((a,b) => getQuadrant(a.goal) - getQuadrant(b.goal)).map(task => {
            const quad = getQuadrant(task.goal);
            const config = QUADRANTS[quad];
            const visual = getVisualConfig(quad);
            const user = users.find(u => u.id === task.assignedToId);
            
            return (
              <div 
                key={task.id} 
                onClick={() => onSelectTask(task)}
                className={`rounded-[2rem] transition-all group relative cursor-pointer ${visual.container}`}
              >
                 {/* Decorative Red Background for L1 */}
                 {quad === 1 && (
                   <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
                 )}

                 {/* Top Right Priority Badge */}
                 {(task.priority === 'high' || new Date(task.dueAt).getTime() < Date.now()) && task.status !== 'done' && (
                     <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-4 py-1.5 rounded-bl-[1.5rem] font-black shadow-lg flex items-center gap-2 z-10 uppercase tracking-[0.2em]">
                        <Flame size={12} fill="currentColor"/> Urgent
                     </div>
                 )}

                 <div className={`flex ${visual.layout} justify-between items-start md:items-center relative z-10`}>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`rounded-lg font-black flex items-center gap-2 ${visual.badge}`}>
                                {React.createElement(config.icon, {size: 14, fill: "currentColor"})}
                                {config.title}
                            </span>
                            <span className="text-[10px] font-bold text-stone-400 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-stone-100 shadow-sm uppercase tracking-wider">
                                {task.goal}
                            </span>
                        </div>
                        <h3 className={`${visual.titleSize} leading-tight mb-2 group-hover:text-amber-600 transition-colors`}>{task.title}</h3>
                        <p className="text-stone-400 text-xs font-medium line-clamp-1 max-w-2xl">
                          {task.description || '任務說明暫無...'}
                        </p>
                    </div>

                    <div className="flex items-center gap-6 mt-4 md:mt-0 flex-shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-stone-100 pt-4 md:pt-0">
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-stone-300 uppercase tracking-widest mb-0.5">負責人</span>
                                <span className="text-xs font-bold text-stone-700">{user?.name}</span>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-stone-50 flex items-center justify-center text-xs font-black text-stone-500 shadow-sm group-hover:scale-110 transition-transform">
                                {user?.name.charAt(0) || '?'}
                            </div>
                        </div>

                        <div className="h-10 w-px bg-stone-100 hidden md:block"></div>

                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">類型</span>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                            task.timeType === 'long' ? 'bg-purple-500' : task.timeType === 'daily' ? 'bg-blue-500' : 'bg-emerald-500'
                          }`}>
                            {task.timeType === 'long' ? <Briefcase size={16}/> : task.timeType === 'daily' ? <Sun size={16}/> : <Zap size={16}/>}
                          </div>
                        </div>

                        <button className="p-3 bg-stone-50 text-stone-300 group-hover:bg-amber-500 group-hover:text-white rounded-2xl transition-all shadow-sm">
                            <ChevronRight size={20}/>
                        </button>
                    </div>
                 </div>
              </div>
            );
          })
        ) : (
          <div className="py-32 text-center text-stone-300 bg-white rounded-[3rem] border-2 border-dashed border-stone-100 shadow-sm flex flex-col items-center">
            <Search size={64} className="mb-6 opacity-10"/>
            <p className="font-black text-sm uppercase tracking-[0.3em] mb-2">未尋獲匹配任務</p>
            <p className="text-xs font-medium text-stone-400">請嘗試調整篩選條件或重新輸入關鍵字</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskListView;
