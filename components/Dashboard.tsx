import React, { useState } from 'react';
import { Task, Project, User, TaskStatus, TaskAllocation, TimeType } from '../types';
import { AlertCircle, CheckCircle2, Clock, Calendar, ChevronRight, Users, Shield, ShieldAlert, Hourglass, Plus, Activity, TrendingUp, AlertOctagon, FileSignature, Timer, MousePointerClick, Zap, Target, Ban, FileSearch, Briefcase, Sun } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { convertToHours } from '../constants';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  currentUser: User;
  viewingUserId: string;
  allocations: TaskAllocation[]; 
  onSwitchUser: (userId: string) => void;
  onNavigateToTasks: (filter: { status?: TaskStatus, isOverdue?: boolean, timeType?: TimeType }) => void;
  onOpenCreate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, projects, users, currentUser, viewingUserId, allocations = [],
  onSwitchUser, onNavigateToTasks, onOpenCreate
}) => {
  const [distributionPeriod, setDistributionPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  const isManagement = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Filter data based on viewingUserId
  const userTasks = viewingUserId === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.assigneeId === viewingUserId);
    
  const viewingUserName = viewingUserId === 'ALL' 
    ? '全體人員' 
    : users.find(u => u.id === viewingUserId)?.name || '未知';

  // --- Date Calculations ---
  const now = new Date();
  const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
  const todayEnd = new Date(now.setHours(23,59,59,999)).getTime();
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Week Range
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0,0,0,0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);

  // Month Range
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // --- KPI Calculation ---
  const dueToday = userTasks.filter(t => {
    const due = new Date(t.dueAt).getTime();
    return due >= todayStart && due <= todayEnd && t.status !== 'done';
  });

  const overdue = userTasks.filter(t => {
    const due = new Date(t.dueAt).getTime();
    return due < Date.now() && t.status !== 'done';
  });

  const submittedTasks = userTasks.filter(t => t.status === 'submitted');
  
  const assignedToMe = viewingUserId !== 'ALL' 
      ? userTasks.filter(t => t.assigneeId === viewingUserId && t.creatorId !== viewingUserId && t.status !== 'done') 
      : []; 

  // Calculate Today's Workload (Hours)
  const todayLoadHours = dueToday.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);

  // --- Alert Logic ---
  const approachingTasks = userTasks.filter(t => {
    const due = new Date(t.dueAt).getTime();
    return due > Date.now() && due < (Date.now() + 24 * 60 * 60 * 1000) && t.status !== 'done';
  });

  const alertFeed = [
    ...overdue.map(t => ({ task: t, type: 'critical' as const, priority: 3 })),
    ...submittedTasks.map(t => ({ task: t, type: 'review' as const, priority: 2 })),
    ...approachingTasks.map(t => ({ task: t, type: 'warning' as const, priority: 1 })),
  ].sort((a, b) => b.priority - a.priority);

  // --- Timeline Data (Mini) ---
  const viewingUserObj = users.find(u => u.id === (viewingUserId === 'ALL' ? currentUser.id : viewingUserId)) || currentUser;
  const startHour = parseInt(viewingUserObj.workdayStart.split(':')[0]);
  const endHour = parseInt(viewingUserObj.workdayEnd.split(':')[0]);
  const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  
  const getTimelineStatus = (hour: number) => {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    // Check allocations
    const alloc = allocations.find(a => a.userId === viewingUserObj.id && a.date === todayDateStr && a.startTime === timeSlot);
    if (alloc) return { type: 'alloc', status: alloc.status, data: alloc };
    
    // Check direct daily/misc tasks
    const task = userTasks.find(t => t.scheduledSlot === timeSlot && t.status !== 'done');
    if (task) return { type: 'task', status: 'planned', data: task };

    return null;
  };

  // --- Project Heatmap Data ---
  const projectStats = projects.map(p => {
    const pTasks = userTasks.filter(t => t.projectId === p.id);
    const totalHours = pTasks.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);
    const overdueCount = pTasks.filter(t => new Date(t.dueAt).getTime() < Date.now() && t.status !== 'done').length;
    const activeCount = pTasks.filter(t => t.status !== 'done' && t.status !== 'archived').length;
    
    // Today's Heat: Tasks due today or updated today? Let's use Due Today + Overdue + Active High Priority
    const heatScore = overdueCount * 2 + activeCount;

    return { ...p, totalHours, overdueCount, activeCount, heatScore };
  }).filter(p => p.activeCount > 0 || p.overdueCount > 0)
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, 5);

  // --- Charts Data ---
  const getPeriodTasks = () => {
    switch(distributionPeriod) {
      case 'day': return userTasks.filter(t => new Date(t.dueAt).getTime() >= todayStart && new Date(t.dueAt).getTime() <= todayEnd);
      case 'week': return userTasks.filter(t => new Date(t.dueAt).getTime() >= startOfWeek.getTime() && new Date(t.dueAt).getTime() <= endOfWeek.getTime());
      case 'month': return userTasks.filter(t => new Date(t.dueAt).getTime() >= startOfMonth.getTime() && new Date(t.dueAt).getTime() <= endOfMonth.getTime());
      case 'custom': 
         if (!customRange.start || !customRange.end) return [];
         const start = new Date(customRange.start).getTime();
         const end = new Date(customRange.end).setHours(23,59,59,999);
         return userTasks.filter(t => new Date(t.dueAt).getTime() >= start && new Date(t.dueAt).getTime() <= end);
      default: return userTasks;
    }
  };

  const periodTasks = getPeriodTasks();
  const totalMiscHrs = periodTasks.filter(t => t.timeType === 'misc').reduce((acc, t) => acc + (t.timeValue/60), 0);
  const totalDailyHrs = periodTasks.filter(t => t.timeType === 'daily').reduce((acc, t) => acc + t.timeValue, 0);
  const totalLongHrs = periodTasks.filter(t => t.timeType === 'long').reduce((acc, t) => acc + (t.timeValue * 8), 0);
  const totalPeriodHours = totalMiscHrs + totalDailyHrs + totalLongHrs;

  const chartData = [
    { name: '零碎', hours: totalMiscHrs.toFixed(1), color: '#fbbf24', fullLabel: '零碎工作' }, 
    { name: '當日', hours: totalDailyHrs.toFixed(1), color: '#3b82f6', fullLabel: '當日工作' }, 
    { name: '長期', hours: totalLongHrs.toFixed(1), color: '#a855f7', fullLabel: '長期任務' }, 
  ];

  // --- Components ---

  const StatCard = ({ title, count, suffix, icon: Icon, colorClass, bgClass, onClick }: any) => (
    <div onClick={onClick} className={`bg-white p-5 rounded-[2rem] shadow-sm border border-stone-100 flex items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer hover:shadow-md h-full`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${colorClass}`}>{title}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-3xl font-bold text-stone-800">{count}</p>
          {suffix && <span className="text-sm text-stone-400 font-bold">{suffix}</span>}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgClass} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className={colorClass} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">戰情室</h1>
          <p className="text-stone-500 font-medium flex items-center gap-2">
            即時戰術概覽 - <span className="text-stone-800 font-bold">{viewingUserName}</span>
            {viewingUserId === 'ALL' && <span className="text-xs bg-stone-200 px-2 py-0.5 rounded-full">管理視角</span>}
          </p>
        </div>

        {isManagement && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-white">
              <Users size={16} />
            </div>
            <select 
              value={viewingUserId}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="bg-transparent font-bold text-stone-700 outline-none text-sm pr-2 cursor-pointer min-w-[120px]"
            >
              <option value="ALL">❖ 全體人員</option>
              <option disabled>──────────</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} {u.id === currentUser.id ? '(我)' : ''}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* 1. MVP KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="今日工時" 
          count={todayLoadHours.toFixed(1)} 
          suffix="hr"
          icon={Hourglass} colorClass="text-blue-500" bgClass="bg-blue-50" 
          onClick={() => onNavigateToTasks({})} 
        />
        <StatCard 
          title="今日到期" 
          count={dueToday.length} 
          icon={Calendar} colorClass="text-orange-500" bgClass="bg-orange-50" 
          onClick={() => onNavigateToTasks({})} 
        />
        <StatCard 
          title="已逾期" 
          count={overdue.length} 
          icon={AlertOctagon} colorClass="text-red-500" bgClass="bg-red-50" 
          onClick={() => onNavigateToTasks({ isOverdue: true })}
        />
        <StatCard 
          title={viewingUserId === 'ALL' ? "全體送審" : "待我完成"} 
          count={viewingUserId === 'ALL' ? submittedTasks.length : assignedToMe.length}
          icon={viewingUserId === 'ALL' ? FileSignature : Users} 
          colorClass="text-violet-500" bgClass="bg-violet-50" 
          onClick={() => onNavigateToTasks(viewingUserId === 'ALL' ? { status: 'submitted' } : {})}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Timeline & Charts */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* 2. Today's Timeline Preview */}
           <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <Clock size={20} className="text-amber-500" /> 今日時間軸
                </h3>
                <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-lg font-bold">
                   {viewingUserObj.workdayStart} - {viewingUserObj.workdayEnd}
                </span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {timelineHours.map(hour => {
                  const item = getTimelineStatus(hour);
                  return (
                    <div key={hour} className="flex-1 min-w-[60px] flex flex-col gap-2">
                       <span className="text-xs font-mono text-stone-400 text-center">{hour}:00</span>
                       <div className={`h-16 rounded-xl border flex items-center justify-center relative group transition-all ${
                         !item ? 'bg-stone-50 border-stone-100 border-dashed' :
                         item.status === 'running' ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-200' :
                         item.status === 'done' ? 'bg-emerald-100 border-emerald-200 opacity-60' :
                         'bg-white border-stone-200 shadow-sm'
                       }`}>
                         {item && (
                           <>
                             {item.type === 'alloc' ? <Zap size={16} className="text-stone-600"/> : <Target size={16} className="text-stone-600"/>}
                             <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-stone-800 text-white text-xs p-2 rounded-lg whitespace-nowrap shadow-xl z-20 pointer-events-none">
                               <p className="font-bold">
                                 {item.type === 'task' 
                                   ? (item.data as Task).title 
                                   : (tasks.find(t => t.id === (item.data as TaskAllocation).taskId)?.title)}
                               </p>
                               <p className="opacity-80 capitalize">{item.status}</p>
                             </div>
                           </>
                         )}
                       </div>
                    </div>
                  )
                })}
              </div>
           </div>

           {/* 3. Time Distribution Chart */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
               <div>
                  <h3 className="text-lg font-bold text-stone-800">工時分布指標</h3>
                  <p className="text-xs text-stone-400 font-medium mt-1">
                    總計: <span className="text-stone-800 font-bold">{totalPeriodHours.toFixed(1)}</span> 小時
                  </p>
               </div>
               <div className="flex flex-col gap-2">
                  <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                      {(['day', 'week', 'month', 'custom'] as const).map(p => (
                        <button
                          key={p} onClick={() => setDistributionPeriod(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${distributionPeriod === p ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                          {p === 'day' ? '今日' : p === 'week' ? '本週' : p === 'month' ? '本月' : '自訂'}
                        </button>
                      ))}
                  </div>
                  {distributionPeriod === 'custom' && (
                    <div className="flex gap-2 items-center bg-stone-50 p-2 rounded-lg border border-stone-100 animate-in fade-in slide-in-from-top-1">
                       <input 
                         type="date" 
                         value={customRange.start} 
                         onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                         className="bg-white border border-stone-200 rounded px-2 py-1 text-xs outline-none" 
                       />
                       <span className="text-stone-400 text-xs">-</span>
                       <input 
                         type="date" 
                         value={customRange.end} 
                         onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                         className="bg-white border border-stone-200 rounded px-2 py-1 text-xs outline-none" 
                       />
                    </div>
                  )}
               </div>
             </div>
             
             {/* Chart Clickable Legend/Metric */}
             <div className="flex gap-4 mb-6 flex-wrap">
                <button onClick={() => onNavigateToTasks({ timeType: 'misc' })} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl flex-1 min-w-[120px] hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                     <Zap size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-xs text-stone-400 font-bold uppercase group-hover:text-amber-500">零碎工作</p>
                      <p className="text-lg font-bold text-stone-800">{totalMiscHrs.toFixed(1)}h</p>
                   </div>
                </button>
                <button onClick={() => onNavigateToTasks({ timeType: 'daily' })} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl flex-1 min-w-[120px] hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                     <Sun size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-xs text-stone-400 font-bold uppercase group-hover:text-blue-500">當日工作</p>
                      <p className="text-lg font-bold text-stone-800">{totalDailyHrs.toFixed(1)}h</p>
                   </div>
                </button>
                <button onClick={() => onNavigateToTasks({ timeType: 'long' })} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl flex-1 min-w-[120px] hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                     <Briefcase size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-xs text-stone-400 font-bold uppercase group-hover:text-purple-500">長期任務</p>
                      <p className="text-lg font-bold text-stone-800">{totalLongHrs.toFixed(1)}h</p>
                   </div>
                </button>
             </div>

             <div className="h-40">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" barSize={24} margin={{ left: 0, right: 20 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={40} axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 600}} />
                   <Tooltip cursor={{fill: '#fafaf9', radius: 8}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="hours" radius={[0, 10, 10, 0]}>
                     {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>

        {/* Right Column: Alert & Projects */}
        <div className="space-y-6 h-full flex flex-col">
          
          {/* 4. Alert Center */}
          <div className="bg-stone-900 text-stone-50 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col min-h-[300px]">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-stone-800 rounded-full opacity-50 blur-2xl"></div>
            <h3 className="text-lg font-bold mb-4 relative z-10 flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={20} /> 指揮中心警示
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 relative z-10 space-y-3 custom-scrollbar">
              {alertFeed.length > 0 ? (
                 alertFeed.map(({ task, type }, idx) => {
                   let icon = Ban; // Default for Critical
                   let color = 'text-red-400';
                   let label = '阻塞/逾期';
                   let timeInfo = `逾期 ${Math.floor((Date.now() - new Date(task.dueAt).getTime()) / (1000 * 60 * 60))}h`;

                   if (type === 'review') {
                      icon = FileSearch;
                      color = 'text-violet-400';
                      label = '待審核';
                      timeInfo = `提交於: ${new Date(task.submission?.submittedAt || '').toLocaleDateString()}`;
                   } else if (type === 'warning') {
                      icon = Hourglass;
                      color = 'text-amber-400';
                      label = '即將到期';
                      timeInfo = `剩 ${Math.ceil((new Date(task.dueAt).getTime() - Date.now()) / (1000 * 60 * 60))}h`;
                   }

                   return (
                     <div 
                       key={`${task.id}-${idx}`} 
                       onClick={() => onNavigateToTasks({ isOverdue: type === 'critical', status: type === 'review' ? 'submitted' : undefined })}
                       className="flex items-start gap-3 bg-stone-800/50 p-3 rounded-2xl border border-stone-700/50 backdrop-blur-sm cursor-pointer hover:bg-stone-700/50 transition-colors group"
                     >
                       <div className={`mt-0.5 p-1.5 rounded-lg ${color.replace('text-', 'bg-').replace('400', '500')}/10`}>
                          {React.createElement(icon, { size: 16, className: color })}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-0.5">
                            <span className={`text-[10px] font-bold ${color}`}>{label}</span>
                         </div>
                         <p className="text-sm font-bold text-stone-200 line-clamp-1">{task.title}</p>
                         <p className="text-[10px] text-stone-500 font-mono">{timeInfo}</p>
                       </div>
                     </div>
                   );
                 })
              ) : (
                <div className="text-center py-12 text-stone-600 flex flex-col items-center justify-center h-full">
                  <CheckCircle2 size={32} className="mb-2 opacity-20 text-emerald-500" />
                  <p className="text-sm font-medium text-stone-400">系統運作正常</p>
                </div>
              )}
            </div>
          </div>

          {/* 5. Project Heatmap (Top Projects) */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 flex-1">
             <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
               <Activity className="text-orange-500" size={20} /> 焦點專案
             </h3>
             <div className="space-y-3">
               {projectStats.length > 0 ? projectStats.map(p => (
                 <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-bold text-stone-700 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-stone-400">{p.activeCount} 個進行中</p>
                    </div>
                    <div className="text-right">
                       {p.overdueCount > 0 && (
                         <span className="block text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded mb-1">
                           {p.overdueCount} 逾期
                         </span>
                       )}
                       <span className="block text-xs font-mono font-bold text-stone-600">
                         {p.totalHours.toFixed(1)}h
                       </span>
                    </div>
                 </div>
               )) : (
                 <div className="text-center py-8 text-stone-400 text-xs">暫無熱點專案</div>
               )}
             </div>
          </div>

        </div>
      </div>

      {/* Floating Create Button */}
      <button 
        onClick={onOpenCreate}
        className="fixed bottom-8 right-8 w-16 h-16 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50 group"
      >
        <Plus size={32} />
        <span className="absolute right-full mr-4 bg-stone-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
          新建任務
        </span>
      </button>
    </div>
  );
};

export default Dashboard;