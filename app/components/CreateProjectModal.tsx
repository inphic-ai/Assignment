import React, { useState, useEffect } from 'react';
import { 
  X, Wand2, Loader2, Check, ArrowLeft, ArrowRight,
  Sparkles, FolderKanban, MessageSquare, ListChecks,
  ChevronRight, Users, User as UserIcon
} from 'lucide-react';
import { Task, Project, User, GoalCategory, TimeType } from '~/types';
import { breakdownProjectTask, BreakdownResult } from '~/services/geminiService';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (project: Partial<Project>, tasks: Partial<Task>[]) => void;
  currentUser: User;
  users: User[];
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreate, currentUser, users }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // 核心：AI 拆解結果擴展，新增指派人員狀態
  const [aiDrafts, setAiDrafts] = useState<(BreakdownResult & { assigneeId: string })[]>([]);

  const handleAiBreakdown = async () => {
    if (!name.trim() || !description.trim()) return alert("請輸入專案名稱與策略描述以便 AI 分析");
    setLoading(true);
    try {
      const drafts = await breakdownProjectTask(description);
      // 預設將所有子任務指派給當前使用者
      setAiDrafts(drafts.map(d => ({ ...d, assigneeId: currentUser.id })));
      setStep(2);
    } catch (e) {
      alert("AI 服務連線失敗，請檢查網路或稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignee = (idx: number, userId: string) => {
    const next = [...aiDrafts];
    next[idx].assigneeId = userId;
    setAiDrafts(next);
  };

  const handleSubmit = () => {
    if (!name.trim()) return alert("請輸入專案名稱");
    
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
        // 如果是發送給別人，Role 設為 assigned_by_me，發給自己則是 created_by_me
        role: draft.assigneeId === currentUser.id ? 'created_by_me' : 'assigned_by_me',
        assigneeId: draft.assigneeId,
        creatorId: currentUser.id,
        status: 'todo',
        startAt: now.toISOString(),
        dueAt: due.toISOString(),
        orderDaily: idx,
        orderInProject: idx
      };
    });

    onCreate({ name, description }, tasks);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-100 animate-in zoom-in-95 duration-500">
        
        <div className="px-10 py-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <FolderKanban size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight italic">部署新戰略案子</h2>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Strategic Asset Initialization</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-300 transition-all"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {step === 1 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">專案名稱</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="例如：2026 年度品牌升級計畫" 
                    className="w-full p-6 bg-stone-50 border border-stone-100 rounded-[1.5rem] outline-none font-bold text-stone-800 focus:bg-white focus:ring-4 focus:ring-orange-50 transition-all text-xl shadow-inner" 
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">戰略核心描述 (將用於 AI 拆解)</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="請描述此案子的背景、目標與預期成果。描述越詳細，AI 拆解出的子任務越精確..." 
                    className="w-full p-8 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none font-medium text-stone-600 focus:bg-white transition-all min-h-[250px] resize-none leading-relaxed shadow-inner" 
                  />
                  
                  <div className="absolute bottom-6 right-6">
                    <button 
                      onClick={handleAiBreakdown}
                      disabled={loading || !description.trim()}
                      className="bg-[#1c1917] text-amber-400 px-6 py-3 rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-2xl hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-30"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} fill="currentColor" />}
                      啟動 AI 戰略分析
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-[2rem] flex items-start gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <Wand2 size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-stone-800 mb-1 italic">AI 拆解提示</h4>
                    <p className="text-xs text-stone-500 leading-relaxed font-medium">使用分析功能，系統會自動將您的文字轉化為可執行的「雜事、今日事與任務」三種維度單元。</p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <ListChecks size={24} className="text-orange-500" />
                    <h3 className="text-xl font-black text-stone-800 tracking-tight">AI 戰略拆解預覽</h3>
                  </div>
                  <button onClick={() => setStep(1)} className="text-[10px] font-black text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest">重新調整描述</button>
               </div>

               <div className="space-y-4">
                  {aiDrafts.map((draft, idx) => (
                    <div key={idx} className="p-6 bg-stone-50/50 border border-stone-100 rounded-[2.5rem] flex items-center gap-6 group hover:bg-white hover:border-orange-200 transition-all hover:shadow-lg">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-orange-500 transition-colors shadow-sm">
                          {idx + 1}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <h4 className="font-black text-stone-800 truncate text-base mb-1">{draft.title}</h4>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-stone-100">{draft.suggestedGoal}</span>
                             <span className="text-xs font-mono font-black text-stone-900">{draft.suggestedValue}{draft.suggestedType === 'misc' ? 'm' : draft.suggestedType === 'daily' ? 'h' : 'd'}</span>
                          </div>
                       </div>

                       {/* 新增：人員指派選擇器 */}
                       <div className="shrink-0 flex flex-col items-end gap-1.5 border-l border-stone-100 pl-6">
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">指派人員</span>
                          <select 
                            value={draft.assigneeId}
                            onChange={(e) => handleUpdateAssignee(idx, e.target.value)}
                            className="bg-white border border-stone-100 rounded-xl px-3 py-1.5 text-[11px] font-black text-stone-700 outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer hover:border-stone-300 transition-all"
                          >
                             {users.map(u => (
                               <option key={u.id} value={u.id}>
                                 {u.name} ({u.role})
                               </option>
                             ))}
                          </select>
                       </div>
                    </div>
                  ))}
               </div>
               
               <p className="text-center text-[10px] font-bold text-stone-300 uppercase tracking-widest pt-4">點擊「部署」將同步建立專案並將任務推送到指定人員的清單中</p>
            </div>
          )}
        </div>

        <div className="px-10 py-8 border-t border-stone-50 bg-stone-50/30 flex gap-6 shrink-0">
           <button onClick={onClose} className="flex-1 py-5 text-sm font-black text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-[0.2em]">Cancel</button>
           <button 
             onClick={step === 2 ? handleSubmit : handleAiBreakdown} 
             disabled={loading || !name.trim()} 
             className="flex-[2] bg-stone-900 text-white py-5 rounded-[1.5rem] font-black text-sm tracking-[0.2em] shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
           >
             {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
             {step === 2 ? "立即部署專案與分派任務" : "分析並生成預覽"}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;