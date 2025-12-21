import React, { useState, useRef } from 'react';
import { 
  X, Calendar, Clock, Paperclip, Send, CheckCircle2, 
  AlertTriangle, User as UserIcon, Shield, FileText, 
  Image as ImageIcon, Link as LinkIcon, Download, Trash2, 
  BookOpen, Star, CalendarClock, History, ArrowRight, Zap, Play
} from 'lucide-react';
import { Task, User, GoalCategory, TimeType, Attachment, LogEntry, TaskAllocation } from '../types';
import { GOALS_REQUIRING_PROOF, formatDate } from '../constants';

interface TaskDetailModalProps {
  task: Task;
  users: User[];
  currentUser: User;
  logs: LogEntry[]; // Pass logs for history
  allocations: TaskAllocation[]; // Global allocations
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onConvertToKnowledge: (task: Task) => void;
  onDelete: (id: string) => void;
  onNavigateToTimeline: () => void; // Navigation handler
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, users, currentUser, logs, allocations = [], onClose, onUpdate, onConvertToKnowledge, onDelete, onNavigateToTimeline 
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'attachments' | 'history'>('details');
  const [editMode, setEditMode] = useState(false);
  
  // Editable Fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId);
  
  // Submission State
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState('');
  
  // Approval State
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [problemSolved, setProblemSolved] = useState('');

  // Attachment Mocking
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CALCULATIONS ---
  const todayDateStr = new Date().toISOString().split('T')[0];
  const taskAllocationsToday = allocations.filter(a => 
    a.taskId === task.id && a.date === todayDateStr
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalAllocatedToday = taskAllocationsToday.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  // --- PERMISSIONS LOGIC ---
  const isCreator = task.creatorId === currentUser.id;
  const isAssignee = task.assigneeId === currentUser.id;
  const isManagement = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Edit Permissions
  const canEditDetails = (isManagement || isAssignee) && task.status !== 'done' && task.status !== 'submitted';
  const canReassign = isManagement && task.status !== 'done';
  
  // Flow Permissions
  const canSubmit = isAssignee && (task.status === 'todo' || task.status === 'doing');
  const canApprove = isManagement && task.status === 'submitted';
  const canReopen = isManagement && task.status === 'done';

  // Deletion Rules
  const minutesSinceCreation = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60);
  const canDelete = isManagement 
    ? !task.linkedKnowledgeId // Admins can delete unless linked to Knowledge
    : (isCreator && minutesSinceCreation <= 15); // Users: within 15 mins

  // Validation Logic
  const needsProof = task.requireProof || GOALS_REQUIRING_PROOF.includes(task.goal) || task.timeType === 'long';
  const hasAttachments = task.attachments && task.attachments.length > 0;
  
  // --- HANDLERS ---

  const handleDeleteWithConfirmation = () => {
    if (!canDelete) return;

    if (isManagement) {
      // Hard delete check for Admin
      const confirmText = prompt(`警告：管理員刪除權限。\n請輸入 "${task.title}" 以確認刪除：`);
      if (confirmText === task.title) {
        onDelete(task.id);
        onClose();
      } else if (confirmText !== null) {
        alert("驗證文字不符，取消刪除。");
      }
    } else {
      // Simple confirm for User within 15 mins
      if (confirm("確定要刪除此任務嗎？(建立 15 分鐘內可刪除)")) {
        onDelete(task.id);
        onClose();
      }
    }
  };

  const handleSaveDetails = () => {
    onUpdate(task.id, { 
      title, 
      description, 
      assigneeId, 
    });
    setEditMode(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        url: URL.createObjectURL(file), // Mock URL
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        uploaderId: currentUser.id
      };
      onUpdate(task.id, { attachments: [...task.attachments, newAttachment] });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      // Handle pasted image
      const file = e.clipboardData.files[0];
      const newAttachment: Attachment = {
        id: `paste-${Date.now()}`,
        type: 'image',
        name: 'Pasted Image.png',
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploaderId: currentUser.id
      };
      onUpdate(task.id, { attachments: [...task.attachments, newAttachment] });
      setActiveTab('attachments');
    }
  };

  const handleSubmitTask = () => {
    if (needsProof && !hasAttachments) {
      alert("此任務類型需要上傳驗收附件才能送審 (維修/售後/倉儲/長期任務)。");
      setActiveTab('attachments');
      return;
    }
    if (!submissionSummary.trim()) {
      alert("請填寫完成摘要。");
      return;
    }

    onUpdate(task.id, {
      status: 'submitted',
      submission: {
        summary: submissionSummary,
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser.id
      }
    });
    setShowSubmitForm(false);
  };

  const handleConfirmApproval = () => {
    if (!problemSolved.trim()) {
      alert("請填寫「解決了什麼問題」，這將有助於知識庫搜尋。");
      return;
    }
    
    onUpdate(task.id, { 
      status: 'done',
      submission: {
        ...task.submission!,
        rating: rating,
        problemSolved: problemSolved,
        reviewedBy: currentUser.id,
        reviewedAt: new Date().toISOString()
      }
    });
    setShowApproveForm(false);
  };

  const handleReject = () => {
    const reason = prompt("請輸入退回原因：");
    if (reason) {
      onUpdate(task.id, { 
        status: 'doing',
        // In a real app, we'd add this to comments history
      });
    }
  };

  const handleDeleteAttachment = (attId: string) => {
    onUpdate(task.id, {
      attachments: task.attachments.filter(a => a.id !== attId)
    });
  };

  // --- RENDERERS ---

  const renderStatusBadge = () => {
    const styles = {
      todo: 'bg-stone-100 text-stone-600',
      doing: 'bg-orange-100 text-orange-700',
      submitted: 'bg-violet-100 text-violet-700',
      done: 'bg-emerald-100 text-emerald-700',
      archived: 'bg-stone-200 text-stone-400'
    };
    const labels = {
      todo: '待辦',
      doing: '進行中',
      submitted: '送審中',
      done: '已結案',
      archived: '已封存'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[task.status]}`}>
        {labels[task.status]}
      </span>
    );
  };

  const renderStars = (count: number) => (
    <div className="flex text-amber-400">
      {Array.from({length: 5}).map((_, i) => (
        <Star key={i} size={16} fill={i < count ? "currentColor" : "none"} strokeWidth={i < count ? 0 : 2} className={i < count ? "" : "text-stone-300"}/>
      ))}
    </div>
  );

  const renderTimeline = () => {
    const startDate = new Date(task.startAt);
    const dueDate = new Date(task.dueAt);
    const now = new Date();
    
    const startTs = startDate.getTime();
    const dueTs = dueDate.getTime();
    const nowTs = now.getTime();
    
    const totalDuration = dueTs - startTs;
    const duration = totalDuration > 0 ? totalDuration : 1; 
    
    const getPercent = (ts: number) => {
      return Math.min(100, Math.max(0, ((ts - startTs) / duration) * 100));
    };
    
    const nowPercent = getPercent(nowTs);
    
    let statusPercent = 0;
    if (task.status === 'done') statusPercent = 100;
    else if (task.status === 'submitted') statusPercent = 90;
    else if (task.status === 'doing') statusPercent = 50;
    
    return (
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 mb-6">
        <h3 className="text-sm font-bold text-stone-400 uppercase mb-4 flex items-center gap-2">
          <CalendarClock size={16} /> 任務時程與進度
        </h3>
        
        <div className="flex justify-between text-xs font-bold text-stone-500 mb-2">
          <span>{formatDate(task.startAt)}</span>
          <span className={nowTs > dueTs && task.status !== 'done' ? "text-red-500" : ""}>
             {formatDate(task.dueAt)} {nowTs > dueTs && task.status !== 'done' ? '(已逾期)' : ''}
          </span>
        </div>
        
        <div className="relative h-4 bg-stone-200 rounded-full w-full overflow-hidden mb-2">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-500 ${
              task.status === 'done' ? 'bg-emerald-500' :
              task.status === 'submitted' ? 'bg-violet-500' :
              task.status === 'doing' ? 'bg-orange-400' : 'bg-stone-300'
            }`}
            style={{ width: `${statusPercent}%` }}
          />
          
          {nowTs >= startTs && nowTs <= dueTs && task.status !== 'done' && (
             <div 
               className="absolute top-0 bottom-0 w-0.5 bg-stone-800 z-10"
               style={{ left: `${nowPercent}%` }}
             >
               <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-stone-800 rounded-full shadow border border-white" title="現在時間"></div>
             </div>
          )}
        </div>
        
        <div className="flex justify-between items-center text-xs">
           <span className="text-stone-400">Start</span>
           <span className="font-bold text-stone-600">
             {task.status === 'done' ? '已完成 100%' : 
              task.status === 'submitted' ? '審核中 90%' : 
              task.status === 'doing' ? '進行中 50%' : '待辦 0%'}
           </span>
           <span className="text-stone-400">Due</span>
        </div>
      </div>
    );
  };

  const renderTodaySlices = () => (
    <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 mb-6">
       <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-stone-400 uppercase flex items-center gap-2">
            <Zap size={16} /> 今日時間切片 (預覽)
          </h3>
          {totalAllocatedToday > 0 && (
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              共 {Math.round(totalAllocatedToday)} 分鐘
            </span>
          )}
       </div>

       <div className="space-y-3">
          {taskAllocationsToday.length > 0 ? (
            taskAllocationsToday.map(alloc => (
              <div key={alloc.id} className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      alloc.status === 'done' ? 'bg-stone-100 text-stone-400' :
                      alloc.status === 'running' ? 'bg-amber-100 text-amber-600 animate-pulse' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {alloc.startTime.split(':')[0]}
                    </div>
                    <div>
                       <div className="text-sm font-bold text-stone-700">{alloc.startTime}</div>
                       <div className="text-[10px] text-stone-400 font-bold">{Math.round(alloc.durationMinutes)} 分鐘</div>
                    </div>
                 </div>
                 <div className="text-xs font-bold px-2 py-1 rounded capitalize bg-stone-100 text-stone-500">
                    {alloc.status}
                 </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-stone-400 text-xs italic">
               今日尚未排程
            </div>
          )}
          
          <button 
            onClick={onNavigateToTimeline}
            className="w-full mt-2 bg-white border border-stone-200 text-stone-600 py-2 rounded-xl text-xs font-bold hover:bg-stone-100 hover:text-stone-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            前往時間軸排程 <ArrowRight size={14} />
          </button>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4" onPaste={handlePaste}>
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-stone-50 p-6 border-b border-stone-100 flex justify-between items-start">
          <div className="flex-1 mr-8">
            <div className="flex items-center gap-3 mb-2">
              {renderStatusBadge()}
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">#{task.id.split('-')[1]}</span>
              {needsProof && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100">
                  <Shield size={10} /> 需驗收附件
                </span>
              )}
            </div>
            {editMode ? (
              <input 
                value={title} onChange={e => setTitle(e.target.value)}
                className="text-2xl font-bold text-stone-800 bg-white border border-orange-200 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-orange-500 outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-stone-800">{task.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.status === 'done' && (
              <button 
                onClick={() => onConvertToKnowledge(task)}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl text-sm font-bold hover:bg-stone-700 shadow-lg shadow-stone-200"
              >
                <BookOpen size={16} /> 轉為知識
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDEBAR (Meta) */}
          <div className="w-72 bg-stone-50 border-r border-stone-100 p-6 space-y-6 overflow-y-auto hidden md:block">
            
            {/* Assignee */}
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">負責人</label>
              {editMode && canReassign ? (
                <select 
                  value={assigneeId} 
                  onChange={e => setAssigneeId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 bg-white text-sm"
                >
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              ) : (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold">
                    {users.find(u => u.id === task.assigneeId)?.name.charAt(0)}
                  </div>
                  <span className="font-bold text-stone-700 text-sm">{users.find(u => u.id === task.assigneeId)?.name}</span>
                </div>
              )}
            </div>

            {/* Goal & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-stone-100 text-center">
                <p className="text-[10px] text-stone-400 uppercase mb-1">分類</p>
                <p className="font-bold text-stone-700 text-sm">{task.goal}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-100 text-center">
                 <p className="text-[10px] text-stone-400 uppercase mb-1">時長</p>
                 <p className="font-bold text-stone-700 text-sm">{task.timeValue} {task.timeType === 'misc' ? '分' : task.timeType === 'daily' ? '時' : '天'}</p>
              </div>
            </div>

            {/* Delete Button (Conditional) */}
            {canDelete && (
               <div className="pt-4 border-t border-stone-200">
                  <button 
                    onClick={handleDeleteWithConfirmation}
                    className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 size={14} /> 刪除任務
                  </button>
                  {isCreator && !isManagement && minutesSinceCreation <= 15 && (
                    <p className="text-[10px] text-red-300 text-center mt-1">建立 15 分鐘內可刪除</p>
                  )}
               </div>
            )}

            {/* Dates */}
            <div className="space-y-3">
               <div className="flex items-center gap-3 text-sm text-stone-600">
                 <Calendar size={16} className="text-stone-400" />
                 <div>
                   <p className="text-xs text-stone-400">截止日期</p>
                   <p className="font-medium">{formatDate(task.dueAt)}</p>
                 </div>
               </div>
            </div>

            {/* Attachments Preview Sidebar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="text-xs font-bold text-stone-400 uppercase">附件</label>
                 <span className="text-xs bg-stone-200 px-1.5 py-0.5 rounded-full text-stone-600">{task.attachments.length}</span>
              </div>
              <div className="space-y-2">
                {task.attachments.slice(0, 3).map(att => (
                  <div key={att.id} className="flex items-center gap-2 text-xs text-stone-600 bg-white p-2 rounded-lg border border-stone-100 truncate">
                    {att.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                    <span className="truncate">{att.name}</span>
                  </div>
                ))}
                {task.attachments.length === 0 && <p className="text-xs text-stone-300 italic">無附件</p>}
                <button onClick={() => setActiveTab('attachments')} className="text-xs text-orange-500 hover:underline mt-1">查看全部</button>
              </div>
            </div>

          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tabs */}
            <div className="flex border-b border-stone-100 px-6 pt-4 gap-6">
              {[
                { id: 'details', label: '任務詳情', icon: FileText },
                { id: 'attachments', label: '附件中心', icon: Paperclip },
                { id: 'history', label: '歷程紀錄', icon: History }, 
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-2 flex items-center gap-2 text-sm font-bold transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-orange-500 text-stone-800' 
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  
                  {/* Approval Form */}
                  {showApproveForm && (
                     <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="text-emerald-500" size={24} />
                          <h3 className="text-lg font-bold text-emerald-800">結案評核</h3>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-bold text-emerald-700 mb-2">本次表現評分</label>
                          <div className="flex gap-2">
                             {[1,2,3,4,5].map(star => (
                               <button 
                                 key={star} 
                                 onClick={() => setRating(star)}
                                 className={`${star <= rating ? 'text-amber-400' : 'text-emerald-200'} hover:scale-110 transition-transform`}
                               >
                                 <Star size={32} fill="currentColor" strokeWidth={star <= rating ? 0 : 2} />
                               </button>
                             ))}
                          </div>
                        </div>

                        <div className="mb-4">
                           <label className="block text-sm font-bold text-emerald-700 mb-2">這項任務解決了什麼問題？ (知識庫搜尋關鍵字)</label>
                           <textarea 
                             value={problemSolved}
                             onChange={e => setProblemSolved(e.target.value)}
                             placeholder="例如：解決了客戶無法登入的 Bug，優化了資料庫查詢速度..."
                             className="w-full p-4 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none h-24"
                           />
                        </div>

                        <div className="flex gap-3">
                           <button 
                             onClick={handleConfirmApproval}
                             className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                           >
                             確認核准並歸檔
                           </button>
                           <button 
                             onClick={() => setShowApproveForm(false)}
                             className="px-6 py-3 rounded-xl font-bold text-emerald-600 hover:bg-emerald-100"
                           >
                             取消
                           </button>
                        </div>
                     </div>
                  )}

                  {showSubmitForm ? (
                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Send className="text-violet-500" size={24} />
                        <h3 className="text-lg font-bold text-violet-800">結案送審</h3>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-bold text-violet-700 mb-2">完成摘要 (必填)</label>
                        <textarea 
                          value={submissionSummary}
                          onChange={e => setSubmissionSummary(e.target.value)}
                          placeholder="請簡述任務完成情況、重點成果或是遇到的問題..."
                          className="w-full p-4 rounded-xl border border-violet-200 focus:ring-2 focus:ring-violet-400 outline-none h-32"
                        ></textarea>
                      </div>
                      {needsProof && (
                        <div className={`p-4 rounded-xl border mb-4 text-sm ${hasAttachments ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                           {hasAttachments 
                             ? <div className="flex items-center gap-2"><CheckCircle2 size={16}/> 已上傳驗收附件 ({task.attachments.length})</div>
                             : <div className="flex items-center gap-2"><AlertTriangle size={16}/> 警告：此任務需要上傳驗收附件才能提交。</div>
                           }
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button 
                          onClick={handleSubmitTask}
                          className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
                        >
                          確認送出
                        </button>
                        <button 
                          onClick={() => setShowSubmitForm(false)}
                          className="px-6 py-3 rounded-xl font-bold text-violet-600 hover:bg-violet-100"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {renderTimeline()}
                      {renderTodaySlices()} {/* New Timeline Preview */}
                      
                      <div>
                        <h3 className="text-sm font-bold text-stone-400 uppercase mb-2">描述</h3>
                        {editMode ? (
                          <textarea 
                            value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full p-4 rounded-xl border border-orange-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none min-h-[150px]"
                          />
                        ) : (
                          <div className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                            {description || <span className="text-stone-300 italic">無描述內容...</span>}
                          </div>
                        )}
                      </div>

                      {task.submission && (
                         <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                           <h3 className="text-sm font-bold text-stone-500 uppercase mb-2 flex items-center gap-2">
                             <CheckCircle2 size={16} className="text-emerald-500" />
                             結案報告
                           </h3>
                           <p className="text-stone-800 mb-2">{task.submission.summary}</p>
                           {task.submission.problemSolved && (
                             <div className="mt-4 pt-4 border-t border-stone-200">
                               <p className="text-xs font-bold text-stone-400 uppercase mb-1">解決問題</p>
                               <p className="text-stone-600 italic">{task.submission.problemSolved}</p>
                             </div>
                           )}
                         </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <Paperclip className="mx-auto text-stone-300 mb-2" size={32} />
                    <p className="text-stone-500 font-medium">點擊上傳 或 直接貼上 (Ctrl+V)</p>
                    <p className="text-xs text-stone-400 mt-1">支援圖片、文件、截圖</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {task.attachments.map(att => (
                      <div key={att.id} className="group flex items-start gap-4 p-4 rounded-2xl border border-stone-100 hover:shadow-md transition-all bg-stone-50/50 hover:bg-white relative">
                         <div className="w-12 h-12 rounded-xl bg-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
                           {att.type === 'image' ? (
                             <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                           ) : (
                             <FileText className="text-stone-500" size={24} />
                           )}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-bold text-stone-800 truncate" title={att.name}>{att.name}</p>
                           <p className="text-xs text-stone-400">{att.size} • {new Date(att.uploadedAt).toLocaleDateString()}</p>
                         </div>
                         
                         {/* Actions */}
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white rounded-lg shadow-sm border border-stone-100 p-1">
                            <button className="p-1.5 hover:bg-stone-100 rounded text-stone-500">
                              <Download size={14} />
                            </button>
                            {(isCreator || isAssignee) && (
                              <button onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                                <Trash2 size={14} />
                              </button>
                            )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {logs.filter(l => l.details.includes(task.title) || l.details.includes(task.id)).length > 0 ? (
                    logs
                      .filter(l => l.details.includes(task.title) || l.details.includes(task.id))
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map(log => {
                        const user = users.find(u => u.id === log.userId);
                        return (
                          <div key={log.id} className="flex gap-4 items-start bg-stone-50 p-4 rounded-xl border border-stone-100">
                             <div className="flex flex-col items-center gap-1">
                               <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 font-bold text-xs">
                                 {user?.name.charAt(0) || '?'}
                               </div>
                             </div>
                             <div className="flex-1">
                               <div className="flex justify-between items-start">
                                 <span className="font-bold text-stone-700 text-sm">{user?.name}</span>
                                 <span className="text-xs text-stone-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                               </div>
                               <div className="text-xs font-bold text-stone-500 mt-1 bg-white px-2 py-1 rounded w-fit border border-stone-100">{log.action}</div>
                               <p className="text-stone-600 text-sm mt-2">{log.details}</p>
                             </div>
                          </div>
                        )
                      })
                  ) : (
                    <div className="text-center py-10 text-stone-400">
                       <Clock size={48} className="mx-auto mb-4 opacity-20" />
                       <p>尚無相關歷程紀錄</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-between items-center">
           {editMode ? (
             <div className="flex gap-3 w-full">
               <button onClick={handleSaveDetails} className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold hover:bg-stone-700">儲存變更</button>
               <button onClick={() => setEditMode(false)} className="px-6 py-3 text-stone-500 font-bold hover:bg-stone-200 rounded-xl">取消</button>
             </div>
           ) : (
             <div className="flex gap-3 w-full justify-end">
                {/* Edit Button */}
                {canEditDetails && (
                  <button onClick={() => setEditMode(true)} className="px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-100">
                    編輯內容
                  </button>
                )}

                {/* Submitter Actions */}
                {canSubmit && (
                  <button 
                    onClick={() => setShowSubmitForm(true)} 
                    className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200 flex items-center gap-2"
                  >
                    <Send size={18} /> 結案送審
                  </button>
                )}

                {/* Manager Actions */}
                {canApprove && (
                  <>
                    <button onClick={handleReject} className="px-6 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">
                      退回重做
                    </button>
                    {/* Opens Approval Form instead of direct approve */}
                    <button 
                      onClick={() => setShowApproveForm(true)} 
                      className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} /> 核准結案
                    </button>
                  </>
                )}
                
                {/* Reopen */}
                {canReopen && (
                  <button onClick={() => onUpdate(task.id, { status: 'doing' })} className="px-6 py-3 bg-orange-100 text-orange-600 font-bold rounded-xl hover:bg-orange-200">
                    重開任務
                  </button>
                )}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default TaskDetailModal;