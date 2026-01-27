
import React, { useState } from 'react';
import { Announcement, User, AnnouncementLevel } from '~/types';
import { 
  Megaphone, Calendar, User as UserIcon, AlertTriangle, Info, Plus, 
  X, Send, BellRing, Users, Eye, Clock, Filter, CheckCircle2,
  ChevronDown, Building
} from 'lucide-react';

interface AnnouncementViewProps {
  announcements: Announcement[];
  currentUser: User;
  onCreate: (ann: Partial<Announcement>) => void;
}

const UI_TOKEN = {
  H1: "text-[28px] font-black text-stone-900 tracking-tight",
  LABEL: "text-[12px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block",
  CARD: "bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all",
};

// --- 新增公告彈窗 (增強版) ---
const CreateAnnouncementModal = ({ onClose, onAdd, departments }: { onClose: () => void, onAdd: (ann: Partial<Announcement>) => void, departments: string[] }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [level, setLevel] = useState<AnnouncementLevel>('info');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');

  const toggleDept = (dept: string) => {
    setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[600px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-stone-100 animate-in zoom-in-95 duration-300 max-h-[90vh]">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-3">
             <BellRing size={18} className="text-amber-400" />
             <h3 className="text-sm font-bold tracking-wider">發佈精密公告</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-stone-400 transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <label className={UI_TOKEN.LABEL}>公告層級 & 有效期</label>
            <div className="flex gap-3">
               {['info', 'warning', 'urgent'].map(opt => (
                 <button key={opt} onClick={() => setLevel(opt as any)} className={`flex-1 py-3 rounded-xl border-2 text-xs font-black transition-all ${level === opt ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100'}`}>
                   {opt === 'info' ? '一般' : opt === 'warning' ? '重要' : '緊急'}
                 </button>
               ))}
            </div>
            <input type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold" />
            <p className="text-[10px] text-stone-400 italic">設定有效期後，系統將於當日午夜自動隱藏公告。</p>
          </div>

          <div className="space-y-4">
             <label className={UI_TOKEN.LABEL}>發佈對象 (預設全體)</label>
             <div className="flex flex-wrap gap-2">
                {departments.map(d => (
                  <button key={d} onClick={() => toggleDept(d)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${selectedDepts.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>
                    {d}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-2">
            <label className={UI_TOKEN.LABEL}>公告標題與內容</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="公告標題 (例如：系統停機公告)" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold mb-3" />
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="詳細內容敘述..." className="w-full p-5 rounded-2xl border border-stone-200 bg-stone-50 text-sm font-medium h-40 resize-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
        </div>

        <div className="p-6 bg-stone-50 flex justify-end gap-4 border-t border-stone-100 shrink-0">
          <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-stone-400 hover:text-stone-600">取消</button>
          <button 
            disabled={!content.trim()}
            onClick={() => onAdd({ title, content, level, targetDepartments: selectedDepts, expiresAt })}
            className="bg-[#2563eb] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <Send size={16} /> 發佈公告
          </button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ announcements, currentUser, onCreate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState<AnnouncementLevel | 'all'>('all');

  // Fix: Explicitly type departments as string[] to resolve the 'unknown[]' assignability error
  const departments: string[] = Array.from(new Set<string>(announcements.flatMap(a => a.targetDepartments || [])));
  const finalDepts = departments.length > 0 ? departments : ['研發部', '設計部', '業務部', '行政部'];

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'urgent': return { bg: 'bg-red-50/30', text: 'text-red-700', border: 'border-red-100', icon: AlertTriangle, label: '緊急', accent: 'bg-red-600' };
      case 'warning': return { bg: 'bg-amber-50/30', text: 'text-amber-700', border: 'border-amber-100', icon: AlertTriangle, label: '重要', accent: 'bg-amber-500' };
      default: return { bg: 'bg-white', text: 'text-stone-700', border: 'border-stone-100', icon: Info, label: '一般', accent: 'bg-blue-500' };
    }
  };

  const isManagement = currentUser.role === 'admin' || currentUser.role === 'manager';
  const filtered = announcements.filter(a => filterLevel === 'all' || a.level === filterLevel);

  return (
    <div className="max-w-screen-xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="bg-white p-8 rounded-[2rem] border border-stone-100 flex flex-col md:flex-row justify-between items-center shadow-sm gap-6">
         <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-stone-900 text-white flex items-center justify-center shadow-lg"><Megaphone size={32} /></div>
            <div>
              <h1 className={UI_TOKEN.H1}>公告中心</h1>
              <p className="text-sm text-stone-400 font-medium mt-1">確保組織內部訊息同步，掌握最新動態</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex bg-stone-100 p-1 rounded-xl">
               {['all', 'info', 'warning', 'urgent'].map(l => (
                 <button key={l} onClick={() => setFilterLevel(l as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterLevel === l ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>
                   {l === 'all' ? '全部' : l}
                 </button>
               ))}
            </div>
            {isManagement && (
              <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                <Plus size={18} /> 發佈公告
              </button>
            )}
         </div>
      </div>

      <div className="space-y-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filtered.map(ann => {
              const styles = getLevelStyles(ann.level);
              const Icon = styles.icon;
              const isTargeted = ann.targetDepartments && ann.targetDepartments.length > 0;
              const hasRead = ann.readBy?.includes(currentUser.id);

              return (
                <div key={ann.id} className={`${UI_TOKEN.CARD} border-l-[12px] ${styles.border.replace('border-', 'border-l-')} flex flex-col md:flex-row gap-8 relative overflow-hidden group`}>
                  {/* 背景裝飾 */}
                  <div className={`absolute -right-10 -bottom-10 w-40 h-40 opacity-[0.03] group-hover:scale-110 transition-transform ${styles.text}`}><Icon size={160}/></div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${styles.bg} ${styles.text}`}>
                        <Icon size={12} /> {styles.label}
                      </span>
                      {isTargeted && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase border border-blue-100">
                          <Building size={12}/> {ann.targetDepartments?.join(', ')}
                        </span>
                      )}
                      {ann.expiresAt && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-stone-50 text-stone-400 rounded-full text-[10px] font-black uppercase border border-stone-100">
                          <Clock size={12}/> 至 {ann.expiresAt}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-black text-stone-800 tracking-tight">{ann.title || "系統公告通知"}</h2>
                    <p className="text-stone-500 font-medium leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    
                    <div className="pt-4 border-t border-stone-50 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                         <div className="flex items-center gap-2 text-[11px] font-bold text-stone-400">
                           <Calendar size={14} /> {new Date(ann.createdAt).toLocaleDateString()}
                         </div>
                         {isManagement && (
                           <div className="flex items-center gap-2 text-[11px] font-bold text-blue-500">
                             <Eye size={14} /> {ann.readBy?.length || 0} 位已讀
                           </div>
                         )}
                       </div>
                       
                       {!hasRead && ann.level === 'urgent' && (
                         <button className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg shadow-red-100 animate-pulse hover:animate-none">
                           <CheckCircle2 size={14}/> 我已確認閱讀
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-stone-100 shadow-sm">
            <div className="w-24 h-24 bg-stone-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-stone-200">
              <Megaphone size={48} />
            </div>
            <p className="text-stone-400 font-black text-lg uppercase tracking-widest">目前尚無匹配的公告訊息</p>
          </div>
        )}
      </div>

      {showCreateModal && <CreateAnnouncementModal onClose={() => setShowCreateModal(false)} onAdd={onCreate} departments={finalDepts} />}
    </div>
  );
};

export default AnnouncementView;
