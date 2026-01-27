
import React, { useState } from 'react';
import { X, HelpCircle, Upload, ChevronDown } from 'lucide-react';
import { FeatureRequest, ImpactLevel, UrgencyLevel, User } from '../types';

interface FeatureRequestModalProps {
  onClose: () => void;
  onSubmit: (request: Partial<FeatureRequest>) => void;
  currentUser: User;
}

const UI_TOKEN = {
  LABEL: "text-[15px] font-bold text-stone-800 mb-1.5 flex items-center gap-2",
  SUB_LABEL: "text-[12px] text-stone-400 mb-3 block",
  INPUT: "w-full p-4 rounded-2xl border border-stone-100 bg-stone-50/50 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-100 focus:bg-white transition-all placeholder:text-stone-300",
  TEXTAREA: "w-full p-5 rounded-2xl border border-stone-100 bg-stone-50/50 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-100 focus:bg-white transition-all min-h-[140px] resize-none placeholder:text-stone-300",
  SELECT_BOX: "relative w-full"
};

const FeatureRequestModal: React.FC<FeatureRequestModalProps> = ({ onClose, onSubmit, currentUser }) => {
  const [problem, setProblem] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [page, setPage] = useState('');
  const [impact, setImpact] = useState<ImpactLevel>('medium');
  const [consequence, setConsequence] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');

  const handleSubmit = () => {
    if (!problem.trim() || !suggestion.trim()) return alert("請填寫帶有星號 (*) 的必填欄位");
    onSubmit({ problem, suggestion, page, impact, consequence, urgency });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white w-full max-w-[640px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-10 pb-6 flex justify-between items-start">
          <div className="flex gap-4">
             <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
               <HelpCircle size={28} />
             </div>
             <div>
               <h3 className="text-2xl font-black text-stone-800 tracking-tight">網站修改建議申請</h3>
               <p className="text-sm text-stone-400 mt-1 font-medium">您的建議將透過 AI 自動分析並轉交工程團隊。</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full text-stone-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-10 pb-10 space-y-10 overflow-y-auto max-h-[65vh] custom-scrollbar">
          
          {/* Q1 */}
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <label className={UI_TOKEN.LABEL}>
              ① 你現在遇到什麼問題？ <span className="text-red-500 font-black">*</span>
            </label>
            <span className={UI_TOKEN.SUB_LABEL}>請描述實際操作時的不便、錯誤或卡住的地方。</span>
            <textarea 
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="例如：客戶列表頁找不到「最近聯絡時間」，每次都要點進去很麻煩。"
              className={UI_TOKEN.TEXTAREA}
            />
          </div>

          {/* Q2 */}
          <div className="animate-in slide-in-from-bottom-2 duration-400">
            <label className={UI_TOKEN.LABEL}>
              ② 你希望系統怎麼幫你改善？ <span className="text-red-500 font-black">*</span>
            </label>
            <span className={UI_TOKEN.SUB_LABEL}>請用「我希望可以...」描述理想中的操作方式。</span>
            <textarea 
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="例如：我希望在列表頁就能直接看到最近聯絡時間。"
              className={UI_TOKEN.TEXTAREA}
            />
          </div>

          {/* Q3 & Q4 Row */}
          <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-2">
              <label className={UI_TOKEN.LABEL}>③ 發生問題的頁面是？</label>
              <div className={UI_TOKEN.SELECT_BOX}>
                <select 
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-700 appearance-none outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">請選擇...</option>
                  <option value="客戶管理">客戶管理</option>
                  <option value="設備管理">設備管理</option>
                  <option value="工單系統">工單系統</option>
                  <option value="統計報表">統計報表</option>
                  <option value="訂單中心">訂單中心</option>
                  <option value="其他">其他</option>
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className={UI_TOKEN.LABEL}>④ 影響程度？</label>
              <div className={UI_TOKEN.SELECT_BOX}>
                <select 
                  value={impact}
                  onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                  className="w-full p-4 rounded-2xl border border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-700 appearance-none outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="low">幾乎不影響</option>
                  <option value="medium">偶爾會卡住</option>
                  <option value="high">幾乎每天都會遇到</option>
                  <option value="critical">會直接影響成交 / 作業效率</option>
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
              </div>
            </div>
          </div>

          {/* Q5 */}
          <div className="animate-in slide-in-from-bottom-2 duration-600">
            <label className={UI_TOKEN.LABEL}>⑤ 如果不改，會發生什麼後果？</label>
            <input 
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
              placeholder="例如：容易漏資料、會算錯、要多花很多時間等等。"
              className={UI_TOKEN.INPUT}
            />
          </div>

          {/* Q6 */}
          <div className="animate-in slide-in-from-bottom-2 duration-700">
            <label className={UI_TOKEN.LABEL}>⑥ 你有沒有相關畫面或說明？</label>
            <button className="mt-2 flex items-center gap-2 px-6 py-3 bg-stone-50 border border-stone-100 rounded-xl text-stone-500 text-sm font-bold hover:bg-stone-100 transition-all">
              <Upload size={18} /> 上傳截圖/影片
            </button>
          </div>

          {/* Q7 */}
          <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-800">
            <label className={UI_TOKEN.LABEL}>⑦ 你覺得這個修改急不急？</label>
            <div className="flex gap-8">
              {[
                { value: 'low', label: '可慢慢來' },
                { value: 'medium', label: '近期希望改善' },
                { value: 'high', label: '很急，已影響工作' }
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${urgency === opt.value ? 'border-stone-800 bg-stone-800' : 'border-stone-200 group-hover:border-stone-300'}`}>
                    {urgency === opt.value && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <input type="radio" className="hidden" name="urgency" checked={urgency === opt.value} onChange={() => setUrgency(opt.value as any)} />
                  <span className={`text-[15px] font-bold ${urgency === opt.value ? 'text-stone-900' : 'text-stone-400'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-8 px-10 bg-stone-50/50 border-t border-stone-100 flex justify-end gap-6 shrink-0">
           <button onClick={onClose} className="px-10 py-4 rounded-2xl font-bold text-stone-400 hover:text-stone-600 transition-all text-lg">
             取消
           </button>
           <button 
             onClick={handleSubmit}
             className="px-12 py-4 bg-[#44403c] text-white rounded-2xl font-black shadow-xl shadow-stone-200 hover:bg-stone-800 active:scale-95 transition-all text-lg"
           >
             提交申請
           </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureRequestModal;
