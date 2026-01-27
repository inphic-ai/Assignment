
import React, { useState } from 'react';
import { Task, Project, User, TaskStatus, TaskAllocation, TimeType, GoalCategory } from '~/types';
import { 
  AlertCircle, CheckCircle2, Clock, Calendar, ChevronRight, Users, Shield, 
  ShieldAlert, Hourglass, Plus, Activity, TrendingUp, AlertOctagon, 
  FileSignature, Timer, MousePointerClick, Zap, Target, Ban, 
  FileSearch, Briefcase, Sun, Coffee, MessageCircle, HelpCircle, 
  RotateCcw, Flame
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { convertToHours, INITIAL_GOALS } from '~/constants';

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

const InquiryStatsTable = ({ tasks, viewingUserId }: { tasks: Task[], viewingUserId: string }) => {
  const userTasks = viewingUserId === 'ALL' ? tasks : tasks.filter(t => t.assigneeId === viewingUserId);
  
  const statsByGoal = INITIAL_GOALS.map(goal => {
    const goalTasks = userTasks.filter(t => t.goal === goal);
    const infoRequests = goalTasks.filter(t => !!t.pendingInfoRequest).length;
    const rejections = goalTasks.filter(t => !!t.rejectionReason).length;
    const submitted = goalTasks.filter(t => t.status === 'submitted').length;
    const total = infoRequests + rejections + submitted;
    
    return {
      goal,
      infoRequests,
      rejections,
      submitted,
      total
    };
  }).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex-1">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-stone-800 flex items-center gap-2">
          <MessageCircle size={22} className="text-amber-500" /> 詢問數量統計表
        </h3>
        <span className="text-[10px] font-black bg-stone-100 text-stone-400 px-3 py-1 rounded-full uppercase tracking-widest">
          跨資源數據聚合
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-stone-300 uppercase tracking-widest border-b border-stone-50">
              <th className="pb-4 font-black">目標分類</th>
              <th className="pb-4 font-black text-center">主管提問</th>
              <th className="pb-4 font-black text-center">駁回修正</th>
              <th className="pb-4 font-black text-center">送審待應</th>
              <th className="pb-4 font-black text-right">熱度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {statsByGoal.length > 0 ? statsByGoal.map((row, idx) => (
              <tr key={idx} className="group hover:bg-stone-50/50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-stone-200 group-hover:bg-amber-400 transition-colors"></div>
                    <span className="text-sm font-bold text-stone-700">{row.goal}</span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className={`text-xs font-black ${row.infoRequests > 0 ? 'text-amber-500' : 'text-stone-300'}`}>
                    {row.infoRequests}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className={`text-xs font-black ${row.rejections > 0 ? 'text-red-500' : 'text-stone-300'}`}>
                    {row.rejections}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className={`text-xs font-black ${row.submitted > 0 ? 'text-blue-500' : 'text-stone-300'}`}>
                    {row.submitted}
                  </span>
                </td>
                <td className="py-4 text-right">
                   <div className="flex items-center justify-end gap-1">
                      {row.total > 3 && <Flame size={12} className="text-orange-500 animate-pulse" />}
                      <span className="text-xs font-black text-stone-800">{row.total}</span>
                   </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-stone-300 font-bold text-xs uppercase tracking-widest">
                  目前無活動中的詢問數據
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, projects, users, currentUser, viewingUserId, allocations = [],
  onSwitchUser, onNavigateToTasks, onOpenCreate
}) => {
  const [distributionPeriod, setDistributionPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  const isManagement = currentUser.role === 'admin' || currentUser.role === 'manager';

  const userTasks = viewingUserId === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.assigneeId === viewingUserId);
    
  const viewingUserName = viewingUserId === 'ALL' 
    ? '全體人員' 
    : users.find(u => u.id === viewingUserId)?.name || '未知';

  const now = new Date();
  const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
  const todayEnd = new Date(now.setHours(23,59,59,999)).getTime();
  const todayDateStr = new Date().toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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

  const todayLoadHours = dueToday.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);

  const approachingTasks = userTasks.filter(t => {
    const due = new Date(t.dueAt).getTime();
    return due > Date.now() && due < (Date.now() + 24 * 60 * 60 * 1000) && t.status !== 'done';
  });

  const alertFeed = [
    ...overdue.map(t => ({ task: t, type: 'critical' as const, priority: 3 })),
    ...submittedTasks.map(t => ({ task: t, type: 'review' as const, priority: 2 })),
    ...approachingTasks.map(t => ({ task: t, type: 'warning' as const, priority: 1 })),
  ].sort((a, b) => b.priority - a.priority);

  const viewingUserObj = users.find(u => u.id === (viewingUserId === 'ALL' ? currentUser.id : viewingUserId)) || currentUser;
  const startHour = 9; 
  const endHour = 19; 
  const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  
  const getTimelineStatus = (hour: number) => {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    if (hour === 12) return { type: 'rest', reason: '午休時間' };
    if (hour === 13) return { type: 'rest', reason: '13:30 後開放' };
    
    const alloc = allocations.find(a => a.userId === viewingUserObj.id && a.date === todayDateStr && a.startTime === timeSlot);
    if (alloc) return { type: 'alloc', status: alloc.status, data: alloc };
    
    const task = userTasks.find(t => t.scheduledSlot === timeSlot && t.status !== 'done');
    if (task) return { type: 'task', status: 'planned', data: task };

    return null;
  };

  const projectStats = projects.map(p => {
    const pTasks = userTasks.filter(t => t.projectId === p.id);
    const totalHours = pTasks.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);
    const overdueCount = pTasks.filter(t => new Date(t.dueAt).getTime() < Date.now() && t.status !== 'done').length;
    const activeCount = pTasks.filter(t => t.status !== 'done' && t.status !== 'archived').length;
    const heatScore = overdueCount * 2 + activeCount;
    return { ...p, totalHours, overdueCount, activeCount, heatScore };
  }).filter(p => p.activeCount > 0 || p.overdueCount > 0)
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, 5);

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
    { name: '零碎', hours: totalMiscHrs.toFixed(1), color: '#fbbf24' }, 
    { name: '當日', hours: totalDailyHrs.toFixed(1), color: '#3b82f6' }, 
    { name: '長期', hours: totalLongHrs.toFixed(1), color: '#a855f7' }, 
  ];

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
          <p className="text-stone-500 font-medium flex items-center gap-2">即時戰術概覽 - <span className="text-stone-800 font-bold">{viewingUserName}</span></p>
        </div>
        {isManagement && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
            <Users size={16} className="text-stone-400 ml-2" />
            <select value={viewingUserId} onChange={(e) => onSwitchUser(e.target.value)} className="bg-transparent font-bold text-stone-700 outline-none text-sm pr-2 cursor-pointer min-w-[120px]">
              <option value="ALL">❖ 全體人員</option>
              {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="今日工時" count={todayLoadHours.toFixed(1)} suffix="hr" icon={Hourglass} colorClass="text-blue-500" bgClass="bg-blue-50" onClick={() => onNavigateToTasks({})} />
        <StatCard title="今日到期" count={dueToday.length} icon={Calendar} colorClass="text-orange-500" bgClass="bg-orange-50" onClick={() => onNavigateToTasks({})} />
        <StatCard title="已逾期" count={overdue.length} icon={AlertOctagon} colorClass="text-red-500" bgClass="bg-red-50" onClick={() => onNavigateToTasks({ isOverdue: true })} />
        <StatCard title={viewingUserId === 'ALL' ? "全體送審" : "待我完成"} count={viewingUserId === 'ALL' ? submittedTasks.length : assignedToMe.length} icon={viewingUserId === 'ALL' ? FileSignature : Users} colorClass="text-violet-500" bgClass="bg-violet-50" onClick={() => onNavigateToTasks(viewingUserId === 'ALL' ? { status: 'submitted' } : {})} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 overflow-visible">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2"><Clock size={20} className="text-amber-500" /> 今日時間軸</h3>
                <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-lg font-bold">09:00 - 18:30 (12:00-13:30 休息)</span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-8 pt-16 px-2 custom-scrollbar">
                {timelineHours.map(hour => {
                  const item = getTimelineStatus(hour);
                  const isRest = item?.type === 'rest';
                  const taskTitle = !isRest && item ? (item.type === 'task' ? (item.data as Task).title : tasks.find(t => t.id === (item.data as TaskAllocation).taskId)?.title) : '';

                  return (
                    <div key={hour} className="flex-1 min-w-[80px] flex flex-col gap-3 group relative">
                       <span className="text-xs font-mono text-stone-400 text-center font-bold">{hour}:00</span>
                       <div className={`h-16 rounded-2xl border flex items-center justify-center relative transition-all duration-300 ${
                         isRest ? 'bg-stone-50 border-stone-200 border-dashed opacity-50' :
                         !item ? 'bg-stone-50 border-stone-100 border-dashed hover:bg-stone-100' :
                         item.status === 'running' ? 'bg-amber-100 border-amber-300 ring-4 ring-amber-200' :
                         'bg-white border-stone-200 shadow-sm'
                       }`}>
                         {isRest ? <Coffee size={18} className="text-stone-300"/> : item && (
                           <>
                             {item.type === 'alloc' ? <Zap size={18} className="text-amber-600"/> : <Target size={18} className="text-blue-600"/>}
                             <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-4 bg-stone-900 text-white text-[11px] p-3 rounded-xl w-44 shadow-2xl z-[100] pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 border border-white/10 backdrop-blur-md">
                               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-stone-900"></div>
                               <p className="font-black mb-1 line-clamp-3 leading-tight">{taskTitle || '未命名任務'}</p>
                               <div className="flex justify-between items-center border-t border-white/10 pt-1 mt-1">
                                  <span className="opacity-60 uppercase font-mono text-[9px]">{item.status || 'Planned'}</span>
                                  <span className="opacity-40">{hour}:00</span>
                               </div>
                             </div>
                           </>
                         )}
                       </div>
                    </div>
                  )
                })}
              </div>
           </div>

           {/* 詢問數量統計表整合區 */}
           <InquiryStatsTable tasks={tasks} viewingUserId={viewingUserId} />

           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-lg font-bold text-stone-800">工時分布指標 <span className="text-xs text-stone-400 ml-2">總計: {totalPeriodHours.toFixed(1)}h</span></h3>
               <div className="flex bg-stone-100 p-1 rounded-xl">
                  {['day', 'week', 'month'].map(p => (<button key={p} onClick={() => setDistributionPeriod(p as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${distributionPeriod === p ? 'bg-white shadow-sm' : 'text-stone-400'}`}>{p === 'day' ? '日' : p === 'week' ? '週' : '月'}</button>))}
               </div>
             </div>
             <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" barSize={24} margin={{ left: 0, right: 30 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={40} axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 600}} />
                   <Tooltip cursor={{fill: '#fafaf9', radius: 8}} />
                   <Bar dataKey="hours" radius={[0, 10, 10, 0]}>
                     {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="bg-stone-900 text-stone-50 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col min-h-[300px]">
            <h3 className="text-lg font-bold mb-4 relative z-10 flex items-center gap-2"><ShieldAlert className="text-red-500" size={20} /> 指揮中心警示</h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar relative z-10">
              {alertFeed.length > 0 ? alertFeed.map(({ task, type }, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-stone-800/50 p-3 rounded-2xl border border-stone-700/50 backdrop-blur-sm">
                   <div className="flex-1">
                     <p className="text-xs font-bold text-stone-400 mb-0.5">{type === 'critical' ? '逾期' : type === 'review' ? '待審' : '快到期'}</p>
                     <p className="text-sm font-bold text-stone-100 line-clamp-1">{task.title}</p>
                   </div>
                </div>
              )) : <p className="text-center text-stone-500 py-10">目前無緊急警示</p>}
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 flex-1">
             <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2"><Activity className="text-orange-500" size={20} /> 焦點專案</h3>
             <div className="space-y-3">
               {projectStats.map(p => (
                 <div key={p.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-100 flex justify-between">
                    <p className="font-bold text-stone-700 text-sm truncate mr-2">{p.name}</p>
                    <span className="text-xs font-mono font-bold text-stone-500">{p.totalHours.toFixed(1)}h</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
