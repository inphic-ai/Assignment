import React, { useState } from 'react';
import { 
  X, Wand2, Loader2, Plus, ArrowRight, ArrowLeft, Check, 
  User as UserIcon, UsersRound, Zap, Sun, Briefcase, Edit3,
  LayoutGrid, Users, Target, Clock, Grid2X2, UserPlus, Search, ChevronUp,
  FolderKanban, Sparkles, ListChecks, MessageSquare, Paperclip, ImageIcon,
  ShieldAlert, Upload, FileText
} from 'lucide-react';
import { TimeType, RoleType, GoalCategory, Task, Project, User } from '~/types';
import { INITIAL_GOALS, generateId } from '~/constants';
import { breakdownProjectTask, BreakdownResult } from '~/services/geminiService';

interface CreateTaskModalProps {
  users: User[]; 
  currentUser: User;
  projects: Project[];
  onClose: () => void;
  onCreate: (tasks: Partial<Task>[], project?: Partial<Project>) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ users, currentUser, projects, onClose, onCreate }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<RoleType>('created_by_me');
  const [assigneeId, setAssigneeId] = useState<string>(currentUser.id); 
  const [mode, setMode] = useState<TimeType | 'project'>('misc');
  
  // Form Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [riskHint, setRiskHint] = useState(''); // 新增風險預評估欄位
  const [goal, setGoal] = useState<GoalCategory>('行政');
  const [timeValue, setTimeValue] = useState<number>(30); 
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // AI / Sub-task Data
  const [aiDrafts, setAiDrafts] = useState<BreakdownResult[]>([]);

  const handleNext = async () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      if (mode === 'project') {
        handleAiBreakdown();
      } else {
        handleSubmitSingle();
      }
    }
  };

  const handleAiBreakdown = async () => {
    if (!title.trim() || !description.trim()) return alert("請輸入標題與『任務描述』以便 AI 拆解");
    setLoading(true);
    try {
      const drafts = await breakdownProjectTask(description);
      setAiDrafts(drafts);
      setStep(4);
    } catch (e) {
      alert("AI 拆解服務暫時不可用，請手動輸入或稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSingle = () => {
    if (!title.trim()) return alert("請輸入戰略標題");
    
    const now = new Date();
    const due = new Date(now);
    if (mode === 'misc') due.setMinutes(due.getMinutes() + timeValue);
    if (mode === 'daily') due.setHours(23, 59, 59);
    if (mode === 'long' || mode === 'project') due.setDate(due.getDate() + timeValue);

    onCreate([{
      title, description, 
      timeType: mode === 'project' ? 'long' : mode as TimeType, 
      timeValue, goal, role,
      projectId: selectedProjectId,
      assigneeId: role === 'assigned_by_me' ? assigneeId : currentUser.id,
      collaboratorIds: [], creatorId: currentUser.id, status: 'todo',
      startAt: now.toISOString(), dueAt: due.toISOString(), orderDaily: 0,
      aiRiskHint: riskHint || undefined // 保存手動輸入的風險
    }]);
    onClose();
  };

  const handleSubmitBatch = () => {
    const tasks: Partial<Task>[] = aiDrafts.map((draft, idx) => {
      const now = new Date();
      const due = new Date(now);
      if (draft.suggestedType === 'misc') due.setMinutes(due.getMinutes() + draft.suggestedValue);
      if (draft.suggestedType === 'daily') due.setHours(23, 59, 59);
      if (draft.suggestedType === 'long') due.setDate(due.getDate() + draft.suggestedValue);

      return {
        title: draft.title,
        description: draft.description,
        timeType: draft.suggestedType as TimeType,
        timeValue: draft.suggestedValue,
        goal: draft.suggestedGoal as GoalCategory,
        role,
        projectId: selectedProjectId,
        assigneeId: role === 'assigned_by_me' ? assigneeId : currentUser.id,
        collaboratorIds: [],
        creatorId: currentUser.id,
        status: 'todo',
        startAt: now.toISOString(),
        dueAt: due.toISOString(),
        orderDaily: idx
      };
    });
    onCreate(tasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-100 animate-in zoom-in-95 duration-500">
        
        <div className="px-10 py-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/50">
          <button onClick={step > 1 ? () => setStep(step - 1) : onClose} className="text-[10px] font-black text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 uppercase tracking-[0.2em]">
            <ArrowLeft size={16} /> BACK
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-sm font-black text-stone-800 tracking-tight uppercase">戰略任務部署</h2>
            <div className="flex gap-1.5 mt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-stone-900' : 'w-2 bg-stone-200'}`}></div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-300 transition-all"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 px-1"><Users size={22} className="text-orange-500" /><h3 className="text-lg font-black text-stone-800">指派權限層級</h3></div>
              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => { setRole('created_by_me'); setAssigneeId(currentUser.id); }} className={`p-8 rounded-[2.5rem] border-2 text-left transition-all ${role === 'created_by_me' ? 'border-orange-500 bg-orange-50/20 shadow-xl' : 'border-stone-50 bg-stone-50/50 hover:border-stone-200'}`}><UserIcon size={32} className={role === 'created_by_me' ? 'text-orange-600' : 'text-stone-300'} /><div className="mt-4 font-black text-xl text-stone-800">親自執行</div><p className="text-xs text-stone-400 mt-1 font-medium">部署至個人戰略軸</p></button>
                <button onClick={() => setRole('assigned_by_me')} className={`p-8 rounded-[2.5rem] border-2 text-left transition-all ${role === 'assigned_by_me' ? 'border-orange-500 bg-orange-50/20 shadow-xl' : 'border-stone-50 bg-stone-50/50 hover:border-stone-200'}`}><UsersRound size={32} className={role === 'assigned_by_me' ? 'text-orange-600' : 'text-stone-300'} /><div className="mt-4 font-black text-xl text-stone-800">下達指令</div><p className="text-xs text-stone-400 mt-1 font-medium">推送至隊員任務單</p></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 px-1"><Clock size={22} className="text-orange-500" /><h3 className="text-lg font-black text-stone-800">選擇任務維度</h3></div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'misc', label: '零碎雜事', desc: '分鐘級計算 (<60m)', icon: Zap, color: 'text-emerald-500' },
                  { id: 'daily', label: '今日事', desc: '小時級執行 (1-8h)', icon: Sun, color: 'text-blue-500' },
                  { id: 'long', label: '單項任務', desc: '天數級目標 (>1d)', icon: Briefcase, color: 'text-purple-500' },
                  { id: 'project', label: '案子聚合', desc: 'AI 自動拆解子細項', icon: Wand2, color: 'text-orange-500' }
                ].map((m) => (
                  <button key={m.id} onClick={() => setMode(m.id as any)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${mode === m.id ? 'border-orange-500 bg-orange-50/20 shadow-lg' : 'border-stone-50 bg-stone-50/50 hover:border-stone-200'}`}><m.icon size={28} className={mode === m.id ? m.color : 'text-stone-300'} /><div className="mt-3 font-black text-lg text-stone-800">{m.label}</div><p className="text-[11px] text-stone-400 font-medium leading-tight">{m.desc}</p></button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 block">戰略標題 (Required)</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder={mode === 'project' ? "輸入案子名稱..." : "任務標題..."} className="w-full p-6 bg-stone-50 border border-stone-100 rounded-[1.5rem] outline-none font-bold text-stone-800 focus:bg-white focus:ring-4 focus:ring-orange-50 transition-all text-xl" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      {/* Added FileText icon from lucide-react */}
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 block flex items-center gap-2"><FileText size={12} /> 核心內容描述</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="具體執行細項..." className="w-full p-5 bg-stone-50 border border-stone-100 rounded-[1.5rem] outline-none font-medium text-stone-600 focus:bg-white transition-all h-[180px] resize-none leading-relaxed" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-red-400 uppercase tracking-widest px-2 block flex items-center gap-2"><ShieldAlert size={12} /> 預判戰術風險 (Risk)</label>
                      <textarea value={riskHint} onChange={e => setRiskHint(e.target.value)} placeholder="輸入此任務可能的潛在瓶頸、困難點或風險預警..." className="w-full p-5 bg-red-50/20 border border-red-100 rounded-[1.5rem] outline-none font-medium text-red-800/70 focus:bg-white transition-all h-[180px] resize-none leading-relaxed italic" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 block">戰術附件資產</label>
                   <div className="w-full p-8 border-2 border-dashed border-stone-100 rounded-[2rem] flex flex-col items-center justify-center group hover:border-orange-500 hover:bg-orange-50/20 transition-all cursor-pointer shadow-inner">
                      <Upload size={24} className="text-stone-300 group-hover:text-orange-500 mb-2 transition-transform group-hover:scale-110" />
                      <p className="text-xs font-bold text-stone-500 group-hover:text-orange-600">點擊上傳戰略影像或文件</p>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-stone-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 block">目標戰略分類</label>
                  <select value={goal} onChange={e => setGoal(e.target.value as any)} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-700 outline-none cursor-pointer">
                    {INITIAL_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 block">歸屬專案群組</label>
                  <select value={selectedProjectId || ''} onChange={e => setSelectedProjectId(e.target.value || null)} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-700 outline-none cursor-pointer">
                    <option value="">-- 無分類 --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {mode !== 'project' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 block">投入預算 ({mode === 'misc' ? '分鐘' : mode === 'daily' ? '小時' : '天數'})</label>
                  <input type="number" value={timeValue} onChange={e => setTimeValue(Number(e.target.value))} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-stone-800 text-lg" />
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <ListChecks size={22} className="text-orange-500" />
                    <h3 className="text-lg font-black text-stone-800">AI 戰略拆解預覽</h3>
                  </div>
                  <span className="text-[10px] font-black bg-stone-900 text-amber-400 px-4 py-1.5 rounded-full uppercase tracking-widest">
                    共計 {aiDrafts.length} 項單元
                  </span>
               </div>
               
               <div className="space-y-4">
                  {aiDrafts.map((draft, idx) => (
                    <div key={idx} className="p-6 bg-stone-50/50 border border-stone-100 rounded-[2rem] flex flex-col gap-3 group hover:bg-white hover:border-orange-200 transition-all hover:shadow-lg">
                       <div className="flex justify-between items-start">
                          <input className="font-black text-stone-800 bg-transparent outline-none flex-1 truncate text-lg" value={draft.title} onChange={(e) => { const next = [...aiDrafts]; next[idx].title = e.target.value; setAiDrafts(next); }} />
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            <span className="px-3 py-1 bg-white border border-stone-100 text-[10px] font-black rounded-lg uppercase text-stone-400">{draft.suggestedGoal}</span>
                            <span className="text-xs font-mono font-black text-stone-900 bg-white px-2 py-1 rounded shadow-sm">{draft.suggestedValue}{draft.suggestedType === 'misc' ? 'm' : draft.suggestedType === 'daily' ? 'h' : 'd'}</span>
                          </div>
                       </div>
                       <textarea className="text-xs text-stone-500 bg-transparent outline-none resize-none h-12 leading-relaxed" value={draft.description} onChange={(e) => { const next = [...aiDrafts]; next[idx].description = e.target.value; setAiDrafts(next); }} />
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="px-10 py-8 border-t border-stone-50 bg-stone-50/30 flex gap-6 shrink-0">
           <button onClick={onClose} className="flex-1 py-5 text-sm font-black text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-[0.2em]">Cancel</button>
           <button 
             onClick={step === 4 ? handleSubmitBatch : (step === 3 && mode !== 'project' ? handleSubmitSingle : handleNext)} 
             disabled={loading} 
             className="flex-[2] bg-stone-900 text-white py-5 rounded-[1.5rem] font-black text-sm tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
           >
             {loading ? <Loader2 size={20} className="animate-spin" /> : (step >= 3 ? <Check size={20} /> : <ArrowRight size={20} />)}
             {step === 4 ? "確認並部署案子單元" : (step === 3 && mode !== 'project' ? "啟動戰略任務" : (step === 3 ? "分析並拆解細項" : "下一步 NEXT"))}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;