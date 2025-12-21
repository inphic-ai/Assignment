import React, { useState, useRef } from 'react';
import { 
  X, Mic, Wand2, Loader2, Plus, ArrowRight, ArrowLeft, Check, 
  User as UserIcon, Youtube, Link as LinkIcon, Image as ImageIcon,
  Merge, Scissors, Square, CheckSquare, Trash2
} from 'lucide-react';
import { TimeType, RoleType, GoalCategory, Task, Project, User, Attachment } from '../types';
import { INITIAL_GOALS, generateId } from '../constants';
import { breakdownProjectTask, BreakdownResult } from '../services/geminiService';

interface CreateTaskModalProps {
  users: User[]; // Passed to select assignee
  currentUser: User;
  onClose: () => void;
  onCreate: (tasks: Partial<Task>[], project?: Partial<Project>) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ users, currentUser, onClose, onCreate }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<RoleType>('created_by_me');
  const [assigneeId, setAssigneeId] = useState<string>(currentUser.id); // Default to self
  const [mode, setMode] = useState<TimeType | 'project'>('misc');
  
  // Form Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<GoalCategory>('行政');
  const [timeValue, setTimeValue] = useState<number>(30); 
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pastedLink, setPastedLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Draft Data
  const [aiDrafts, setAiDrafts] = useState<BreakdownResult[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedDraftIndices, setSelectedDraftIndices] = useState<number[]>([]);

  const handleNext = async () => {
    if (step === 1) { // Role Selection
      setStep(2);
    } else if (step === 2) { // Type Selection
      setStep(3);
    } else if (step === 3 && mode === 'project') {
      // AI Breakdown
      setLoading(true);
      try {
        const drafts = await breakdownProjectTask(description);
        setAiDrafts(drafts);
        setProjectTitle(title || "新專案");
        setStep(4);
      } catch (e) {
        alert("AI 服務暫時無法使用，請檢查 API Key。");
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      // Direct Create
      handleSubmitSingle();
    }
  };

  // --- Draft Manipulation Logic ---

  const toggleDraftSelection = (index: number) => {
    setSelectedDraftIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleMergeDrafts = () => {
    if (selectedDraftIndices.length < 2) return;
    
    // Sort indices to process in order
    const indices = [...selectedDraftIndices].sort((a, b) => a - b);
    const itemsToMerge = indices.map(i => aiDrafts[i]);
    const firstItem = itemsToMerge[0];

    // Check if all have same time type for value summation
    const sameType = itemsToMerge.every(i => i.suggestedType === firstItem.suggestedType);
    const totalValue = sameType 
      ? itemsToMerge.reduce((acc, curr) => acc + curr.suggestedValue, 0)
      : firstItem.suggestedValue; // Default to first if types differ

    const mergedItem: BreakdownResult = {
      title: itemsToMerge.map(i => i.title).join(' + '),
      description: itemsToMerge.map(i => i.description).join('\n---\n'),
      suggestedType: firstItem.suggestedType,
      suggestedValue: totalValue,
      suggestedGoal: firstItem.suggestedGoal
    };

    // Construct new drafts array
    const newDrafts = aiDrafts.filter((_, idx) => !selectedDraftIndices.includes(idx));
    // Insert merged item at the position of the first selected item
    // We append it to the filtered list for simplicity in this MVP, or splice it in.
    // To keep order roughly correct, we can find the index of the first selected item in original array
    // effectively replacing the group with the merged one.
    // Simpler approach: Filter out selected, then insert `mergedItem` at `indices[0]` (adjusted for shifts).
    // Let's just create a new array rebuilding it.
    
    const rebuiltDrafts = [...aiDrafts];
    // Replace the first one with merged
    rebuiltDrafts[indices[0]] = mergedItem;
    // Remove the others (iterate backwards to avoid index shift issues)
    for (let i = indices.length - 1; i > 0; i--) {
      rebuiltDrafts.splice(indices[i], 1);
    }

    setAiDrafts(rebuiltDrafts);
    setSelectedDraftIndices([]); // Clear selection
  };

  const handleSplitDraft = () => {
    if (selectedDraftIndices.length !== 1) return;
    const index = selectedDraftIndices[0];
    const item = aiDrafts[index];

    // Split into 2 parts
    const part1: BreakdownResult = {
      ...item,
      title: `${item.title} (1)`,
      suggestedValue: Math.max(1, Math.floor(item.suggestedValue / 2)) // Simple logic
    };
    const part2: BreakdownResult = {
      ...item,
      title: `${item.title} (2)`,
      suggestedValue: Math.max(1, Math.ceil(item.suggestedValue / 2))
    };

    const newDrafts = [...aiDrafts];
    newDrafts.splice(index, 1, part1, part2);
    
    setAiDrafts(newDrafts);
    setSelectedDraftIndices([]);
  };

  const handleDeleteDraft = (index: number) => {
    setAiDrafts(prev => prev.filter((_, i) => i !== index));
    setSelectedDraftIndices(prev => prev.filter(i => i !== index));
  };

  // --- Attachment Logic ---
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        url: URL.createObjectURL(file), 
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        uploaderId: currentUser.id
      };
      setAttachments([...attachments, newAttachment]);
    }
  };

  const handleAddLink = () => {
    if (!pastedLink) return;
    
    let type: 'link' | 'youtube' = 'link';
    // Simple YouTube check
    if (pastedLink.includes('youtube.com') || pastedLink.includes('youtu.be')) {
      type = 'youtube';
    }

    const newAttachment: Attachment = {
      id: `link-${Date.now()}`,
      type,
      name: pastedLink, // For MVP, name is the URL
      url: pastedLink,
      uploadedAt: new Date().toISOString(),
      uploaderId: currentUser.id
    };
    setAttachments([...attachments, newAttachment]);
    setPastedLink('');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // 1. Files/Images
    if (e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      const newAttachment: Attachment = {
        id: `paste-${Date.now()}`,
        type: 'image',
        name: 'Pasted Image.png',
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploaderId: currentUser.id
      };
      setAttachments([...attachments, newAttachment]);
    } 
    // 2. Text (Potential Links) - handled by input focus usually, but catching here works too
  };

  // --- Submit Logic ---

  const handleSubmitSingle = () => {
    const now = new Date();
    const due = new Date(now);
    
    if (mode === 'misc') due.setMinutes(due.getMinutes() + timeValue);
    if (mode === 'daily') due.setHours(23, 59, 59);
    if (mode === 'long') due.setDate(due.getDate() + timeValue);

    const newTask: Partial<Task> = {
      title,
      description,
      timeType: mode as TimeType,
      timeValue,
      goal,
      role,
      assigneeId: role === 'assigned_by_me' ? assigneeId : currentUser.id,
      creatorId: currentUser.id,
      status: 'todo',
      startAt: now.toISOString(),
      dueAt: due.toISOString(),
      attachments: attachments,
      orderDaily: 0,
      projectId: null
    };
    onCreate([newTask]);
    onClose();
  };

  const handleSubmitProject = () => {
    const projectId = generateId('PJT');
    const newProject: Partial<Project> = {
      id: projectId,
      name: projectTitle,
      description: description,
      archived: false,
      projectOrder: 0
    };

    const tasks: Partial<Task>[] = aiDrafts.map((draft, idx) => {
      const now = new Date();
      const due = new Date(now);
      due.setDate(due.getDate() + 1); 

      return {
        title: draft.title,
        description: draft.description,
        timeType: draft.suggestedType,
        timeValue: draft.suggestedValue,
        goal: draft.suggestedGoal as GoalCategory,
        role: role,
        assigneeId: currentUser.id, // Project drafts default to creator initially
        creatorId: currentUser.id,
        projectId: projectId,
        status: 'todo',
        startAt: now.toISOString(),
        dueAt: due.toISOString(),
        orderInProject: idx
      };
    });

    onCreate(tasks, newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4" onPaste={handlePaste}>
      <div className="bg-stone-50 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-200 p-4 flex justify-between items-center border-b border-stone-300">
          <h2 className="text-xl font-bold text-stone-700">新建任務嚮導</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-300 rounded-full text-stone-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* STEP 1: ROLE */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-stone-800">權責歸屬？</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setRole('created_by_me'); setAssigneeId(currentUser.id); }}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${role === 'created_by_me' ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="block text-lg font-bold">我建立</span>
                  <span className="text-sm text-stone-500">這項任務由我親自執行。</span>
                </button>
                <button 
                  onClick={() => setRole('assigned_by_me')}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${role === 'assigned_by_me' ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="block text-lg font-bold">我指派</span>
                  <span className="text-sm text-stone-500">指派給團隊成員執行。</span>
                </button>
              </div>

              {role === 'assigned_by_me' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                   <label className="block text-sm font-bold text-stone-600 mb-2">指派給誰？</label>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {users.filter(u => u.id !== currentUser.id).map(u => (
                        <button 
                          key={u.id}
                          onClick={() => setAssigneeId(u.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${assigneeId === u.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${assigneeId === u.id ? 'bg-stone-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold">{u.name}</span>
                        </button>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: TYPE */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-stone-800">任務類型？</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'misc', label: '零碎工作', sub: '分鐘 (min)', color: 'bg-green-100 border-green-300' },
                  { id: 'daily', label: '當日工作', sub: '小時 (hr)', color: 'bg-blue-100 border-blue-300' },
                  { id: 'long', label: '長期任務', sub: '天 (day)', color: 'bg-purple-100 border-purple-300' },
                  { id: 'project', label: '專案工作', sub: 'AI 拆解', color: 'bg-stone-800 text-stone-50 border-stone-600', icon: Wand2 },
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => setMode(opt.id as any)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all h-32 ${mode === opt.id ? 'ring-2 ring-offset-2 ring-stone-400 scale-105' : 'opacity-70 hover:opacity-100'} ${opt.color}`}
                  >
                    {opt.icon && <opt.icon className="mb-2" size={24} />}
                    <span className="font-bold">{opt.label}</span>
                    <span className="text-xs opacity-80">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-semibold text-stone-800">
                {mode === 'project' ? '描述專案內容' : '任務詳情'}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">標題</label>
                <input 
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 outline-none bg-stone-50"
                  placeholder="例如：週報整理"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">描述</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 outline-none bg-stone-50 min-h-[100px]"
                  placeholder={mode === 'project' ? "請描述專案目標與交付項目..." : "詳細內容..."}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">目標分類</label>
                  <select 
                    value={goal} onChange={e => setGoal(e.target.value as GoalCategory)}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white"
                  >
                    {INITIAL_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {mode !== 'project' && (
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">
                      預期時間 ({mode === 'misc' ? '分' : mode === 'daily' ? '小時' : '天'})
                    </label>
                    <select 
                      value={timeValue} onChange={e => setTimeValue(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-stone-300 bg-white"
                    >
                      {mode === 'misc' && [5,10,15,30,45,60].map(v => <option key={v} value={v}>{v} 分</option>)}
                      {mode === 'daily' && [0.5,1,2,4,6,8].map(v => <option key={v} value={v}>{v} 時</option>)}
                      {mode === 'long' && [1,2,3,5,7].map(v => <option key={v} value={v}>{v} 天</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Enhanced Attachments Section */}
              {mode !== 'project' && (
                <div className="border border-stone-200 rounded-xl p-4 bg-white">
                  <label className="block text-sm font-bold text-stone-600 mb-2">附件 (圖片/檔案/連結)</label>
                  
                  {/* Link Input */}
                  <div className="flex gap-2 mb-3">
                     <input 
                       value={pastedLink}
                       onChange={e => setPastedLink(e.target.value)}
                       placeholder="貼上 YouTube 連結 或 雲端網址..."
                       className="flex-1 p-2 rounded-lg border border-stone-200 text-sm"
                     />
                     <button onClick={handleAddLink} className="bg-stone-100 px-3 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-200">
                       加入
                     </button>
                  </div>
                  
                  {/* File Upload Zone */}
                  <div 
                    className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center cursor-pointer hover:bg-stone-50 mb-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                     <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                     <p className="text-xs text-stone-400">點擊上傳 或 直接貼上截圖 (Ctrl+V)</p>
                  </div>

                  {/* Preview List */}
                  <div className="flex flex-wrap gap-2">
                     {attachments.map(att => (
                       <div key={att.id} className="bg-stone-100 rounded-lg p-2 flex items-center gap-2 max-w-[200px]">
                          {att.type === 'youtube' ? <Youtube size={14} className="text-red-500"/> : 
                           att.type === 'image' ? <ImageIcon size={14} className="text-blue-500"/> :
                           <LinkIcon size={14} className="text-stone-500"/>
                          }
                          <span className="text-xs truncate">{att.name}</span>
                          <button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} className="text-stone-400 hover:text-red-500">
                            <X size={12} />
                          </button>
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: AI REVIEW (Project Only) */}
          {step === 4 && mode === 'project' && (
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-stone-800">AI 任務拆解</h3>
                    <p className="text-xs text-stone-500">可多選進行合併，或單選進行拆分</p>
                  </div>
                  
                  {/* Operation Toolbar */}
                  <div className="flex gap-2">
                    {selectedDraftIndices.length >= 2 && (
                      <button 
                        onClick={handleMergeDrafts}
                        className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors"
                      >
                        <Merge size={14} /> 合併 ({selectedDraftIndices.length})
                      </button>
                    )}
                    {selectedDraftIndices.length === 1 && (
                      <button 
                        onClick={handleSplitDraft}
                        className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                      >
                        <Scissors size={14} /> 拆分
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {aiDrafts.map((draft, idx) => {
                    const isSelected = selectedDraftIndices.includes(idx);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleDraftSelection(idx)}
                        className={`p-3 rounded-xl border shadow-sm flex items-start gap-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300' 
                            : 'bg-white border-stone-200 hover:border-amber-200'
                        }`}
                      >
                        <div className={`mt-1 text-stone-400 ${isSelected ? 'text-amber-500' : ''}`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className={`font-semibold truncate ${isSelected ? 'text-amber-900' : 'text-stone-700'}`}>{draft.title}</h4>
                            <span className="text-xs uppercase tracking-wider font-medium text-stone-400 ml-2">{draft.suggestedType}</span>
                          </div>
                          <p className="text-xs text-stone-500 mb-1 line-clamp-2">{draft.description}</p>
                          <div className="flex gap-2 text-xs">
                             <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                               {draft.suggestedValue} {draft.suggestedType === 'misc' ? '分' : draft.suggestedType === 'daily' ? '時' : '天'}
                             </span>
                             <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                               {draft.suggestedGoal}
                             </span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteDraft(idx); }}
                          className="p-1 text-stone-300 hover:text-red-500 hover:bg-stone-100 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-4 flex justify-between items-center border-t border-stone-200">
           {step > 1 && (
             <button onClick={() => setStep(step - 1)} className="flex items-center text-stone-500 hover:text-stone-800">
               <ArrowLeft size={16} className="mr-1" /> 返回
             </button>
           )}
           <div className="flex-1"></div>
           <button 
             onClick={mode === 'project' && step === 4 ? handleSubmitProject : handleNext}
             disabled={loading || (step===3 && !title && mode !== 'project')}
             className="bg-stone-800 text-stone-50 px-6 py-3 rounded-xl font-medium hover:bg-stone-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-stone-300"
           >
             {loading && <Loader2 className="animate-spin mr-2" size={18} />}
             {step === 4 || (step === 3 && mode !== 'project') ? '建立任務' : '下一步'}
             {!loading && step < 3 && <ArrowRight size={18} className="ml-2" />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
