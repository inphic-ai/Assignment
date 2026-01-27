import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
} from 'recharts';
import { 
  Activity, Clock, Zap, TrendingUp, Calendar, Coffee, Briefcase, 
  Map as MapIcon, Kanban, List, Gauge, Search, ListTodo, Flame,
  ChevronRight, ArrowDownCircle, CheckCircle2, Circle, AlertCircle, RotateCcw, Target, History, Users,
  UserCircle, Info, Crosshair, ZapOff, TrendingUp as UpIcon, Filter
} from 'lucide-react';
import { Task, TaskAllocation, GoalCategory, User } from '~/types';

// --- UI 樣式定義 ---
const UI = {
  H1: "text-3xl font-black text-stone-800 tracking-tight",
  H2: "text-xl font-black text-stone-800",
  H3: "text-lg font-bold text-stone-700",
  LABEL: "text-[10px] font-black text-stone-400 uppercase tracking-widest",
  BODY: "text-sm font-medium text-stone-600",
  MONO: "font-mono text-xs text-stone-400"
};

export const QUADRANTS = {
  1: { id: 1, title: "1級營收", desc: "財務指標：淨利、營收、預算達成", color: "#EF4444", icon: TrendingUp }, 
  2: { id: 2, title: "2級流量", desc: "顧客指標：數量、市佔、轉換率", color: "#3B82F6", icon: Activity },   
  3: { id: 3, title: "3級行政", desc: "流程指標：SOP、時效、品質", color: "#F59E0B", icon: Clock },      
  4: { id: 4, title: "日常", desc: "維護、整理、雜務", color: "#6B7280", icon: Coffee },      
};

export const getQuadrant = (goal: GoalCategory): number => {
  if (goal === '業務') return 1;
  if (goal === '行銷' || goal === '管理') return 2;
  if (goal === '行政' || goal === '人資') return 3;
  return 4;
};

// --- 子元件：人效目標達成率 ---
const EfficiencyGoalCard = ({ currentHours, goalHours = 7 }: { currentHours: number, goalHours?: number }) => {
  const progress = Math.min(100, (currentHours / goalHours) * 100);
  
  return (
    <div className="bg-white rounded-4xl p-8 border border-stone-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
      <div className="relative z-10 w-full md:w-auto">
        <div className="flex items-center gap-2 text-stone-400 mb-6">
          <Target size={18} />
          <span className={UI.LABEL}>人效目標達成率</span>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-black text-stone-800">{currentHours.toFixed(1)}</span>
          <span className="text-stone-400 font-bold text-lg">/ {goalHours} 小時</span>
        </div>
        <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-widest">
           <span className="text-stone-300">目前進度</span>
           <span className="text-emerald-500">{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-5 hidden lg:block pointer-events-none">
         <div className="w-48 h-48 rounded-full border-[10px] border-stone-900 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-[10px] border-stone-900 flex items-center justify-center">
               <div className="w-16 h-16 rounded-full border-[10px] border-stone-900"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- 子元件：效率警示卡片 ---
const EfficiencyAlertCard = ({ adminRatio }: { adminRatio: number }) => {
  const isHighAdmin = adminRatio > 35;
  return (
    <div className="bg-white rounded-4xl p-8 border border-stone-100 shadow-sm flex flex-col justify-center relative h-full">
      {isHighAdmin ? (
        <div className="animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-red-500 mb-3">
            <Zap size={24} fill="currentColor" />
            <h3 className={UI.H2}>今日效率警示：行政過多</h3>
          </div>
          <p className={`${UI.BODY} leading-relaxed`}>
            3級行政 (流程/會議) 佔比過高，建議檢視會議與行政流程，釋放更多時間。
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 text-emerald-500 mb-3">
            <TrendingUp size={24} />
            <h3 className={UI.H2}>運作狀態：表現優異</h3>
          </div>
          <p className={`${UI.BODY} leading-relaxed`}>
            當前工時分配非常健康，專注力集中在核心價值產出。
          </p>
        </div>
      )}
      <button className="absolute top-8 right-8 w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
        <UpIcon size={20} />
      </button>
    </div>
  );
};

// --- 子元件：歷史趨勢小卡 ---
const DailyPerformanceCard = ({ dayData }: { dayData: any }) => {
  if (!dayData || !dayData.logs || dayData.logs.length === 0) {
      return (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 h-full min-h-[320px] flex flex-col items-center justify-center text-stone-300">
              <div className="text-center">
                <Calendar size={32} className="mx-auto mb-2 opacity-20"/>
                <p className="text-xs font-bold text-stone-800 mb-1">{dayData.date}</p>
                <span className={UI.LABEL}>尚無排程數據</span>
              </div>
          </div>
      );
  }

  const totalHours = dayData.logs.reduce((acc: number, l: any) => acc + l.duration, 0);
  const stats: any = {
    1: dayData.logs.filter((l: any) => l.quadrant === 1).reduce((acc: number, l: any) => acc + l.duration, 0),
    2: dayData.logs.filter((l: any) => l.quadrant === 2).reduce((acc: number, l: any) => acc + l.duration, 0),
    3: dayData.logs.filter((l: any) => l.quadrant === 3).reduce((acc: number, l: any) => acc + l.duration, 0),
    4: dayData.logs.filter((l: any) => l.quadrant === 4).reduce((acc: number, l: any) => acc + l.duration, 0),
  };

  const effectiveHours = stats[1] + stats[2] + stats[3];
  const chartData = [1, 2, 3, 4].map(id => ({ id, value: stats[id], color: QUADRANTS[id as keyof typeof QUADRANTS].color })).filter(d => d.value > 0);

  const getInsight = () => {
    if (dayData.isWeekend) return { title: "假日模式", color: "bg-stone-50 text-stone-500 border-stone-100", icon: Coffee };
    if ((stats[3] / (totalHours || 1)) > 0.4) return { title: "效率警示", color: "bg-red-50 text-red-500 border-red-100", icon: AlertCircle };
    return { title: "表現穩定", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Activity };
  };
  
  const insight = getInsight();
  const InsightIcon = insight.icon;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 h-full flex flex-col group hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-sm font-black text-stone-800">{dayData.date} <span className="text-[10px] text-stone-400 font-normal">({dayData.weekday})</span></h4>
          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black border ${insight.color}`}>
            <InsightIcon size={10} /> {insight.title}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 flex-1">
          <span className={UI.LABEL}>有效工時</span>
          <div className="text-xl font-black text-stone-800">{effectiveHours.toFixed(1)} <span className="text-[10px] font-normal text-stone-400">h</span></div>
        </div>
        <div className="w-16 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={18} outerRadius={28} paddingAngle={2} dataKey="value" stroke="none">
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <span className={`${UI.LABEL} flex items-center gap-1 opacity-60`}><History size={10}/> 主要任務</span>
        {dayData.logs.slice(0, 3).map((log: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-stone-600">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor: QUADRANTS[log.quadrant as keyof typeof QUADRANTS].color}}></div>
            {/* Fix: Changed 'class' to 'className' to resolve React JSX error */}
            <span className="truncate flex-1">{log.taskName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 戰略地圖任務節點 ---
const StrategicTaskNode: React.FC<{ task: Task, x: number, y: number, alignment?: 'left' | 'right', onSelect: (t: Task) => void }> = ({ task, x, y, alignment = 'left', onSelect }) => {
  const isUrgent = new Date(task.dueAt).getTime() < Date.now() + 86400000 && task.status !== 'done';
  return (
    <div onClick={() => onSelect(task)} className="absolute group cursor-pointer transition-all hover:scale-105 active:scale-95" style={{ left: `${x}px`, top: `${y}px`, transform: alignment === 'right' ? 'translateX(0)' : 'translateX(-100%)' }}>
      <div className="bg-white border border-stone-100 shadow-sm rounded-full py-2 px-4 pr-6 flex items-center gap-3 relative min-w-[140px] hover:border-stone-300 hover:shadow-md">
        <div className="w-4 h-4 rounded-full border-2 border-stone-200 shrink-0"></div>
        <span className="text-sm font-black text-stone-700 truncate max-w-[120px]">{task.title}</span>
        {isUrgent && <div className="absolute -top-3 right-0 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-white animate-bounce"><Flame size={10} fill="currentColor"/> Urgent</div>}
      </div>
    </div>
  );
};

const StrategicMindMap = ({ tasks, onSelectTask }: { tasks: Task[], onSelectTask: (t: Task) => void }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const grouped = useMemo(() => {
    const res: Record<number, Task[]> = { 1: [], 2: [], 3: [], 4: [] };
    tasks.filter(t => t.status !== 'done').forEach(t => { res[getQuadrant(t.goal)].push(t); });
    return res;
  }, [tasks]);

  const canvasWidth = 1400; const canvasHeight = 700; const center = { x: canvasWidth / 2, y: canvasHeight / 2 }; const gapX = 140; const gapY = 80;
  const quadrantPositions = { 1: { x: center.x - gapX, y: center.y - gapY }, 2: { x: center.x + gapX, y: center.y - gapY }, 3: { x: center.x - gapX, y: center.y + gapY }, 4: { x: center.x + gapX, y: center.y + gapY } };

  const handleRecenter = () => { if (scrollContainerRef.current) { const container = scrollContainerRef.current; const scrollX = center.x - container.offsetWidth / 2; const scrollY = center.y - container.offsetHeight / 2; container.scrollTo({ left: scrollX, top: scrollY, behavior: 'smooth' }); } };
  useEffect(() => { const timer = setTimeout(handleRecenter, 100); return () => clearTimeout(timer); }, []);

  return (
    <div className="relative group">
      <div ref={scrollContainerRef} className="relative w-full overflow-auto bg-stone-50/50 rounded-4xl border border-stone-100 min-h-[600px] max-h-[650px] shadow-inner select-none custom-scrollbar">
        <div style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, position: 'relative' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {Object.entries(quadrantPositions).map(([qId, pos]) => {
              const qTasks = grouped[Number(qId)]; const color = QUADRANTS[Number(qId) as keyof typeof QUADRANTS].color; const isRight = Number(qId) === 2 || Number(qId) === 4;
              return qTasks.map((t, idx) => {
                const spreadX = isRight ? 200 : -200; const spreadY = (idx - (qTasks.length - 1) / 2) * 55;
                const startX = pos.x + (isRight ? 100 : -100); const startY = pos.y; const endX = pos.x + spreadX; const endY = pos.y + spreadY;
                const controlX1 = startX + (isRight ? 50 : -50);
                return <path key={t.id} d={`M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX1} ${endY}, ${endX} ${endY}`} stroke={color} strokeWidth="1.5" fill="none" className="opacity-20 transition-opacity" />;
              });
            })}
          </svg>
          {Object.entries(quadrantPositions).map(([qId, pos]) => {
            const config = QUADRANTS[Number(qId) as keyof typeof QUADRANTS];
            return (
              <div key={qId} className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: `${pos.x}px`, top: `${pos.y}px` }}>
                <div className="w-[220px] p-4 rounded-2xl shadow-lg border border-white flex gap-3 items-center transition-transform hover:scale-105" style={{ backgroundColor: config.color }}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"><config.icon size={24} /></div>
                  <div className="min-w-0"><h4 className="text-white font-black text-sm">{config.title}</h4><p className="text-white/70 text-[10px] truncate leading-tight">{config.desc}</p></div>
                </div>
              </div>
            );
          })}
          {Object.entries(quadrantPositions).map(([qId, pos]) => {
            const qTasks = grouped[Number(qId)]; const isRight = Number(qId) === 2 || Number(qId) === 4;
            return qTasks.map((t, idx) => {
              const spreadX = isRight ? 210 : -210; const spreadY = (idx - (qTasks.length - 1) / 2) * 55;
              return <StrategicTaskNode key={t.id} task={t} x={pos.x + spreadX} y={pos.y + spreadY - 20} alignment={isRight ? 'right' : 'left'} onSelect={onSelectTask} />;
            });
          })}
        </div>
      </div>
      <button onClick={handleRecenter} className="absolute bottom-6 right-6 z-30 w-14 h-14 bg-white/80 backdrop-blur-xl border border-stone-200 rounded-full shadow-2xl flex items-center justify-center text-stone-600 hover:text-amber-500 hover:scale-110 transition-all group"><Target size={28} /></button>
    </div>
  );
};

const PersonalDashboard: React.FC<any> = ({ tasks = [], allocations = [], users = [], currentUser, viewingUserId, onSwitchUser, onSelectTask }) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); 
  const [showWeekends, setShowWeekends] = useState(false);
  const isManagement = currentUser.role === 'admin' || currentUser.role === 'manager';
  const effectiveViewingUserId = viewingUserId === 'ALL' ? currentUser.id : viewingUserId;
  const viewingUserObj = users.find((u: any) => u.id === effectiveViewingUserId) || currentUser;

  // 輔助函式：取得在地日期字串 (YYYY-MM-DD)
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getLocalDateString(new Date());

  const getDayLogs = (dateStr: string) => allocations.filter((a: any) => a.date === dateStr && a.userId === viewingUserObj.id).map((a: any) => {
    const t = tasks.find((task: any) => task.id === a.taskId);
    return { id: a.id, taskName: t?.title || '未知任務', duration: a.durationMinutes / 60, quadrant: t ? getQuadrant(t.goal) : 4, startTime: a.startTime };
  });

  const todayLogs = getDayLogs(todayDateStr);
  const totalTodayHours = todayLogs.reduce((acc: number, l: any) => acc + l.duration, 0);
  const adminRatio = (todayLogs.filter((l: any) => l.quadrant === 3).reduce((acc: number, l: any) => acc + l.duration, 0) / (totalTodayHours || 1)) * 100;
  const todayChartData = [1, 2, 3, 4].map(id => ({ id, value: todayLogs.filter((l: any) => l.quadrant === id).reduce((acc: number, l: any) => acc + l.duration, 0), color: QUADRANTS[id as keyof typeof QUADRANTS].color })).filter(d => d.value > 0);

  // 趨勢圖邏輯：搜尋直到集滿 5 個符合條件的日期
  const trendDays = useMemo(() => {
    const results = [];
    let datePointer = new Date();
    
    // 從今天開始向後尋找，直到集滿 5 個顯示天數
    while (results.length < 5) {
      const dayOfWeek = datePointer.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // 如果設定為不顯示週末且當前是週末，則跳過此日期
      if (showWeekends || !isWeekend) {
        const dStr = getLocalDateString(datePointer);
        results.unshift({ // unshift 確保最右邊是今天（左到右時序）
          date: datePointer.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
          weekday: datePointer.toLocaleDateString('zh-TW', { weekday: 'short' }),
          isWeekend,
          logs: getDayLogs(dStr)
        });
      }
      
      // 指針前移一天
      datePointer.setDate(datePointer.getDate() - 1);
      
      // 安全機制：若搜尋超過 30 天仍未滿，則停止（防止死循環）
      if (results.length < 5 && (new Date().getTime() - datePointer.getTime() > 30 * 86400000)) break;
    }
    return results;
  }, [allocations, tasks, viewingUserObj.id, showWeekends]);

  const currentTasks = tasks.filter((t: any) => t.assigneeId === viewingUserObj.id && t.status !== 'done');

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className={UI.H1}>個人儀表板</h1>
          <p className={`${UI.BODY} text-stone-500`}>成員：<span className="text-stone-800 font-black">{viewingUserObj.name}</span></p>
        </div>
        {isManagement && (
          <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-sm flex items-center gap-2">
            <Users size={16} className="text-stone-400 ml-2" />
            <select value={viewingUserId} onChange={(e) => onSwitchUser(e.target.value)} className="bg-transparent font-black text-stone-700 outline-none text-sm cursor-pointer min-w-[140px]">
              <option value="ALL">❖ 切換人員...</option>
              {users.map((u: any) => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
          </div>
        )}
      </header>

      {/* 第一層：最近 5 天工作趨勢 - 已優化為格狀佈局 */}
      <section>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
               <Calendar className="text-amber-500" size={28}/>
               <h2 className={UI.H2}>最近 5 天工作趨勢</h2>
            </div>
            <button 
              onClick={() => setShowWeekends(!showWeekends)}
              className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center gap-2 transition-all ${showWeekends ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-stone-400 border-stone-200'}`}
            >
              <Coffee size={14}/> {showWeekends ? '隱藏假日' : '顯示假日'}
            </button>
          </div>
          {/* 修改點：將 flex 橫向捲動改為 grid 5 欄佈局 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {trendDays.map((day, idx) => (
              <div key={idx} className="animate-in fade-in duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                <DailyPerformanceCard dayData={day} />
              </div>
            ))}
          </div>
      </section>

      {/* 第二層：今日執行核心看板 */}
      <section>
          <div className="flex items-center gap-3 mb-8">
             <Activity className="text-blue-500" size={28} />
             <h2 className={UI.H2}>今日執行狀況</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EfficiencyGoalCard currentHours={totalTodayHours} />
            <EfficiencyAlertCard adminRatio={adminRatio} />
          </div>
      </section>

      {/* 第三層：分佈與足跡 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-4xl p-8 border border-stone-100 shadow-sm flex flex-col min-h-[400px]">
            <h3 className={`${UI.H3} mb-6 flex items-center gap-2`}><Clock size={20} className="text-blue-500" /> 今日時間分佈</h3>
            <div className="flex-1 flex items-center">
              <div className="w-1/2 h-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={todayChartData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">{todayChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><RechartsTooltip /></PieChart></ResponsiveContainer></div>
              <div className="w-1/2 space-y-4 pl-8">
                {Object.entries(QUADRANTS).map(([id, config]) => {
                  const val = todayLogs.filter(l => l.quadrant === Number(id)).reduce((acc, l) => acc + l.duration, 0);
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }}></div><span className={`${UI.BODY} font-bold`}>{config.title}</span></div>
                      <span className="font-black text-stone-800 text-sm">{val.toFixed(1)}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-4xl p-8 border border-stone-100 shadow-sm flex flex-col h-full overflow-hidden">
             <h3 className={`${UI.H3} mb-6`}>詳細工作足跡</h3>
             <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {todayLogs.sort((a,b)=>a.startTime.localeCompare(b.startTime)).map((log, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <span className={`${UI.MONO} w-10`}>{log.startTime}</span>
                    <div className="flex-1 flex justify-between items-center p-4 rounded-2xl bg-stone-50/50 border-l-4 transition-all" style={{ borderLeftColor: QUADRANTS[log.quadrant as keyof typeof QUADRANTS].color }}>
                      <span className="text-sm font-black text-stone-700 truncate">{log.taskName}</span>
                      <span className={`${UI.LABEL} opacity-60`}>{log.duration.toFixed(1)}h</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
      </section>
      
      {/* 第四層：戰略任務地圖 (心智圖) */}
      <section className="pt-12 border-t border-dashed border-stone-300">
          <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className={`${UI.H2} flex items-center gap-3`}><MapIcon className="text-amber-500" size={28}/>戰略任務地圖</h2>
                <p className={`${UI.BODY} text-stone-400 mt-1`}>將任務對齊戰略目標，確保資源精準分配</p>
              </div>
              <div className="flex bg-stone-100 p-1 rounded-xl">
                 <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}><MapIcon size={14}/>心智圖</button>
                 <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}><List size={14}/>列表</button>
              </div>
          </div>
          {viewMode === 'map' ? <StrategicMindMap tasks={currentTasks} onSelectTask={onSelectTask} /> : (
            <div className="bg-white rounded-4xl p-8 border border-stone-200 shadow-xl min-h-[400px]">
               <div className="space-y-4">
                  {currentTasks.map((t: any) => (
                    <div key={t.id} onClick={() => onSelectTask(t)} className="p-5 bg-stone-50 rounded-2xl flex justify-between items-center hover:bg-white border border-transparent hover:border-stone-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: QUADRANTS[getQuadrant(t.goal) as keyof typeof QUADRANTS].color}}></div>
                        <span className="font-black text-stone-800">{t.title}</span>
                      </div>
                      <span className={`${UI.LABEL} bg-white px-3 py-1 rounded-lg border border-stone-100`}>{t.goal}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
      </section>
    </div>
  );
};

export default PersonalDashboard;