import React, { useState, useRef } from 'react';
import { Task, TaskAllocation, User, GoalCategory } from '../types';
import { Clock, AlertTriangle, GripVertical, CheckCircle2, Briefcase, Plus, ChevronDown, ChevronUp, Play, Square, Users, Sunrise, Sun, Sunset, SortAsc, History, ChevronLeft, ChevronRight, Calendar, Layers, Tag, CalendarDays } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  allocations: TaskAllocation[]; // Global allocations state
  currentUser: User;
  users: User[];
  viewingUserId: string;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onUpdateAllocation: (id: string, updates: Partial<TaskAllocation>) => void;
  onAddAllocation: (allocation: TaskAllocation) => void;
  onRemoveAllocation: (allocationId: string) => void;
  onSwitchUser: (userId: string) => void;
  onSelectTask: (task: Task) => void; // Added for opening details
}

const TimelineView: React.FC<TimelineViewProps> = ({ 
  tasks, allocations, currentUser, users, viewingUserId,
  onUpdateTask, onUpdateAllocation, onAddAllocation, onRemoveAllocation, onSwitchUser, onSelectTask
}) => {
  const [timeRange, setTimeRange] = useState<'all' | 'am' | 'pm'>('all');
  const [sortMethod, setSortMethod] = useState<'default' | 'time' | 'priority' | 'spent'>('default');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Accordion State
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const viewingUser = users.find(u => u.id === viewingUserId) || currentUser;

  // --- Date Helpers (Local Time) ---
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = getLocalDateString(currentDate);
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDateStr === todayStr;

  const goToPrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Create date from parts to avoid timezone issues with string parsing
      const [year, month, day] = e.target.value.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, day));
    }
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // 1. Filter Tasks
  const dailyTasks = tasks.filter(t => t.assigneeId === viewingUserId && (t.timeType === 'misc' || t.timeType === 'daily') && t.status !== 'done' && !t.scheduledSlot);
  const longTasks = tasks.filter(t => t.assigneeId === viewingUserId && t.timeType === 'long' && t.status !== 'done');

  // Sorting Logic for Daily Tasks
  const sortedDailyTasks = [...dailyTasks].sort((a, b) => {
    if (sortMethod === 'time') return b.timeValue - a.timeValue;
    if (sortMethod === 'spent') return (b.totalSpent || 0) - (a.totalSpent || 0);
    if (sortMethod === 'priority') return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    return 0; 
  });

  // Grouping Logic
  const groupTasksByGoal = (taskList: Task[]) => {
    const groups: Record<string, Task[]> = {};
    taskList.forEach(t => {
      const key = t.goal || '其他';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  };

  const dailyGroups = groupTasksByGoal(sortedDailyTasks);
  const longGroups = groupTasksByGoal(longTasks);

  // 2. Generate Time Slots
  const startHour = parseInt(viewingUser.workdayStart.split(':')[0]);
  const endHour = parseInt(viewingUser.workdayEnd.split(':')[0]);
  const allTimeSlots = Array.from({ length: endHour - startHour }, (_, i) => {
    const hour = startHour + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const displayedSlots = allTimeSlots.filter(slot => {
    const hour = parseInt(slot.split(':')[0]);
    if (timeRange === 'am') return hour < 12;
    if (timeRange === 'pm') return hour >= 12;
    return true;
  });

  const getSlotItems = (slot: string) => {
    const slotAllocations = allocations.filter(a => a.userId === viewingUserId && a.date === selectedDateStr && a.startTime === slot);
    const directTasks = isToday 
      ? tasks.filter(t => t.assigneeId === viewingUserId && t.scheduledSlot === slot && t.status !== 'done')
      : [];
    return { directTasks, slotAllocations };
  };

  // --- Handlers ---
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('type', task.timeType);
  };

  const handleDropOnSlot = (e: React.DragEvent, slot: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const type = e.dataTransfer.getData('type');
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    if (!isToday) {
      alert("時間分配限制：僅能將任務拖曳至「今日」進行計時！");
      return;
    }

    const slotHour = parseInt(slot.split(':')[0]);
    const currentHour = new Date().getHours();
    
    if (slotHour < currentHour) {
      alert(`時光不可逆：無法將任務拖曳至已經過去的時段 (${slot})。`);
      return;
    }

    const initialStatus: 'running' = 'running';
    const initialActualStart = new Date().toISOString();

    const runningCount = allocations.filter(a => a.userId === viewingUserId && a.status === 'running').length;
    if (runningCount >= 2) {
       alert("系統提醒：為確保專注，只能同時計時兩個工作！已取消本次拖曳。");
       return;
    }

    if (type === 'long') {
      const hours = prompt(`要在 ${selectedDateStr} ${slot} 分配幾小時給 "${task.title}"?`, "1");
      if (hours) {
        const duration = parseFloat(hours) * 60;
        const newAllocation: TaskAllocation = {
          id: `alloc-${Date.now()}`,
          taskId: task.id,
          userId: viewingUserId,
          date: selectedDateStr, 
          startTime: slot,
          durationMinutes: duration,
          status: initialStatus,
          actualStartAt: initialActualStart
        };
        onAddAllocation(newAllocation);
      }
    } else {
      const newAllocation: TaskAllocation = {
          id: `alloc-${Date.now()}`,
          taskId: task.id,
          userId: viewingUserId,
          date: selectedDateStr, 
          startTime: slot,
          durationMinutes: task.timeType === 'misc' ? task.timeValue : task.timeValue * 60,
          status: initialStatus,
          actualStartAt: initialActualStart
      };
      onAddAllocation(newAllocation);
    }
  };

  const handleStartAllocation = (allocId: string) => {
     const runningCount = allocations.filter(a => a.userId === viewingUserId && a.status === 'running').length;
     if (runningCount >= 2) {
       alert("系統提醒：只能同時進行兩個計時工作！請先結束一個任務。");
       return;
     }
     onUpdateAllocation(allocId, { status: 'running', actualStartAt: new Date().toISOString() });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleRemoveAllocationLogic = (alloc: TaskAllocation) => {
     if (alloc.status === 'planned' || !alloc.actualStartAt) {
        onRemoveAllocation(alloc.id);
        return;
     }

     const now = new Date();
     const start = new Date(alloc.actualStartAt);
     const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60);

     if (diffMinutes < 3) {
       onRemoveAllocation(alloc.id);
     } else {
       const task = tasks.find(t => t.id === alloc.taskId);
       if (task) {
          onUpdateTask(task.id, { 
             totalSpent: (task.totalSpent || 0) + Math.round(diffMinutes) 
          });
       }
       onUpdateAllocation(alloc.id, {
          status: 'done',
          actualEndAt: now.toISOString(),
          durationMinutes: Math.round(diffMinutes)
       });
     }
  };

  const handleStopAllocation = (alloc: TaskAllocation) => {
     const now = new Date();
     const start = new Date(alloc.actualStartAt || new Date().toISOString());
     const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60);

     const task = tasks.find(t => t.id === alloc.taskId);
     if (task) {
        onUpdateTask(task.id, { 
           totalSpent: (task.totalSpent || 0) + Math.round(diffMinutes) 
        });
     }

     onUpdateAllocation(alloc.id, {
        status: 'done',
        actualEndAt: now.toISOString(),
     });
  };

  // --- Render Helpers ---
  const renderAccordionGroup = (groupKey: string, groupTitle: string, groupTasks: Task[], theme: 'stone' | 'violet') => {
    const isExpanded = expandedGroups[groupKey] !== false; // Default Open
    const themeStyles = theme === 'violet' ? {
      header: 'bg-violet-100/50 hover:bg-violet-100',
      text: 'text-violet-800',
      border: 'border-violet-200',
      badge: 'bg-violet-200 text-violet-700',
      card: 'border-violet-100 hover:border-violet-400'
    } : {
      header: 'bg-stone-100/50 hover:bg-stone-100',
      text: 'text-stone-700',
      border: 'border-stone-200',
      badge: 'bg-stone-200 text-stone-600',
      card: 'border-stone-100 hover:border-amber-300'
    };

    return (
      <div key={groupKey} className="rounded-xl overflow-hidden border border-transparent">
        <button 
          onClick={() => toggleGroup(groupKey)}
          className={`w-full flex items-center justify-between p-3 transition-colors ${themeStyles.header}`}
        >
          <div className="flex items-center gap-2">
             <Tag size={14} className={themeStyles.text} />
             <span className={`font-bold text-sm ${themeStyles.text}`}>{groupTitle}</span>
             <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${themeStyles.badge}`}>{groupTasks.length}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} className={themeStyles.text} /> : <ChevronDown size={16} className={themeStyles.text} />}
        </button>
        
        {isExpanded && (
          <div className="space-y-2 p-2 pt-1 animate-in slide-in-from-top-2 duration-200">
             {groupTasks.map(task => (
                <div 
                  key={task.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, task)}
                  onClick={() => onSelectTask(task)}
                  className={`bg-white p-3 rounded-xl border shadow-sm cursor-grab transition-all flex justify-between items-center hover:shadow-md group ${themeStyles.card}`}
                >
                   <div className="flex-1 min-w-0 mr-2">
                     <div className="font-bold text-sm text-stone-700 truncate">{task.title}</div>
                     {task.totalSpent && task.totalSpent > 0 ? (
                        <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-1">
                          <History size={10} /> 已累計 {theme === 'violet' ? Math.round(task.totalSpent/60)+'小時' : task.totalSpent+'分'}
                        </div>
                     ) : null}
                   </div>
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                     theme === 'violet' ? 'bg-violet-100 text-violet-700' :
                     task.timeType === 'misc' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                   }`}>
                     {task.timeValue}{task.timeType === 'misc' ? 'm' : task.timeType === 'daily' ? 'h' : '天'}
                   </span>
                </div>
             ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-stone-800">時間分配</h1>
           <p className="text-stone-500">安排您的工作時段 ({viewingUser.workdayStart} - {viewingUser.workdayEnd})</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white p-1.5 rounded-xl border border-stone-200 shadow-sm relative">
             <button onClick={goToPrevDay} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 z-20"><ChevronLeft size={18} /></button>
             
             {/* Enhanced Date Picker Display */}
             {/* Changed to label and added pointer-events-none to children to ensure input captures clicks */}
             <label 
               className="flex items-center px-4 gap-2 relative group cursor-pointer h-full justify-center hover:bg-stone-50 rounded-lg transition-colors overflow-hidden"
               title="點擊選擇日期 (年/月/日)"
             >
               {/* Visuals - pointer-events-none lets click pass through to input */}
               <div className="flex items-center gap-2 pointer-events-none relative z-0">
                 <CalendarDays size={18} className="text-amber-500 group-hover:text-amber-600" />
                 <div className="flex flex-col items-center">
                   <span className="font-bold text-stone-700 text-sm whitespace-nowrap group-hover:text-stone-900 leading-tight">
                     {currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                   </span>
                   <span className="text-[10px] text-stone-400 font-medium leading-tight">
                     {currentDate.toLocaleDateString('zh-TW', { weekday: 'long' })}
                   </span>
                 </div>
               </div>
               
               {/* Overlay Input: Covers the entire parent label and sits on top (z-20) */}
               <input 
                 type="date" 
                 value={selectedDateStr} 
                 onChange={handleDateChange} 
                 onClick={(e) => {
                    // Force showPicker on click (especially for Desktop where text focus might happen instead)
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        (e.target as HTMLInputElement).showPicker();
                      }
                    } catch (error) {
                      // Fallback: Default input behavior handles click
                    }
                 }}
                 className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" 
               />
             </label>

             <button onClick={goToNextDay} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 z-20"><ChevronRight size={18} /></button>
          </div>

          {!isToday && (
            <button 
              onClick={jumpToToday}
              className="px-3 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors shadow-sm"
            >
              回今天
            </button>
          )}

          <div className="flex bg-stone-100 p-1 rounded-xl">
             <button onClick={() => setTimeRange('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${timeRange === 'all' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}>
               <Clock size={14} /> 全天
             </button>
             <button onClick={() => setTimeRange('am')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${timeRange === 'am' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>
               <Sunrise size={14} /> 上午
             </button>
             <button onClick={() => setTimeRange('pm')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${timeRange === 'pm' ? 'bg-white shadow-sm text-blue-600' : 'text-stone-400 hover:text-stone-600'}`}>
               <Sunset size={14} /> 下午
             </button>
          </div>

          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-white"><Users size={16} /></div>
              <select value={viewingUserId} onChange={(e) => onSwitchUser(e.target.value)} className="bg-transparent font-bold text-stone-700 outline-none text-sm pr-2 cursor-pointer">
                {users.map(u => (<option key={u.id} value={u.id}>{u.name} {u.id === currentUser.id ? '(我)' : ''}</option>))}
              </select>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT SIDEBAR: TASK POOLS (No Scroll container, expands fully) */}
        <div className="lg:w-1/3 flex flex-col gap-6 min-w-[300px]">
           
           {/* 1. Unscheduled Daily/Misc */}
           <div className="bg-stone-50 rounded-[1.5rem] border border-stone-200 shadow-sm overflow-hidden h-fit">
              <div className="p-4 bg-stone-100/50 border-b border-stone-200 flex justify-between items-center">
                 <h4 className="font-bold text-stone-600 flex items-center gap-2 text-sm">
                    <Layers size={16} /> 待排程 ({sortedDailyTasks.length})
                 </h4>
                 {/* Sort Controls */}
                 <div className="relative group">
                    <button className="p-1 hover:bg-stone-200 rounded text-stone-500">
                       <SortAsc size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-stone-100 shadow-lg rounded-xl p-1 hidden group-hover:block z-20 min-w-[100px]">
                       <button onClick={() => setSortMethod('default')} className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded-lg text-stone-600">預設排序</button>
                       <button onClick={() => setSortMethod('priority')} className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded-lg text-stone-600">依截止日</button>
                       <button onClick={() => setSortMethod('time')} className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded-lg text-stone-600">依時長</button>
                    </div>
                 </div>
              </div>
              
              <div className="p-3 space-y-2">
                 {Object.keys(dailyGroups).length > 0 ? (
                   Object.entries(dailyGroups).map(([goal, groupTasks]) => 
                     renderAccordionGroup(`daily-${goal}`, goal, groupTasks, 'stone')
                   )
                 ) : (
                   <div className="text-center py-8 text-stone-300 text-sm">無待排程任務</div>
                 )}
              </div>
           </div>

           {/* 2. Long Task Library */}
           <div className="bg-violet-50 rounded-[1.5rem] border border-violet-100 shadow-sm overflow-hidden h-fit">
              <div className="p-4 bg-violet-100/50 border-b border-violet-200 flex justify-between items-center">
                 <h4 className="font-bold text-violet-800 flex items-center gap-2 text-sm">
                    <Briefcase size={16} /> 長期任務庫 ({longTasks.length})
                 </h4>
              </div>
              
              <div className="p-3 space-y-2">
                 {Object.keys(longGroups).length > 0 ? (
                   Object.entries(longGroups).map(([goal, groupTasks]) => 
                     renderAccordionGroup(`long-${goal}`, goal, groupTasks, 'violet')
                   )
                 ) : (
                    <div className="text-center py-8 text-violet-300 text-sm">無長期任務</div>
                 )}
              </div>
           </div>
        </div>

        {/* RIGHT MAIN BLOCK: SELECTED DATE TIMELINE (Full Height/Content) */}
        <div className="flex-1 bg-white rounded-[2rem] border border-stone-200 shadow-lg flex flex-col relative h-fit pb-10">
           <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center shrink-0 rounded-t-[2rem]">
              <h3 className="font-bold text-stone-700 flex items-center gap-2">
                <Clock size={20} className="text-amber-500" /> 
                {isToday ? '今日' : `${currentDate.getMonth()+1}/${currentDate.getDate()}`} 時間軸
              </h3>
              <span className="text-xs text-stone-400 bg-white px-2 py-1 rounded-full border border-stone-100 shadow-sm">
                拖曳至此分配時間 {isToday && '(自動開始計時)'}
              </span>
           </div>
           
           <div className="p-6 space-y-2">
              {displayedSlots.map(slot => {
                const { directTasks, slotAllocations } = getSlotItems(slot);
                
                return (
                  <div 
                    key={slot} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnSlot(e, slot)}
                    className="flex gap-6 group min-h-[120px]" 
                  >
                    {/* Time Label */}
                    <div className="w-20 pt-3 text-right shrink-0">
                      <span className="text-2xl font-mono font-bold text-stone-300 group-hover:text-amber-500 transition-colors">{slot}</span>
                    </div>

                    {/* Slot Container */}
                    <div className="flex-1 border-t border-stone-100 relative pt-3 pb-8">
                      {/* Visual Drop Guide */}
                      <div className="absolute inset-0 top-3 rounded-2xl border-2 border-dashed border-transparent group-hover:border-stone-200 transition-colors pointer-events-none"></div>

                      <div className="space-y-3 relative z-10 pl-2">
                         
                         {/* 1. Direct Tasks */}
                         {directTasks.map(task => (
                           <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)} className="bg-white border border-stone-200 p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-lg cursor-grab active:cursor-grabbing hover:border-amber-200 transition-all opacity-60">
                              <div className="flex items-center gap-4">
                                 <GripVertical size={20} className="text-stone-300" />
                                 <div>
                                   <div className="flex items-center gap-3">
                                     <span className={`text-xs font-bold px-2 py-1 rounded-lg ${task.timeType === 'misc' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {task.timeValue}{task.timeType === 'misc' ? 'm' : 'h'}
                                     </span>
                                     <span className="font-bold text-lg text-stone-700">{task.title}</span>
                                   </div>
                                 </div>
                              </div>
                              <button onClick={() => onUpdateTask(task.id, { scheduledSlot: undefined })} className="text-sm text-stone-400 hover:text-red-500 px-3 py-1 hover:bg-red-50 rounded-lg transition-colors">移除</button>
                           </div>
                         ))}

                         {/* 2. Allocations */}
                         {slotAllocations.map(alloc => {
                           const parentTask = tasks.find(t => t.id === alloc.taskId);
                           if (!parentTask) return null;

                           const statusStyles = {
                             planned: 'bg-violet-50 border-violet-100 text-violet-700',
                             running: 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse border-2 shadow-lg',
                             done: 'bg-stone-100 border-stone-200 text-stone-500 grayscale opacity-80',
                             missed: 'bg-red-50 border-red-100 text-red-700',
                             overrun: 'bg-red-100 border-red-300 text-red-800'
                           };
                           
                           return (
                             <div 
                                key={alloc.id} 
                                onClick={() => onSelectTask(parentTask)}
                                className={`p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-all border cursor-pointer ${statusStyles[alloc.status] || statusStyles.planned}`}
                             >
                                <div className="flex items-center gap-4">
                                   <Briefcase size={20} className="opacity-50" />
                                   <div>
                                     <div className="flex items-center gap-3">
                                       <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded-lg">
                                          {Math.round(alloc.durationMinutes)}分
                                       </span>
                                       <span className="font-bold text-lg">{parentTask.title}</span>
                                       {alloc.status === 'done' && <span className="text-[10px] font-bold border border-current px-1 rounded uppercase">歷史紀錄</span>}
                                     </div>
                                   </div>
                                </div>
                                
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {alloc.status === 'planned' && (
                                    <button onClick={() => handleStartAllocation(alloc.id)} className="flex items-center gap-1 bg-white text-emerald-600 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50 shadow-sm">
                                      <Play size={16} fill="currentColor" /> 開始
                                    </button>
                                  )}
                                  {alloc.status === 'running' && (
                                    <button onClick={() => handleStopAllocation(alloc)} className="flex items-center gap-1 bg-white text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-50 shadow-sm">
                                      <Square size={16} fill="currentColor" /> 結束
                                    </button>
                                  )}
                                  {alloc.status !== 'done' && (
                                     <button onClick={() => handleRemoveAllocationLogic(alloc)} className="text-sm opacity-50 hover:opacity-100 hover:text-red-600 px-2 transition-opacity">移除</button>
                                  )}
                                </div>
                             </div>
                           );
                         })}
                         
                         {(directTasks.length === 0 && slotAllocations.length === 0) && (
                           <div className="h-full flex items-center pl-6 opacity-0 group-hover:opacity-100 transition-opacity min-h-[60px]">
                             <span className="text-sm text-stone-300 font-medium tracking-wide">空閒時段</span>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;