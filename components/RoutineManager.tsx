
import React, { useState } from 'react';
import { RoutineTemplate, User, GoalCategory, TimeType, RecurrenceType, RoutineStrategy, RoutineStatus } from '../types';
import { X, CalendarClock, Plus, Trash2, Check, User as UserIcon, Users, Power, Snowflake, LayoutGrid, List, ArrowRight, RefreshCw, Calendar, AlertCircle, Edit2 } from 'lucide-react';
import { INITIAL_GOALS, generateId } from '../constants';

interface RoutineManagerProps {
  currentUser: User;
  users: User[];
  templates: RoutineTemplate[];
  onSaveTemplate: (template: RoutineTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onToggleTemplate: (id: string, status: RoutineStatus) => void;
}

const RoutineManager: React.FC<RoutineManagerProps> = ({
  currentUser, users, templates, onSaveTemplate, onDeleteTemplate, onToggleTemplate
}) => {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [viewStyle, setViewStyle] = useState<'card' | 'list'>('card');
  const [filterStatus, setFilterStatus] = useState<RoutineStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<RoutineTemplate>>({
    title: '',
    description: '',
    goal: '行政',
    timeType: 'misc',
    timeValue: 15,
    recurrence: 'daily',
    strategy: 'static',
    assigneeIds: [currentUser.id],
    currentRotationIndex: 0,
    status: 'active',
    validFrom: new Date().toISOString().split('T')[0]
  });

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  // --- Helpers ---
  const getAssigneeNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return '未分配';
    if (ids.length === users.length) return '全體人員';
    const names = ids.map(id => users.find(u => u.id === id)?.name || '未知');
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]}... (+${names.length - 2})`;
  };

  const handleEdit = (template?: RoutineTemplate) => {
    if (template) {
      setEditingId(template.id);
      // Migration safety for old templates handled in App.tsx, but good to be safe here
      setFormData({ 
        ...template,
        strategy: template.strategy || 'static',
        assigneeIds: template.assigneeIds || [],
        currentRotationIndex: template.currentRotationIndex || 0,
        validFrom: template.validFrom || new Date().toISOString().split('T')[0],
        status: template.status || 'active'
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        goal: '行政',
        timeType: 'misc',
        timeValue: 15,
        recurrence: 'daily',
        recurrenceDay: 1,
        strategy: 'static',
        assigneeIds: [currentUser.id],
        currentRotationIndex: 0,
        status: 'active',
        validFrom: new Date().toISOString().split('T')[0]
      });
    }
    setMode('edit');
  };

  const toggleAssignee = (userId: string) => {
    setFormData(prev => {
      const current = prev.assigneeIds || [];
      if (current.includes(userId)) {
        return { ...prev, assigneeIds: current.filter(id => id !== userId) };
      } else {
        return { ...prev, assigneeIds: [...current, userId] };
      }
    });
  };

  const handleSelectAll = () => {
    setFormData(prev => ({ ...prev, assigneeIds: users.map(u => u.id) }));
  };

  const handleClearAll = () => {
    setFormData(prev => ({ ...prev, assigneeIds: [] }));
  };

  const handleSubmit = () => {
    if (!formData.title) return alert("請輸入標題");
    if (!formData.assigneeIds || formData.assigneeIds.length === 0) return alert("請至少選擇一位執行人員");
    
    const template: RoutineTemplate = {
      id: editingId || generateId('ROUTINE'),
      title: formData.title!,
      description: formData.description || '',
      goal: formData.goal as GoalCategory,
      timeType: formData.timeType as TimeType,
      timeValue: formData.timeValue || 15,
      recurrence: formData.recurrence as RecurrenceType,
      recurrenceDay: formData.recurrenceDay,
      
      strategy: formData.strategy as RoutineStrategy,
      assigneeIds: formData.assigneeIds!,
      currentRotationIndex: formData.currentRotationIndex || 0,
      
      validFrom: formData.validFrom!,
      validTo: formData.validTo,

      creatorId: editingId ? (templates.find(t => t.id === editingId)?.creatorId || currentUser.id) : currentUser.id,
      status: formData.status as RoutineStatus,
      lastGeneratedDate: templates.find(t => t.id === editingId)?.lastGeneratedDate
    };

    onSaveTemplate(template);
    setMode('list');
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    // Users can see templates they created OR templates assigned to them. Admins see all.
    const isMyTemplate = t.creatorId === currentUser.id || t.assigneeIds?.includes(currentUser.id) || isAdmin;
    if (!isMyTemplate) return false;
    
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-stone-800 mb-2">例行工作管理</h1>
           <p className="text-stone-500">設定個人或團隊的週期性排程與輪值任務</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          {mode === 'list' ? (
            <>
              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-stone-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
                 <div className="flex bg-stone-100 p-1 rounded-xl">
                    {['all', 'active', 'frozen', 'draft'].map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s as any)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filterStatus === s ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        {s === 'all' ? '全部' : s === 'active' ? '執行中' : s === 'frozen' ? '已凍結' : '草稿'}
                      </button>
                    ))}
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <div className="flex bg-stone-100 p-1 rounded-lg">
                       <button onClick={() => setViewStyle('card')} className={`p-1.5 rounded ${viewStyle === 'card' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}><LayoutGrid size={16}/></button>
                       <button onClick={() => setViewStyle('list')} className={`p-1.5 rounded ${viewStyle === 'list' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400'}`}><List size={16}/></button>
                    </div>
                    <button 
                      onClick={() => handleEdit()}
                      className="bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-stone-700 flex items-center gap-2"
                    >
                      <Plus size={16} /> 新增模板
                    </button>
                 </div>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
                 {filteredTemplates.length === 0 ? (
                   <div className="text-center py-20 opacity-50">
                      <CalendarClock size={48} className="mx-auto mb-4 text-stone-300" />
                      <p className="text-stone-400">沒有符合條件的例行工作</p>
                   </div>
                 ) : (
                   <div className={viewStyle === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
                      {filteredTemplates.map(t => (
                        <div 
                          key={t.id} 
                          className={`bg-white border rounded-2xl p-5 transition-all hover:shadow-md group relative overflow-hidden ${
                            t.status === 'frozen' ? 'border-stone-200 opacity-70' : 
                            t.status === 'draft' ? 'border-dashed border-stone-300' : 'border-stone-200'
                          } ${viewStyle === 'list' ? 'flex items-center justify-between gap-4' : 'flex flex-col'}`}
                        >
                           {/* Status Stripe */}
                           <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                             t.status === 'active' ? 'bg-emerald-500' : 
                             t.status === 'frozen' ? 'bg-blue-300' : 'bg-stone-300'
                           }`}></div>

                           <div className={viewStyle === 'list' ? 'flex-1 pl-2' : 'mb-4 pl-2'}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                                     t.strategy === 'rotating' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'
                                   }`}>
                                     {t.strategy === 'rotating' ? <RefreshCw size={10} /> : <Users size={10} />}
                                     {t.strategy === 'rotating' ? '輪值' : '固定'}
                                   </span>
                                   <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded">
                                     {t.recurrence === 'daily' ? '每日' : t.recurrence === 'workday' ? '工作日' : t.recurrence === 'weekly' ? '每週' : '每月'}
                                   </span>
                                </div>
                                {/* Actions for Card View */}
                                {viewStyle === 'card' && (
                                  <div className="flex gap-1">
                                     <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-800"><Edit2 size={14}/></button>
                                  </div>
                                )}
                              </div>
                              
                              <h3 className={`font-bold text-stone-800 ${viewStyle === 'list' ? 'text-sm' : 'text-lg'}`}>{t.title}</h3>
                              
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                                 <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded">
                                    <Users size={12} />
                                    <span className="truncate max-w-[150px]">{getAssigneeNames(t.assigneeIds || [])}</span>
                                 </div>
                                 {t.strategy === 'rotating' && (
                                   <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                     <ArrowRight size={10} /> 
                                     下位: {users.find(u => u.id === t.assigneeIds[t.currentRotationIndex])?.name || '未知'}
                                   </span>
                                 )}
                              </div>
                              
                              {t.validTo && (
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-stone-400">
                                   <Calendar size={10} /> 有效期至 {t.validTo}
                                </div>
                              )}
                           </div>

                           {/* List View Actions */}
                           {viewStyle === 'list' && (
                             <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onToggleTemplate(t.id, t.status === 'active' ? 'frozen' : 'active')} className="p-2 hover:bg-stone-100 rounded text-stone-400 hover:text-blue-500" title={t.status==='active' ? '凍結' : '啟用'}>
                                   {t.status === 'active' ? <Snowflake size={16}/> : <Power size={16}/>}
                                </button>
                                <button onClick={() => handleEdit(t)} className="p-2 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-800" title="編輯"><Edit2 size={16}/></button>
                                <button onClick={() => {if(confirm('刪除?')) onDeleteTemplate(t.id)}} className="p-2 hover:bg-stone-100 rounded text-stone-400 hover:text-red-500" title="刪除"><Trash2 size={16}/></button>
                             </div>
                           )}

                           {/* Card View Bottom Actions */}
                           {viewStyle === 'card' && (
                             <div className="mt-auto pt-4 border-t border-stone-100 flex justify-between items-center">
                                <span className={`text-[10px] font-bold ${t.status === 'active' ? 'text-emerald-500' : 'text-stone-400'}`}>
                                  {t.status === 'active' ? '● 執行中' : t.status === 'frozen' ? '● 已凍結' : '○ 草稿'}
                                </span>
                                <div className="flex gap-2">
                                  <button onClick={() => onToggleTemplate(t.id, t.status === 'active' ? 'frozen' : 'active')} className="text-xs font-bold text-stone-400 hover:text-stone-600">
                                    {t.status === 'active' ? '凍結' : '啟用'}
                                  </button>
                                  <button onClick={() => {if(confirm('刪除?')) onDeleteTemplate(t.id)}} className="text-xs font-bold text-stone-400 hover:text-red-500">
                                    刪除
                                  </button>
                                </div>
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </>
          ) : (
            // --- EDIT FORM ---
            <div className="flex-1 overflow-y-auto p-8 bg-stone-50">
               <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setMode('list')} className="text-sm font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1">
                      ← 返回列表
                    </button>
                    <h3 className="text-xl font-bold text-stone-800">
                      {editingId ? '編輯例行工作' : '新增例行工作'}
                    </h3>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                     <h4 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                       <LayoutGrid size={20} className="text-amber-500" /> 基本資訊
                     </h4>
                     <div>
                       <label className="block text-sm font-bold text-stone-600 mb-2">標題</label>
                       <input 
                         value={formData.title} 
                         onChange={e => setFormData({...formData, title: e.target.value})}
                         className="w-full p-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-200 outline-none bg-stone-50 text-lg font-bold"
                         placeholder="例：填寫日報、倒垃圾"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">目標分類</label>
                          <select 
                            value={formData.goal}
                            onChange={e => setFormData({...formData, goal: e.target.value as any})}
                            className="w-full p-3 rounded-xl border border-stone-200 bg-white"
                          >
                            {INITIAL_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-600 mb-2">預計時長</label>
                          <div className="flex gap-2">
                             <input 
                               type="number"
                               value={formData.timeValue}
                               onChange={e => setFormData({...formData, timeValue: Number(e.target.value)})}
                               className="flex-1 p-3 rounded-xl border border-stone-200"
                             />
                             <select 
                               value={formData.timeType}
                               onChange={e => setFormData({...formData, timeType: e.target.value as any})}
                               className="w-24 p-3 rounded-xl border border-stone-200 bg-white"
                             >
                               <option value="misc">分</option>
                               <option value="daily">時</option>
                             </select>
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* Schedule & Assignment */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                     <h4 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                       <CalendarClock size={20} className="text-amber-500" /> 排程與指派
                     </h4>
                     
                     {/* Assignment Strategy */}
                     <div className="flex gap-4">
                        <label className={`flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.strategy === 'static' ? 'border-amber-400 bg-amber-50' : 'border-stone-200 hover:border-stone-300'}`}>
                           <input type="radio" className="hidden" checked={formData.strategy === 'static'} onChange={() => setFormData({...formData, strategy: 'static'})} />
                           <div className="font-bold text-stone-800 flex items-center gap-2 mb-1"><Users size={20} className={formData.strategy === 'static' ? 'text-amber-600' : 'text-stone-400'}/> 固定指派</div>
                           <p className="text-xs text-stone-500 leading-relaxed">每次觸發時，所有被選中的人員都會收到一項獨立任務。</p>
                        </label>
                        <label className={`flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.strategy === 'rotating' ? 'border-purple-400 bg-purple-50' : 'border-stone-200 hover:border-stone-300'}`}>
                           <input type="radio" className="hidden" checked={formData.strategy === 'rotating'} onChange={() => setFormData({...formData, strategy: 'rotating'})} />
                           <div className="font-bold text-stone-800 flex items-center gap-2 mb-1"><RefreshCw size={20} className={formData.strategy === 'rotating' ? 'text-purple-600' : 'text-stone-400'}/> 輪流輪值</div>
                           <p className="text-xs text-stone-500 leading-relaxed">每次觸發時，僅由一位人員負責，並自動依序輪替。</p>
                        </label>
                     </div>

                     {/* User Selector */}
                     <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                        <div className="flex justify-between items-center mb-3">
                           <label className="text-sm font-bold text-stone-600">選擇人員 ({formData.assigneeIds?.length || 0})</label>
                           <div className="space-x-3 text-xs font-bold">
                              <button onClick={handleSelectAll} className="text-amber-600 hover:underline">全選</button>
                              <button onClick={handleClearAll} className="text-stone-400 hover:underline">清空</button>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {users.map(u => {
                             const isSelected = formData.assigneeIds?.includes(u.id);
                             return (
                               <button 
                                 key={u.id}
                                 onClick={() => toggleAssignee(u.id)}
                                 className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${
                                   isSelected 
                                     ? 'bg-white border-stone-800 text-stone-800 shadow-sm' 
                                     : 'bg-transparent border-transparent text-stone-400 hover:bg-white hover:border-stone-200'
                                 }`}
                               >
                                 <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-stone-300'}`}></div>
                                 {u.name}
                               </button>
                             )
                           })}
                        </div>
                     </div>

                     {/* Rotating Specific: Order & Next */}
                     {formData.strategy === 'rotating' && formData.assigneeIds && formData.assigneeIds.length > 0 && (
                        <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                           <label className="text-sm font-bold text-purple-800 mb-3 block flex items-center gap-2">
                             <RefreshCw size={14}/> 設定輪值順序與下一位執行者
                           </label>
                           <div className="flex items-center gap-3 overflow-x-auto pb-2">
                              {formData.assigneeIds.map((uid, idx) => {
                                 const isNext = idx === (formData.currentRotationIndex || 0);
                                 return (
                                   <div key={uid} 
                                     onClick={() => setFormData({...formData, currentRotationIndex: idx})}
                                     className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all relative ${
                                       isNext ? 'bg-white border-purple-500 shadow-md text-purple-700' : 'bg-white/50 border-purple-100 text-purple-300 hover:border-purple-200'
                                     }`}
                                   >
                                      {isNext && (
                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] px-2 rounded-full">
                                          NEXT
                                        </span>
                                      )}
                                      <span className="mr-2 text-[10px] opacity-50">{idx + 1}.</span>
                                      {users.find(u => u.id === uid)?.name}
                                   </div>
                                 )
                              })}
                           </div>
                           <p className="text-xs text-purple-600/70 mt-2 flex items-center gap-1">
                             <AlertCircle size={12} /> 提示：點擊上方卡片可手動指定下一位執行者 (可作為臨時調班使用)
                           </p>
                        </div>
                     )}

                     {/* Date Range & Frequency */}
                     <div className="grid grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                        <div>
                           <label className="block text-sm font-bold text-stone-600 mb-2">生效日期 (起)</label>
                           <input 
                             type="date"
                             value={formData.validFrom}
                             onChange={e => setFormData({...formData, validFrom: e.target.value})}
                             className="w-full p-3 rounded-xl border border-stone-200 text-sm"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-stone-600 mb-2">結束日期 (選填)</label>
                           <input 
                             type="date"
                             value={formData.validTo || ''}
                             onChange={e => setFormData({...formData, validTo: e.target.value})}
                             className="w-full p-3 rounded-xl border border-stone-200 text-sm"
                           />
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-bold text-stone-600 mb-2">重複頻率</label>
                           <select 
                              value={formData.recurrence}
                              onChange={e => setFormData({...formData, recurrence: e.target.value as any})}
                              className="w-full p-3 rounded-xl border border-stone-200 bg-white text-sm"
                           >
                              <option value="daily">每天 (含假日)</option>
                              <option value="workday">工作日 (週一至週五)</option>
                              <option value="weekly">每週</option>
                              <option value="monthly">每月</option>
                           </select>
                        </div>
                        {(formData.recurrence === 'weekly' || formData.recurrence === 'monthly') && (
                           <div>
                              <label className="block text-sm font-bold text-stone-600 mb-2">
                                {formData.recurrence === 'weekly' ? '星期幾' : '日期 (號)'}
                              </label>
                              <select
                                value={formData.recurrenceDay || 1}
                                onChange={e => setFormData({...formData, recurrenceDay: Number(e.target.value)})}
                                className="w-full p-3 rounded-xl border border-stone-200 bg-white text-sm"
                              >
                                {formData.recurrence === 'weekly' ? (
                                  ['日','一','二','三','四','五','六'].map((d, i) => <option key={i} value={i}>週{d}</option>)
                                ) : (
                                  Array.from({length:31}, (_,i)=>i+1).map(d => <option key={d} value={d}>{d}號</option>)
                                )}
                              </select>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="flex gap-4 pt-4 pb-12">
                     <button onClick={handleSubmit} className="flex-1 bg-stone-800 text-white py-4 rounded-2xl font-bold hover:bg-stone-700 shadow-xl shadow-stone-200 text-lg transition-transform active:scale-95">
                       {editingId ? '儲存設定變更' : '建立例行工作'}
                     </button>
                     <button onClick={() => setMode('list')} className="px-10 py-4 bg-white border border-stone-200 text-stone-500 font-bold rounded-2xl hover:bg-stone-50 transition-colors">
                       取消
                     </button>
                  </div>
               </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default RoutineManager;
