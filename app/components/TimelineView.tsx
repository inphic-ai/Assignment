import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, TaskAllocation, User, GoalCategory, TimeType, TaskStatus, TaskTemplate, RoutineTemplate, Attachment, RoutineStatus } from '../types';
import { 
  Clock, Zap, Briefcase, Plus, ChevronLeft, ChevronRight, 
  CalendarDays, Play, Square, Sparkles, X, 
  ArrowRight, Users, Search, 
  AlertTriangle, CheckCircle2, ListChecks, ShieldAlert,
  Info as InfoIcon, Activity, Pause,
  Repeat, PenTool, Lightbulb, Save, 
  ChevronUp, Tags, Terminal, StickyNote, Paperclip, UserPlus,
  Loader2, ExternalLink, Eye, Layout, ImageIcon, Maximize2, Sun,
  TimerOff
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface TimelineViewProps {
  tasks: Task[];
  routineTemplates: RoutineTemplate[];
  allocations: TaskAllocation[];
  currentUser: User;
  users: User[];
  viewingUserId: string;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onUpdateAllocation: (id: string, updates: Partial<TaskAllocation>) => void;
  onAddAllocation: (allocation: TaskAllocation) => void;
  onInstantiateRoutine: (template: RoutineTemplate) => Task;
  onUpdateRoutineTemplate?: (id: string, updates: Partial<RoutineTemplate>) => void; 
  onRemoveAllocation: (allocationId: string) => void;
  onSwitchUser: (userId: string) => void;
  onSelectTask: (task: Task) => void;
  taskTemplates: TaskTemplate[];
  onSaveTemplate: (task: Task) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ 
  tasks, routineTemplates = [], allocations, currentUser, users, viewingUserId,
  onUpdateTask, onUpdateAllocation, onAddAllocation, onInstantiateRoutine, onUpdateRoutineTemplate, onSwitchUser, onSelectTask,
  taskTemplates, onSaveTemplate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBriefing, setIsBriefing] = useState(false); 
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false); 
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false); 
  const [drawerTab, setDrawerTab] = useState<'general' | 'project' | 'routine'>('general');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeAllocId, setActiveAllocId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editCollaborators, setEditCollaborators] = useState<string[]>([]);
  const [editValue, setEditValue] = useState(30);
  const [editRemarks, setEditRemarks] = useState('');
  const [editRiskTags, setEditRiskTags] = useState('');
  
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [showDebriefing, setShowDebriefing] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [overrunReason, setOverrunReason] = useState(''); // 新增：超時原因狀態
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isSearchingRisk, setIsSearchingRisk] = useState(false);
  const [currentRiskHint, setCurrentRiskHint] = useState<string | null>(null);
  const [saveToKnowledge, setSaveToKnowledge] = useState(true);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTracking && !isPaused) {
      timerRef.current = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTracking, isPaused]);

  const drawerData = useMemo(() => {
    return {
      general: tasks.filter(t => !t.projectId && !t.fromRoutineId && t.status !== 'done' && t.assigneeId === currentUser.id),
      project: tasks.filter(t => !!t.projectId && !t.fromRoutineId && t.status !== 'done' && t.assigneeId === currentUser.id),
      routine: routineTemplates.filter(rt => (rt.status === 'active' || rt.status === 'completed') && rt.assigneeIds.includes(currentUser.id))
    };
  }, [tasks, routineTemplates, currentUser.id]);

  // 計算是否超時
  const isOverrun = useMemo(() => {
    if (!activeTask) return false;
    let budgetSeconds = 0;
    if (activeTask.timeType === 'misc') budgetSeconds = activeTask.timeValue * 60;
    else if (activeTask.timeType === 'daily') budgetSeconds = activeTask.timeValue * 3600;
    else budgetSeconds = activeTask.timeValue * 8 * 3600;
    return elapsedSeconds > budgetSeconds;
  }, [activeTask, elapsedSeconds]);

  const fetchRiskHint = async (task: Task) => {
    setIsSearchingRisk(true);
    setCurrentRiskHint(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `分析任務：「${task.title}」。請給出一條針對性的具體風險預警(30字內)。`,
      });
      setCurrentRiskHint(response.text || "保持專注即可。");
    } catch (e) { 
      setCurrentRiskHint("請確保目前環境適合專注工作。"); 
    } finally { 
      setIsSearchingRisk(false); 
    }
  };

  const handleSelectTaskFromDrawer = (t: Task) => {
    setActiveTask(t);
    setShowTaskDrawer(false);
    setEditTitle(t.title);
    setEditDesc(t.description);
    setEditAssignee(t.assigneeId);
    setEditCollaborators(t.collaboratorIds || []);
    setEditValue(t.timeValue);
    setEditRemarks(t.remarks || '');
    setEditRiskTags(t.aiTacticalTags?.join(', ') || '');
    setShowSetupModal(true); 
  };

  const handleSelectRoutine = (rt: RoutineTemplate) => {
    const newTask = onInstantiateRoutine(rt);
    handleSelectTaskFromDrawer(newTask);
  };

  const handleConfirmSetup = () => {
    if (!activeTask) return;
    const tags = editRiskTags.split(/[，, ]+/).filter(Boolean);
    const updates: Partial<Task> = {
      title: editTitle,
      description: editDesc,
      assigneeId: editAssignee,
      collaboratorIds: editCollaborators,
      timeValue: editValue,
      remarks: editRemarks,
      aiTacticalTags: tags,
      isConfirmed: true 
    };
    onUpdateTask(activeTask.id, updates);
    setShowSetupModal(false);
    setActiveTask({ ...activeTask, ...updates });
  };

  const handleStartTracking = () => {
    if (!activeTask) return;
    onUpdateTask(activeTask.id, { status: 'doing' });
    setIsBriefing(false);
    setIsTracking(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setOverrunReason('');
    const now = new Date();
    const allocId = `alloc-${Date.now()}`;
    setActiveAllocId(allocId);
    onAddAllocation({
      id: allocId, taskId: activeTask.id!, userId: currentUser.id, date: currentDate.toISOString().split('T')[0], 
      startTime: `${now.getHours().toString().padStart(2, '0')}:00`, durationMinutes: activeTask.timeValue, status: 'running', 
      actualStartAt: now.toISOString(), accumulatedSeconds: 0
    });
  };

  const handleFinalizeTask = async () => {
    if (!activeTask || !activeTask.id || !activeAllocId) return;
    setIsGeneratingTags(true);
    let tags: string[] = [];
    if (saveToKnowledge && insightText) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `提取 2 個戰術標籤：${insightText}`,
          config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
        });
        if (response.text) tags = JSON.parse(response.text);
      } catch (e) { console.error(e); }
    }
    onUpdateTask(activeTask.id, { 
      status: 'done', linkedKnowledgeId: saveToKnowledge ? `KNOW-${activeTask.id}` : undefined,
      aiTacticalTags: [...(activeTask.aiTacticalTags || []), ...tags], aiRiskHint: currentRiskHint || undefined,
      submission: { 
        summary: `於 ${new Date().toLocaleDateString()} 結案`, 
        problemSolved: insightText, 
        overrunReason: isOverrun ? overrunReason : undefined, // 保存超時原因
        submittedAt: new Date().toISOString(), 
        submittedBy: currentUser.id 
      }
    });
    
    if (activeTask.fromRoutineId) {
      onUpdateRoutineTemplate?.(activeTask.fromRoutineId, { status: 'completed' });
    }

    onUpdateAllocation(activeAllocId, { status: isOverrun ? 'overrun' : 'done', actualEndAt: new Date().toISOString(), accumulatedSeconds: elapsedSeconds });
    setIsTracking(false); setIsGeneratingTags(false); setShowDebriefing(false); setActiveTask(null); setInsightText(''); setCurrentRiskHint(null); setOverrunReason('');
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDimensionLabel = (type: TimeType) => {
    switch(type) {
      case 'misc': return { label: '雜事', icon: Zap, color: 'text-emerald-500', unit: '分' };
      case 'daily': return { label: '今日事', icon: Sun, color: 'text-blue-500', unit: '時' };
      case 'long': return { label: '任務', icon: Briefcase, color: 'text-purple-500', unit: '天' };
      default: return { label: '單元', icon: Activity, color: 'text-stone-400', unit: '' };
    }
  };

  const currentImageAttachments = activeTask?.attachments?.filter(a => a.type === 'image') || [];

  return (
    <div className="space-y-8 animate-in fade-in pb-32">
      {previewImageUrl && (
        <div className="fixed inset-0 z-[600] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-12 animate-in fade-in duration-300" onClick={() => setPreviewImageUrl(null)}>
           <button className="absolute top-10 right-10 p-5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"><X size={40}/></button>
           <img src={previewImageUrl} className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl animate-in zoom-in-95 duration-500" alt="Preview" />
        </div>
      )}

      {showSetupModal && activeTask && (
        <div className="fixed inset-0 z-[400] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
              <div className="p-10 border-b border-stone-100 bg-stone-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><ListChecks size={24} /></div>
                    <div><h2 className="text-2xl font-black text-stone-900 tracking-tight italic">任務戰略詳情設定</h2><p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">Tactical Configuration</p></div>
                 </div>
                 <button onClick={() => setShowSetupModal(false)} className="text-stone-300 hover:text-stone-900 transition-colors"><X size={32}/></button>
              </div>
              
              <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-10">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">任務細項說明 (可編輯)</label>
                          <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 focus:bg-white transition-all outline-none text-lg" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">任務內容描述</label>
                          <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} rows={5} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-medium text-stone-600 focus:bg-white transition-all outline-none resize-none leading-relaxed text-sm" />
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">主要執行人</label>
                             <select value={editAssignee} onChange={e=>setEditAssignee(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-700 outline-none">
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">預計投入 ({activeTask.timeType === 'misc' ? '分鐘' : activeTask.timeType === 'daily' ? '小時' : '天數'})</label>
                             <input type="number" value={editValue} onChange={e=>setEditValue(Number(e.target.value))} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 outline-none" />
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">協作成員</label>
                          <div className="flex flex-wrap gap-2 p-4 bg-stone-50 border border-stone-100 rounded-2xl min-h-[60px]">
                             {users.map(u => (
                               <button key={u.id} onClick={() => setEditCollaborators(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${editCollaborators.includes(u.id) ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100'}`}>{u.name}</button>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">戰術風險標籤</label>
                          <input value={editRiskTags} onChange={e=>setEditRiskTags(e.target.value)} placeholder="例如：環境嘈雜, 硬體不穩..." className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-400 text-sm outline-none" />
                       </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6 border-t border-stone-50">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1 flex items-center gap-2">
                          <Paperclip size={12}/> 影像資產檢視區域
                       </label>
                       
                       <div className="grid grid-cols-4 gap-4">
                          {currentImageAttachments.map(img => (
                             <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-stone-100 shadow-sm cursor-pointer" onClick={() => setPreviewImageUrl(img.url)}>
                                <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={img.name} />
                                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Maximize2 size={18} className="text-white" />
                                </div>
                             </div>
                          ))}
                          <div className="w-full aspect-square border-2 border-dashed border-stone-100 rounded-2xl flex flex-col items-center justify-center group hover:border-orange-500 hover:bg-orange-50/20 transition-all cursor-pointer">
                             <Plus size={20} className="text-stone-300 group-hover:text-orange-500 mb-1" />
                             <span className="text-[8px] font-black text-stone-300 uppercase group-hover:text-orange-600">UPLOAD</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">戰略備註 (選填)</label>
                       <textarea value={editRemarks} onChange={e=>setEditRemarks(e.target.value)} placeholder="額外的注意事項..." className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-medium text-stone-600 h-28 outline-none resize-none" />
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-stone-50 border-t border-stone-100 flex justify-end gap-6 shrink-0">
                 <button onClick={() => setShowSetupModal(false)} className="px-10 py-5 text-stone-400 font-black text-sm uppercase tracking-widest hover:text-stone-600 transition-colors">取消變更</button>
                 <button onClick={handleConfirmSetup} className="px-16 py-5 bg-stone-900 text-white rounded-[1.5rem] font-black text-sm tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <CheckCircle2 size={20} /> 確認並保存設定 CONFIRM
                 </button>
              </div>
           </div>
        </div>
      )}

      {showDebriefing && activeTask && (
        <div className="fixed inset-0 z-[500] bg-[#1c1917]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-700">
              <div className="p-10 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                 <div className="flex items-center gap-4"><div className={`w-12 h-12 ${isOverrun ? 'bg-red-500' : 'bg-orange-500'} rounded-2xl flex items-center justify-center text-white shadow-lg`}>{isOverrun ? <TimerOff size={24} /> : <CheckCircle2 size={24} strokeWidth={3} />}</div><div><h2 className="text-2xl font-black text-stone-900 tracking-tight">{isOverrun ? '戰略預算超支報告' : '任務結案：經驗提煉'}</h2><p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">{isOverrun ? 'Tactical Overrun Analysis' : 'Knowledge Sync'}</p></div></div>
              </div>
              <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 {isOverrun && (
                   <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] space-y-4 animate-pulse">
                      <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-[0.2em]"><ShieldAlert size={16}/> 強制性超時原因說明</div>
                      <p className="text-[11px] text-red-800/60 font-bold leading-relaxed italic">偵測到目前執行時長 ({formatTimer(elapsedSeconds)}) 已超出戰略預算。請說明超時原因，此報告將同步發送給主管以便優化未來資源分配。</p>
                      <textarea 
                        value={overrunReason}
                        onChange={e => setOverrunReason(e.target.value)}
                        placeholder="例如：忘記結束計時、遇到突發技術故障、被臨時會議中斷..."
                        className="w-full p-6 bg-white rounded-2xl border border-red-200 outline-none focus:ring-4 focus:ring-red-100 transition-all text-sm font-black text-red-900 italic"
                      />
                   </div>
                 )}

                 <div className="space-y-4"><div className="flex items-center gap-2 text-stone-800"><PenTool size={18} className="text-orange-500" /><h3 className="font-black text-sm uppercase tracking-wider">這次學到了什麼教訓？</h3></div><textarea value={insightText} onChange={e => setInsightText(e.target.value)} placeholder="描述避坑指南，AI 將據此生成標籤以供下次提示..." className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-100 outline-none focus:bg-white transition-all text-sm font-medium min-h-[160px] leading-relaxed" /></div>
                 <div className="flex items-center justify-between p-6 rounded-[2rem] bg-orange-50 border border-orange-100 group cursor-pointer" onClick={() => setSaveToKnowledge(!saveToKnowledge)}><div className="flex gap-4 items-center"><div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${saveToKnowledge ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-stone-300 border'}`}><Lightbulb size={20} /></div><div><p className="text-sm font-black text-stone-800">存入知識 DNA庫</p><p className="text-[10px] text-orange-600/70 font-bold font-mono uppercase tracking-tighter">AI Analysis Enabled</p></div></div><div className={`w-14 h-8 rounded-full p-1 transition-all ${saveToKnowledge ? 'bg-orange-500' : 'bg-stone-200'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all transform ${saveToKnowledge ? 'translate-x-6' : 'translate-x-0'}`} /></div></div>
              </div>
              <div className="p-10 bg-white border-t border-stone-50 flex gap-4">
                 <button onClick={() => { setShowDebriefing(false); setIsPaused(false); }} className="px-8 py-4 text-stone-400 font-bold text-sm hover:text-stone-800 transition-colors">取消</button>
                 <button 
                    onClick={handleFinalizeTask} 
                    disabled={insightText.length < 5 || isGeneratingTags || (isOverrun && overrunReason.length < 5)} 
                    className={`flex-1 ${isOverrun ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-900 hover:bg-orange-600'} text-white py-5 rounded-2xl font-black text-sm tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3`}
                  >
                    {isGeneratingTags ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isGeneratingTags ? "AI 正在分析..." : (isOverrun ? "提交超時報告並結案" : "結案並生成標籤")}
                  </button>
              </div>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4"><div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-2xl"><CalendarDays size={28} /></div><h1 className="text-3xl font-black text-stone-900 tracking-tight italic">戰略分配中心</h1></div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm"><button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(d); }} className="p-2 text-stone-400 hover:text-stone-900"><ChevronLeft size={20}/></button><span className="text-sm font-black text-stone-700 px-2">{currentDate.toLocaleDateString('zh-TW')}</span><button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(d); }} className="p-2 text-stone-400 hover:text-stone-900"><ChevronRight size={20}/></button></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
           <div className={`rounded-[3.5rem] border-2 shadow-sm transition-all duration-700 overflow-hidden min-h-[620px] flex flex-col ${isBriefing ? 'bg-stone-900 border-stone-800 shadow-2xl' : isTracking ? 'bg-white border-orange-500 ring-8 ring-orange-50' : 'bg-white border-stone-100'}`}>
              
              {isBriefing && activeTask?.isConfirmed ? (
                <div className="p-10 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-2">
                         <Terminal size={18} className="text-orange-500" />
                         <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Tactical Briefing 戰術簡報</span>
                      </div>
                      <button onClick={() => setIsBriefing(false)} className="text-stone-500 hover:text-white transition-colors"><X size={20} /></button>
                   </div>

                   <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500"/><span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">已確認戰略詳情</span></div>
                         <h2 className="text-3xl font-black text-white leading-tight italic">{activeTask.title}</h2>
                         <div className="flex gap-2">
                            <span className="px-3 py-1 bg-stone-800 text-stone-400 text-[10px] font-black rounded-lg border border-stone-700 uppercase tracking-widest">{activeTask.goal}</span>
                            <span className="px-3 py-1 bg-stone-800 text-orange-400 text-[10px] font-black rounded-lg border border-stone-700 uppercase tracking-widest">{activeTask.timeValue}{activeTask.timeType === 'misc' ? 'm' : activeTask.timeType === 'daily' ? 'h' : 'd'}</span>
                         </div>
                      </div>

                      <div className="p-6 bg-stone-800/40 border border-white/5 rounded-3xl space-y-3">
                         <div className="flex items-center gap-2 text-orange-500"><InfoIcon size={14} /><span className="text-[10px] font-black uppercase tracking-widest">任務詳情</span></div>
                         <p className="text-stone-400 text-xs leading-relaxed italic">「 {activeTask.description || '無詳細說明。'} 」</p>
                      </div>

                      <div className={`p-6 rounded-3xl border transition-all ${isSearchingRisk ? 'bg-stone-800 animate-pulse border-stone-700' : 'bg-red-500/10 border-red-500/20'}`}>
                         <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-red-500"><ShieldAlert size={14} /><span className="text-[10px] font-black uppercase tracking-widest">AI 風險評估</span></div>
                            {isSearchingRisk && <Loader2 size={12} className="animate-spin text-stone-500" />}
                         </div>
                         <p className="text-red-200/70 text-xs font-bold leading-relaxed italic">
                            {isSearchingRisk ? '掃描基因庫...' : (currentRiskHint || '已對齊目標，目前無明顯預警。')}
                         </p>
                      </div>
                   </div>

                   <button onClick={handleStartTracking} className="w-full mt-8 bg-orange-500 text-stone-900 py-6 rounded-2xl font-black text-sm tracking-[0.2em] shadow-2xl hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-3">
                      <Play size={18} fill="currentColor" /> 啟動專注按鈕 START
                   </button>
                </div>

              ) : isTracking && activeTask ? (
                <div className="p-10 flex-1 flex flex-col animate-in zoom-in-95 duration-500">
                   <div className="text-center space-y-12 py-4 flex-1 flex flex-col justify-center">
                      <div className="flex flex-col items-center">
                        <div className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border border-orange-100">
                          <Activity size={14} className="animate-pulse" /> 正在執行軌跡中
                        </div>
                        <h3 className="text-3xl font-black text-stone-900 mb-2 leading-tight px-6 italic">{activeTask?.title}</h3>
                      </div>
                      <div className={`text-8xl font-mono font-black tracking-tighter transition-all duration-500 ${isPaused ? 'text-stone-300 scale-95' : (isOverrun ? 'text-red-500 scale-105' : 'text-stone-900')}`}>{formatTimer(elapsedSeconds)}</div>
                      {isOverrun && (
                        <div className="text-red-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 justify-center animate-bounce">
                          <AlertTriangle size={14} /> 已超出預算時長 OVERRUN
                        </div>
                      )}
                      <div className="flex gap-4 mt-auto">
                        <button onClick={() => setIsPaused(!isPaused)} className={`flex-1 py-6 rounded-[1.5rem] font-black text-xs tracking-widest transition-all ${isPaused ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'bg-stone-50 text-stone-400 border border-stone-100 hover:bg-stone-100'}`}>{isPaused ? '繼續' : '暫停'}</button>
                        <button onClick={() => setShowDebriefing(true)} className={`flex-1 py-6 ${isOverrun ? 'bg-red-600' : 'bg-stone-900'} text-white rounded-[1.5rem] font-black text-xs tracking-widest shadow-2xl hover:bg-orange-600 transition-all active:scale-95`}>結案</button>
                      </div>
                   </div>
                </div>

              ) : (
                <div className="p-10 space-y-10 flex flex-col h-full">
                   <div className="flex flex-col flex-1">
                      <div className="space-y-4 mb-auto">
                        <div className="flex justify-between items-center px-1">
                           <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">選擇目標任務</h3>
                           {activeTask && (
                             <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${activeTask.isConfirmed ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                {activeTask.isConfirmed ? '已確認 / 可執行' : '待設定詳情'}
                             </span>
                           )}
                        </div>
                        
                        <div className="relative border-2 border-stone-100 rounded-3xl bg-stone-50 overflow-hidden transition-all focus-within:border-stone-800">
                           <button onClick={() => setShowTaskDrawer(!showTaskDrawer)} className="w-full p-6 text-left flex justify-between items-center group transition-colors hover:bg-white">
                              <div className="flex items-center gap-3">
                                 <Search size={18} className="text-stone-300 group-hover:text-stone-900" />
                                 <span className={`text-sm font-black truncate ${activeTask ? 'text-stone-900' : 'text-stone-400'}`}>{activeTask?.title || '點擊選擇目標任務...'}</span>
                              </div>
                              <ChevronUp size={18} className={`text-stone-300 transition-transform ${showTaskDrawer ? 'rotate-180' : ''}`} />
                           </button>
                           {showTaskDrawer && (
                             <div className="border-t border-stone-100 flex flex-col bg-white animate-in slide-in-from-top-4 max-h-[350px] overflow-y-auto custom-scrollbar">
                                <div className="flex bg-stone-50 border-b border-stone-100 p-1">
                                   <button onClick={()=>setDrawerTab('general')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${drawerTab==='general'?'bg-white text-stone-900 shadow-sm':'text-stone-400 hover:text-stone-600'}`}>一般</button>
                                   <button onClick={()=>setDrawerTab('project')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${drawerTab==='project'?'bg-white text-stone-900 shadow-sm':'text-stone-400 hover:text-stone-600'}`}>專案</button>
                                   <button onClick={()=>setDrawerTab('routine')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${drawerTab==='routine'?'bg-white text-stone-900 shadow-sm':'text-stone-400 hover:text-stone-600'}`}>例行</button>
                                </div>
                                <div className="p-2 space-y-1">
                                   {drawerTab === 'routine' ? (
                                      drawerData.routine.map(rt => (
                                        <div key={rt.id} className="w-full group/item flex items-center justify-between p-4 hover:bg-stone-50 border-b border-stone-50 rounded-xl transition-colors">
                                           <button onClick={() => handleSelectRoutine(rt)} className="flex-1 text-left flex flex-col">
                                              <div className="flex items-center gap-2">
                                                 <Repeat size={14} className="text-purple-400"/>
                                                 <span className="text-xs font-black text-stone-700">{rt.title}</span>
                                              </div>
                                              <span className="text-[9px] font-bold text-stone-300 mt-1 uppercase">例行模板 • 重複週期任務</span>
                                           </button>
                                        </div>
                                      ))
                                   ) : (
                                      drawerData[drawerTab].map(t => {
                                        const dim = getDimensionLabel(t.timeType);
                                        return (
                                          <div key={t.id} className="w-full group/item flex items-center justify-between p-4 hover:bg-stone-50 border-b border-stone-50 rounded-xl transition-colors">
                                            <button onClick={() => handleSelectTaskFromDrawer(t)} className="flex-1 text-left flex flex-col">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${dim.color.replace('text-', 'bg-')}`}/>
                                                <span className="text-xs font-black text-stone-700">{t.title}</span>
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <dim.icon size={10} className={dim.color} />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${dim.color}`}>
                                                  {dim.label}({dim.unit}) • 目標:{t.goal}
                                                </span>
                                              </div>
                                            </button>
                                          </div>
                                        );
                                      })
                                   )}
                                </div>
                             </div>
                           )}
                        </div>
                      </div>
                      
                      <div className="mt-12 bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] space-y-3 animate-in fade-in duration-700">
                         <div className="flex items-center gap-2 text-amber-600"><Sparkles size={16} fill="currentColor" /><h4 className="text-xs font-black tracking-widest uppercase">戰略中心指引</h4></div>
                         <p className="text-xs text-amber-800/70 font-medium leading-relaxed italic">「 雜事(分)、今日事(時)、任務(天)。例行事務請在專屬分頁中啟動，一般單元則在獨立清單中管理。 」</p>
                      </div>

                      <button 
                         onClick={() => {
                            if (!activeTask) return;
                            if (activeTask.isConfirmed) {
                               setIsBriefing(true);
                               fetchRiskHint(activeTask);
                            } else {
                               handleSelectTaskFromDrawer(activeTask);
                            }
                         }} 
                         disabled={!activeTask} 
                         className={`w-full mt-12 py-7 rounded-[2rem] font-black text-sm tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 group ${activeTask?.isConfirmed ? 'bg-stone-900 text-white hover:bg-orange-600' : 'bg-orange-50 text-stone-900 hover:bg-white hover:border-orange-500 border-2 border-transparent'}`}
                      >
                         {activeTask?.isConfirmed ? (
                           <>進入戰術簡報 BRIEFING <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                         ) : (
                           <>設定任務詳情 SETUP DETAILS <Plus size={20} /></>
                         )}
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[4rem] border border-stone-100 shadow-xl p-14 min-h-[700px]">
           <div className="space-y-12">
              {Array.from({ length: 10 }, (_, i) => 9 + i).map(hour => (
                <div key={hour} className="flex gap-12 min-h-[110px] group">
                  <div className="w-20 text-right pt-2 shrink-0"><span className="text-4xl font-mono font-black text-stone-100 group-hover:text-stone-300 transition-colors">{hour.toString().padStart(2, '0')}</span></div>
                  <div className="flex-1 border-t-2 border-stone-50 pt-8 relative group-hover:border-stone-100 transition-colors">
                     {allocations.filter(a => a.date === currentDate.toISOString().split('T')[0] && parseInt(a.startTime.split(':')[0]) === hour).map(a => (
                        <div key={a.id} onClick={() => { const t = tasks.find(task => task.id === a.taskId); if(t) onSelectTask(t); }} className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 flex justify-between items-center group/item hover:bg-white hover:shadow-2xl transition-all cursor-pointer">
                           <div className="flex items-center gap-5"><div className={`w-2 h-12 ${a.status === 'overrun' ? 'bg-red-500' : 'bg-orange-500'} rounded-full group-hover/item:h-16 transition-all`} /><div><span className="font-black text-stone-900 block text-lg">{tasks.find(t => t.id === a.taskId)?.title || "未知任務"}</span><span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{tasks.find(t => t.id === a.taskId)?.goal}</span></div></div>
                           <div className="text-right">
                              <span className={`text-xl font-mono font-black ${a.status === 'overrun' ? 'text-red-500' : 'text-stone-800'}`}>{Math.round(a.accumulatedSeconds / 60)}</span>
                              <span className="text-[10px] font-black text-stone-300 uppercase ml-1">min</span>
                              {a.status === 'overrun' && <span className="block text-[8px] font-black text-red-400 uppercase tracking-tighter mt-1">Budget Overrun</span>}
                           </div>
                        </div>
                     ))}
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;