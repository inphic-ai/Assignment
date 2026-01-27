import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Paperclip, CheckCircle2, 
  FileText, ImageIcon, Trash2, History, Zap, Play, 
  Users, Activity, PenTool, Lightbulb, Target, Award,
  Hash, Info, Briefcase, Sun, Plus, Camera, Eye,
  Maximize2, ChevronRight, MessageSquare, Upload, ShieldAlert, AlertTriangle, Save,
  TimerOff, CircleAlert
} from 'lucide-react';
import { Task, User, LogEntry, TaskAllocation, Attachment } from '~/types';

interface TaskDetailModalProps {
  task: Task;
  users: User[];
  currentUser: User;
  logs: LogEntry[]; 
  allocations: TaskAllocation[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onConvertToKnowledge: (task: Task) => void;
  onDelete: (id: string) => void;
  onNavigateToTimeline: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, users, currentUser, logs, allocations = [], onClose, onUpdate, onDelete, onNavigateToTimeline 
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  
  const [localDescription, setLocalDescription] = useState(task.description || '');
  const [localRiskHint, setLocalRiskHint] = useState(task.aiRiskHint || '');
  const [localRemarks, setLocalRemarks] = useState(task.remarks || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = localDescription !== (task.description || '') || 
                    localRiskHint !== (task.aiRiskHint || '') ||
                    localRemarks !== (task.remarks || '');
    setHasChanges(changed);
  }, [localDescription, localRiskHint, localRemarks, task]);

  const handleSave = () => {
    onUpdate(task.id, {
      description: localDescription,
      aiRiskHint: localRiskHint,
      remarks: localRemarks
    });
    setHasChanges(false);
    alert("戰略修改已保存");
  };

  const isDone = task.status === 'done';
  const assignee = users.find(u => u.id === task.assigneeId);
  const isCreator = task.creatorId === currentUser.id;
  const isAssignee = task.assigneeId === currentUser.id;

  const imageAttachments = task.attachments?.filter(a => a.type === 'image') || [];

  const getTimeConfig = () => {
    switch (task.timeType) {
      case 'misc': return { label: '雜事維度', unit: '分鐘計算', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'daily': return { label: '今日事維度', unit: '小時計算', icon: Sun, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'long': return { label: '任務維度', unit: '以天計算', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50' };
      default: return { label: '案子聚合', unit: '混合計算', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' };
    }
  };

  const config = getTimeConfig();

  // 計算實際總耗時 (分鐘)
  const actualTotalMinutes = Math.round(allocations.filter(a => a.taskId === task.id).reduce((sum, a) => sum + a.accumulatedSeconds, 0) / 60);
  
  // 計算預算耗時 (分鐘)
  const budgetMinutes = task.timeType === 'misc' ? task.timeValue : task.timeType === 'daily' ? task.timeValue * 60 : task.timeValue * 8 * 60;
  const isOverrun = actualTotalMinutes > budgetMinutes;

  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col border border-stone-100 animate-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="px-16 py-12 border-b border-stone-50 flex justify-between items-center bg-white shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${isDone ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                {task.status} STATUS
              </span>
              {isOverrun && isDone && (
                <span className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-lg shadow-red-100 animate-pulse">
                   <TimerOff size={12} /> 超時執行 OVERRUN
                </span>
              )}
              <div className="w-1.5 h-1.5 rounded-full bg-stone-200"></div>
              <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">DNA: {task.id.split('-').pop()}</span>
            </div>
            <h2 className="text-5xl font-black text-stone-900 tracking-tight italic leading-tight">{task.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            {hasChanges && (
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-stone-900 rounded-2xl font-black text-xs tracking-widest shadow-lg animate-bounce">
                <Save size={16} /> 儲存目前修改
              </button>
            )}
            <button onClick={onClose} className="p-4 hover:bg-stone-50 rounded-full text-stone-300 hover:text-stone-900 transition-all">
              <X size={36} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Area */}
          <div className="w-[340px] bg-stone-50 border-r border-stone-100 p-10 space-y-10 overflow-y-auto hidden lg:block custom-scrollbar">
            <section className="space-y-4">
              <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] block px-1">執行人員</label>
              <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-lg">
                  {assignee?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-stone-800">{assignee?.name}</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase">{assignee?.department || '核心部隊'}</p>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6 relative overflow-hidden">
               <div className="space-y-4 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">時間維度</p>
                    <div className="flex items-center gap-2">
                       <config.icon size={16} className={config.color} />
                       <span className={`text-sm font-black italic ${config.color}`}>{config.label}</span>
                    </div>
                  </div>
                  <div className="h-px bg-stone-50"></div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-stone-300 uppercase">預算投入</p>
                       <p className="text-2xl font-mono font-black text-stone-800">{task.timeValue} <span className="text-xs text-stone-400 not-italic font-bold">{config.unit}</span></p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-stone-300 uppercase">戰略目標</p>
                       <p className="text-lg font-black text-stone-700 italic">{task.goal}</p>
                    </div>
                  </div>
               </div>
               <div className={`absolute -right-6 -bottom-6 opacity-10 ${config.color}`}><Target size={100} /></div>
            </section>

            {isOverrun && isDone && (
              <section className="bg-red-900 p-8 rounded-[2.5rem] shadow-xl space-y-4 relative overflow-hidden group">
                 <div className="relative z-10 space-y-2">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <AlertTriangle size={14}/> 超時核心指標
                    </p>
                    <div className="flex items-baseline gap-2">
                       <p className="text-4xl font-mono font-black text-white italic">+{actualTotalMinutes - budgetMinutes}</p>
                       <p className="text-xs text-red-300 font-bold">min</p>
                    </div>
                    <p className="text-[9px] text-red-200/50 font-bold leading-relaxed">此項單元執行效率低於預期，建議主管查閱下方詳細報告。</p>
                 </div>
                 <div className="absolute -right-4 -bottom-4 text-white opacity-5 rotate-12 group-hover:scale-110 transition-transform"><TimerOff size={120} /></div>
              </section>
            )}
          </div>

          {/* Main Content Area (Right Panel) */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
             {/* Tab Switcher */}
             <div className="flex border-b border-stone-100 px-12 pt-8 gap-12 shrink-0 bg-white z-10">
               {[
                 { id: 'details', label: '戰略詳情與風險', icon: FileText }, 
                 { id: 'history', label: '行動日誌軌跡', icon: Activity }
               ].map(tab => (
                 <button 
                   key={tab.id} 
                   onClick={() => setActiveTab(tab.id as any)} 
                   className={`pb-6 px-1 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === tab.id ? 'border-amber-500 text-stone-900' : 'border-transparent text-stone-300 hover:text-stone-500'}`}
                 >
                   <tab.icon size={18} />{tab.label}
                 </button>
               ))}
             </div>

             <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-white">
                {activeTab === 'details' && (
                  <div className="space-y-14 animate-in fade-in slide-in-from-bottom-2 duration-500">
                     
                     {/* --- 超時原因展示 (僅在有原因時顯示) --- */}
                     {task.submission?.overrunReason && (
                       <section className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100">
                                <TimerOff size={20} />
                             </div>
                             <div>
                                <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-red-600 italic">★ 戰略超時深度報告 (稽核重點)</h4>
                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Overrun Explanation for Management</p>
                             </div>
                          </div>
                          <div className="p-10 bg-red-50 border border-red-100 rounded-[2.5rem] relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-red-600"><ShieldAlert size={100} /></div>
                             <p className="text-red-900 text-xl font-black leading-relaxed italic relative z-10">
                                「 {task.submission.overrunReason} 」
                             </p>
                             <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest relative z-10">
                                <Activity size={12} /> 已記錄至資源調度歷史紀錄
                             </div>
                          </div>
                       </section>
                     )}

                     <section className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500">
                              <Info size={20} />
                           </div>
                           <div>
                              <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-stone-800">① 核心任務戰略描述</h4>
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Core Tactical Description</p>
                           </div>
                        </div>
                        <div className="relative group">
                           <textarea 
                              value={localDescription}
                              onChange={(e) => setLocalDescription(e.target.value)}
                              placeholder="請輸入任務詳細內容與具體要求..."
                              className="w-full p-10 bg-stone-50 border border-stone-100 rounded-[2.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-stone-100 transition-all font-medium text-stone-800 text-2xl leading-relaxed italic min-h-[220px] resize-none"
                           />
                           <div className="absolute top-6 right-8 text-stone-200 group-focus-within:text-orange-200 transition-colors">
                              <PenTool size={24} />
                           </div>
                        </div>
                     </section>

                     <section className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                              <ShieldAlert size={20} />
                           </div>
                           <div>
                              <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-red-600">② 戰術風險預警 (瓶頸預判)</h4>
                              <p className="text-[10px] text-red-300 font-bold uppercase tracking-widest">Risk Assessment & Critical Bottlenecks</p>
                           </div>
                        </div>
                        <div className="relative group">
                           <textarea 
                              value={localRiskHint}
                              onChange={(e) => setLocalRiskHint(e.target.value)}
                              placeholder="輸入此任務可能的潛在瓶頸..."
                              className="w-full p-10 bg-red-50/20 border border-red-100/50 rounded-[2.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-red-100 transition-all font-black text-red-900 text-2xl leading-relaxed italic min-h-[180px] resize-none placeholder:text-red-200"
                           />
                        </div>
                     </section>

                     <section className="space-y-8 pt-8">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-stone-800">
                              <Camera size={18} /> 戰略影像存檔
                           </h4>
                        </div>
                        {imageAttachments.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                             {imageAttachments.map((img) => (
                               <div key={img.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-stone-100 border-2 border-stone-50 hover:shadow-lg transition-all cursor-pointer">
                                  <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                  <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                                     <Eye size={24} />
                                     <span className="text-[10px] font-bold uppercase">VIEW</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                        ) : (
                          <div className="p-16 border-2 border-dashed border-stone-100 rounded-[3rem] flex flex-col items-center justify-center text-stone-200 group hover:border-orange-200 cursor-pointer transition-all">
                             <ImageIcon size={48} strokeWidth={1} className="mb-4 opacity-30 group-hover:text-orange-500" />
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:text-orange-600">目前尚無同步影像資產</p>
                          </div>
                        )}
                     </section>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                     <div className="flex items-center justify-between p-10 bg-stone-50 rounded-[3rem] border border-stone-100">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-stone-300 shadow-sm"><Activity size={32} /></div>
                           <div>
                              <p className="text-stone-900 font-black text-lg uppercase tracking-widest italic">實戰工時累計</p>
                              <p className="text-[11px] text-stone-400 font-bold uppercase">Active duration aggregation</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={`text-6xl font-mono font-black italic tracking-tighter ${isOverrun ? 'text-red-500' : 'text-stone-900'}`}>
                             {actualTotalMinutes}
                           </p>
                           <p className="text-[11px] text-stone-400 font-black uppercase tracking-widest">Minutes</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {allocations.filter(a => a.taskId === task.id).map(a => (
                          <div key={a.id} className={`flex justify-between items-center p-8 bg-white border ${a.status === 'overrun' ? 'border-red-100 bg-red-50/10' : 'border-stone-100'} rounded-[2.5rem] hover:shadow-lg transition-all`}>
                             <div className="flex items-center gap-6">
                                <Clock size={20} className={a.status === 'overrun' ? 'text-red-300' : 'text-stone-300'} />
                                <div>
                                   <span className={`text-lg font-black italic ${a.status === 'overrun' ? 'text-red-800' : 'text-stone-800'}`}>{a.date}</span>
                                   <span className="text-[10px] text-stone-400 block font-bold uppercase">Start @ {a.startTime}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-8">
                                <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase ${a.status === 'done' ? 'bg-emerald-50 text-emerald-600' : a.status === 'overrun' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-orange-50 text-orange-600'}`}>
                                  {a.status}
                                </span>
                                <span className={`text-2xl font-mono font-black italic ${a.status === 'overrun' ? 'text-red-600' : 'text-stone-800'}`}>{Math.round(a.accumulatedSeconds / 60)}m</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>

             {/* Footer Actions */}
             <div className="px-12 py-10 border-t border-stone-50 flex justify-between items-center bg-stone-50/30 shrink-0 z-10">
                <div>
                   {isCreator && (
                     <button onClick={() => { if(confirm('確定永久刪除此項戰略單元嗎？')) { onDelete(task.id); onClose(); } }} className="w-14 h-14 rounded-2xl border-2 border-stone-200 flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={24} />
                     </button>
                   )}
                </div>
                <div className="flex gap-4">
                   {!isDone && isAssignee && (
                     <button onClick={() => { onNavigateToTimeline(); onClose(); }} className="px-12 py-5 bg-orange-500 text-white rounded-[1.5rem] font-black text-sm tracking-widest shadow-2xl hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-3">
                        <Play size={18} fill="currentColor" /> 啟動專注作戰引擎
                     </button>
                   )}
                   <button onClick={onClose} className="px-14 py-5 bg-stone-900 text-white rounded-[1.5rem] font-black text-sm tracking-widest shadow-xl hover:bg-stone-800 active:scale-95 transition-all">
                      關閉詳情 CLOSE
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;