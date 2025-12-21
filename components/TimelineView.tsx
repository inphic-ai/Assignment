import React, { useState } from 'react';
import { Task, TaskAllocation, User } from '../types';
import { Clock, AlertTriangle, GripVertical, CheckCircle2, Briefcase, Plus, ChevronDown, ChevronUp, Play, Square, Users, Sunrise, Sun, Sunset, SortAsc, History, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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
      setCurrentDate(new Date(e.target.value));
    }
  };

  const openDatePicker = () => {
    // Fallback for browsers that don't support clicking hidden input
    const input = document.getElementById('timeline-date-picker') as HTMLInputElement;
    if (input && 'showPicker' in HTMLInputElement.prototype) {
      try {
        (input as any).showPicker();
      } catch (e) {
        // Fallback or ignore
      }
    }
  };

  // 1. Filter Tasks
  // We only show tasks that are NOT scheduled and NOT done in the pool
  const dailyTasks = tasks.filter(t => t.assigneeId === viewingUserId && (t.timeType === 'misc' || t.timeType === 'daily') && t.status !== 'done' && !t.scheduledSlot);
  const longTasks = tasks.filter(t => t.assigneeId === viewingUserId && t.timeType === 'long' && t.status !== 'done');

  // Sorting Logic for Daily Tasks
  const sortedDailyTasks = [...dailyTasks].sort((a, b) => {
    if (sortMethod === 'time') return b.timeValue - a.timeValue;
    if (sortMethod === 'spent') return (b.totalSpent || 0) - (a.totalSpent || 0);
    // priority via goal logic or specific field if exists, using create time as fallback
    if (sortMethod === 'priority') return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    return 0; // Default: Creation order usually
  });

  // 2. Generate Time Slots based on User Settings
  const startHour = parseInt(viewingUser.workdayStart.split(':')[0]);
  const endHour = parseInt(viewingUser.workdayEnd.split(':')[0]);
  const allTimeSlots = Array.from({ length: endHour - startHour }, (_, i) => {
    const hour = startHour + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Filter Slots based on AM/PM selection
  const displayedSlots = allTimeSlots.filter(slot => {
    const hour = parseInt(slot.split(':')[0]);
    if (timeRange === 'am') return hour < 12;
    if (timeRange === 'pm') return hour >= 12;
    return true;
  });

  // 3. Helper to get items for a slot (Using selectedDateStr)
  const getSlotItems = (slot: string) => {
    // Allocations for selected date starting at this slot
    const slotAllocations = allocations.filter(a => a.userId === viewingUserId && a.date === selectedDateStr && a.startTime === slot);
    
    // Legacy support for directly scheduled tasks (if any remain) - only show if scheduled for today/selected date logic applied? 
    // Legacy `scheduledSlot` didn't have a date, so we assume it meant "Today". 
    // To be safe, let's only show legacy scheduled tasks if we are viewing Today.
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

    // --- STRICT DATE PROTECTION: ONLY TODAY ---
    if (!isToday) {
      alert("時間分配限制：僅能將任務拖曳至「今日」進行計時！無法回到過去或預排未來。");
      return;
    }

    // Check if slot is in the past hours of today
    const slotHour = parseInt(slot.split(':')[0]);
    const currentHour = new Date().getHours();
    
    if (slotHour < currentHour) {
      alert(`時光不可逆：無法將任務拖曳至已經過去的時段 (${slot})。`);
      return;
    }

    // Auto-Start Timing on Drop (Since it's strictly Today)
    const initialStatus: 'running' = 'running';
    const initialActualStart = new Date().toISOString();

    // --- CONCURRENCY CHECK ---
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
      // Misc/Daily tasks
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
     // Concurrency Check
     const runningCount = allocations.filter(a => a.userId === viewingUserId && a.status === 'running').length;
     if (runningCount >= 2) {
       alert("系統提醒：只能同時進行兩個計時工作！請先結束一個任務。");
       return;
     }
     onUpdateAllocation(allocId, { status: 'running', actualStartAt: new Date().toISOString() });
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // --- 3 Minute Logic Implementation ---
  const handleRemoveAllocationLogic = (alloc: TaskAllocation) => {
     // If planned, just delete
     if (alloc.status === 'planned' || !alloc.actualStartAt) {
        onRemoveAllocation(alloc.id);
        return;
     }

     const now = new Date();
     const start = new Date(alloc.actualStartAt);
     const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60);

     if (diffMinutes < 3) {
       // < 3 mins: Treat as mistake/cancel, no record
       onRemoveAllocation(alloc.id);
     } else {
       // > 3 mins: Record as history
       const task = tasks.find(t => t.id === alloc.taskId);
       if (task) {
          // 1. Update Task Total Spent
          onUpdateTask(task.id, { 
             totalSpent: (task.totalSpent || 0) + Math.round(diffMinutes) 
          });
       }

       // 2. Mark allocation as done/stopped (History Block)
       onUpdateAllocation(alloc.id, {
          status: 'done',
          actualEndAt: now.toISOString(),
          durationMinutes: Math.round(diffMinutes) // Resize block to actual time spent? Or just keep visual. Let's keep data accurate.
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

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4 animate-in fade-in duration-500 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-stone-800">時間分配</h1>
           <p className="text-stone-500">安排您的工作時段 ({viewingUser.workdayStart} - {viewingUser.workdayEnd})</p>
        </div>
        
        <div className="flex items-center gap-4">
          
          {/* Date Navigation - Fixed Click Target */}
          <div className="flex items-center bg-white p-1.5 rounded-xl border border-stone-200 shadow-sm relative">
             <button onClick={goToPrevDay} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 z-20"><ChevronLeft size={18} /></button>
             
             {/* Reliable Date Picker Trigger */}
             <div 
               className="flex items-center px-4 gap-2 relative group cursor-pointer h-full justify-center hover:bg-stone-50 rounded-lg transition-colors overflow-hidden"
               onClick={openDatePicker}
             >
               <Calendar size={18} className="text-amber-500 group-hover:text-amber-600" />
               <span className="font-bold text-stone-700 text-sm whitespace-nowrap group-hover:text-stone-900">
                 {isToday ? '今天' : ''} {currentDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
               </span>
               <input 
                 id="timeline-date-picker"
                 type="date" 
                 value={selectedDateStr} 
                 onChange={handleDateChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
               />
             </div>

             <button onClick={goToNextDay} className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 z-20"><ChevronRight size={18} /></button>
          </div>

          <div className="w-px h-8 bg-stone-200 hidden md:block"></div>

          {/* Time Range Toggle */}
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

          {/* User Switcher (Admin Only) */}
          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-white">
                <Users size={16} />
              </div>
              <select 
                value={viewingUserId}
                onChange={(e) => onSwitchUser(e.target.value)}
                className="bg-transparent font-bold text-stone-700 outline-none text-sm pr-2 cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} {u.id === currentUser.id ? '(我)' : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* LEFT SIDEBAR: TASK POOLS */}
        <div className="lg:w-1/3 flex flex-col gap-4 min-w-[300px]">
           {/* 1. Unscheduled Daily/Misc */}
           <div className="flex-1 bg-stone-50 rounded-[1.5rem] border border-stone-200 flex flex-col min-w-0 overflow-hidden shadow-sm">
              <div className="p-4 bg-stone-100/50 border-b border-stone-200 flex justify-between items-center">
                 <h4 className="font-bold text-stone-600 flex items-center gap-2 text-sm">
                    待排程 (零碎/當日)
                    <span className="bg-stone-200 px-2 rounded-full text-xs">{sortedDailyTasks.length}</span>
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
                       <button onClick={() => setSortMethod('spent')} className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 rounded-lg text-stone-600">依已花費</button>
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 p-3">
                 {sortedDailyTasks.map(task => (
                   <div 
                     key={task.id} 
                     draggable 
                     onDragStart={(e) => handleDragStart(e, task)}
                     onClick={() => onSelectTask(task)}
                     className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm cursor-grab hover:border-amber-300 transition-all flex justify-between items-center hover:shadow-md group"
                   >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="font-bold text-sm text-stone-700 truncate">{task.title}</div>
                        {task.totalSpent && task.totalSpent > 0 ? (
                           <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-1">
                             <History size={10} /> 已累計 {task.totalSpent} 分
                           </div>
                        ) : null}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${task.timeType === 'misc' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {task.timeValue}{task.timeType === 'misc' ? 'm' : 'h'}
                      </span>
                   </div>
                 ))}
                 {sortedDailyTasks.length === 0 && (
                   <div className="text-center py-8 text-stone-300 text-sm">無待排程任務</div>
                 )}
              </div>
           </div>

           {/* 2. Long Task Library */}
           <div className="flex-1 bg-violet-50 rounded-[1.5rem] border border-violet-100 flex flex-col min-w-0 overflow-hidden shadow-sm">
              <div className="p-4 bg-violet-100/50 border-b border-violet-200 flex justify-between items-center">
                 <h4 className="font-bold text-violet-800 flex items-center gap-2 text-sm">
                    長期任務庫 (切片)
                    <span className="bg-violet-200/50 px-2 rounded-full text-xs">{longTasks.length}</span>
                 </h4>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 p-3">
                 {longTasks.map(task => (
                   <div 
                     key={task.id} 
                     draggable 
                     onDragStart={(e) => handleDragStart(e, task)}
                     onClick={() => onSelectTask(task)}
                     className="bg-white p-3 rounded-xl border border-violet-100 shadow-sm cursor-grab hover:border-violet-400 transition-all group hover:shadow-md"
                   >
                      <div className="flex justify-between items-center">
                         <div className="flex-1 min-w-0 mr-2">
                            <div className="font-bold text-sm text-stone-700 truncate">{task.title}</div>
                            {task.totalSpent && task.totalSpent > 0 ? (
                               <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-1">
                                 <History size={10} /> 已累計 {Math.round(task.totalSpent / 60)} 小時
                               </div>
                            ) : null}
                         </div>
                         <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                           {task.timeValue} 天
                         </span>
                      </div>
                   </div>
                 ))}
                 {longTasks.length === 0 && (
                    <div className="text-center py-8 text-violet-300 text-sm">無長期任務</div>
                 )}
              </div>
           </div>
        </div>

        {/* RIGHT MAIN BLOCK: SELECTED DATE TIMELINE */}
        <div className="flex-1 bg-white rounded-[2rem] border border-stone-200 shadow-lg overflow-hidden flex flex-col relative h-full">
           <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center shrink-0 z-10">
              <h3 className="font-bold text-stone-700 flex items-center gap-2">
                <Clock size={20} className="text-amber-500" /> 
                {isToday ? '今日' : `${currentDate.getMonth()+1}/${currentDate.getDate()}`} 時間軸
              </h3>
              <span className="text-xs text-stone-400 bg-white px-2 py-1 rounded-full border border-stone-100 shadow-sm">
                拖曳至此分配時間 {isToday && '(自動開始計時)'}
              </span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-2">
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
                         
                         {/* 1. Direct Tasks (Legacy - Only show on Today for safety) */}
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

                         {/* 2. Allocations (Time Slices) - With Logic */}
                         {slotAllocations.map(alloc => {
                           const parentTask = tasks.find(t => t.id === alloc.taskId);
                           if (!parentTask) return null;

                           // Status Styles
                           const statusStyles = {
                             planned: 'bg-violet-50 border-violet-100 text-violet-700',
                             running: 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse border-2 shadow-lg',
                             done: 'bg-stone-100 border-stone-200 text-stone-500 grayscale opacity-80', // History look
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
                                
                                {/* Execution Controls */}
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {/* Start Button (If planned) */}
                                  {alloc.status === 'planned' && (
                                    <button onClick={() => handleStartAllocation(alloc.id)} className="flex items-center gap-1 bg-white text-emerald-600 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50 shadow-sm">
                                      <Play size={16} fill="currentColor" /> 開始
                                    </button>
                                  )}
                                  
                                  {/* Stop Button (If running) */}
                                  {alloc.status === 'running' && (
                                    <button onClick={() => handleStopAllocation(alloc)} className="flex items-center gap-1 bg-white text-red-500 px-3 py-1.5 rounded-lg font-bold hover:bg-red-50 shadow-sm">
                                      <Square size={16} fill="currentColor" /> 結束
                                    </button>
                                  )}

                                  {/* Remove / Cancel */}
                                  {alloc.status !== 'done' && (
                                     <button onClick={() => handleRemoveAllocationLogic(alloc)} className="text-sm opacity-50 hover:opacity-100 hover:text-red-600 px-2 transition-opacity">
                                       移除
                                     </button>
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