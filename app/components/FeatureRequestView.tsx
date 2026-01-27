
import React, { useState } from 'react';
import { HelpCircle, Plus, Search, HelpCircle as HelpIcon, Calendar, ArrowRight } from 'lucide-react';
import { FeatureRequest, AppState, User } from '~/types';
import FeatureRequestModal from './FeatureRequestModal';

const UI_TOKEN = {
  H1: "text-[28px] font-black text-stone-900 tracking-tight",
  SUB: "text-stone-500 text-sm font-medium mt-1",
  CARD: "bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all",
};

interface FeatureRequestViewProps {
  data: AppState;
  onCreateRequest: (req: Partial<FeatureRequest>) => void;
}

const FeatureRequestView: React.FC<FeatureRequestViewProps> = ({ data, onCreateRequest }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const requests = data.featureRequests || [];
  const filtered = requests.filter(r => r.problem.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-screen-xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-10 rounded-[2.5rem] border border-stone-100 flex flex-col md:flex-row justify-between items-center shadow-sm gap-6">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-stone-900 text-white flex items-center justify-center shadow-lg">
              <HelpCircle size={32} />
            </div>
            <div>
              <h1 className={UI_TOKEN.H1}>功能建議與改善</h1>
              <p className={UI_TOKEN.SUB}>提交您對系統的觀察與改善想法，共同打造更強大的工具。</p>
            </div>
         </div>
         <button 
           onClick={() => setShowModal(true)}
           className="bg-stone-900 text-white px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl hover:bg-stone-800 transition-all active:scale-95"
         >
            <Plus size={20} /> 我要提建議
         </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋歷史建議關鍵字..." 
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-stone-100 outline-none transition-all font-bold text-stone-700 text-sm" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filtered.length > 0 ? filtered.map(req => (
          <div key={req.id} className={`${UI_TOKEN.CARD} group flex flex-col md:flex-row gap-8`}>
             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                   <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-stone-200">
                      {req.page || '全站頁面'}
                   </span>
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                     req.impact === 'critical' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'
                   }`}>
                      {req.impact === 'critical' ? '關鍵影響' : '中度影響'}
                   </span>
                </div>
                <h3 className="text-xl font-black text-stone-800 leading-tight line-clamp-1">{req.problem}</h3>
                <p className="text-stone-400 text-sm font-medium line-clamp-2 leading-relaxed">
                   建議：{req.suggestion}
                </p>
                <div className="pt-4 border-t border-stone-50 flex items-center justify-between text-[11px] font-bold text-stone-300">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5"><Calendar size={12}/> {new Date(req.createdAt).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1.5"><HelpIcon size={12}/> {req.status === 'pending' ? '審核中' : '處理中'}</div>
                   </div>
                   <div className="flex items-center gap-2 group-hover:text-stone-600 transition-colors">
                      查看進度 <ArrowRight size={14}/>
                   </div>
                </div>
             </div>
          </div>
        )) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-stone-100 flex flex-col items-center">
            <HelpCircle size={64} className="mb-6 text-stone-100" />
            <p className="text-stone-300 font-black text-lg uppercase tracking-widest">目前尚無符合的建議紀錄</p>
          </div>
        )}
      </div>

      {showModal && (
        <FeatureRequestModal 
          currentUser={data.currentUser} 
          onClose={() => setShowModal(false)} 
          onSubmit={(req) => { onCreateRequest(req); setShowModal(false); }} 
        />
      )}
    </div>
  );
};

export default FeatureRequestView;
