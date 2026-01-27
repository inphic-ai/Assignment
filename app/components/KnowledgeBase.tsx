import React, { useState, useMemo, useRef } from 'react';
import { Task, GoalCategory, User } from '~/types';
import { 
  Search, Archive, Lightbulb, ChevronRight, ChevronLeft, 
  Sparkles, History, Tag, ChevronDown, PenTool, MessageSquare,
  Zap, Loader2, X, Target, ShieldAlert, ArrowRight, RotateCcw,
  ShieldCheck, AlertTriangle, Info, MoreHorizontal, Save, ZapOff,
  ExternalLink, Command, Terminal
} from 'lucide-react';
import { INITIAL_GOALS } from '~/constants';
import { GoogleGenAI, Type } from "@google/genai";

const UI_TOKEN = {
  TH: "px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100",
  TD: "px-6 py-6 text-sm font-medium text-stone-600 border-b border-stone-50 transition-all",
};

interface KnowledgeBaseProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ tasks, users, onSelectTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState<GoalCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // AI 戰略檢索狀態 (整合於頁面)
  const [aiInput, setAiInput] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiMatchIds, setAiMatchIds] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState<Record<string, string>>({});
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // 1. 取得所有已完成並轉化為知識的資產
  const knowledgeAssets = useMemo(() => {
    return tasks.filter(t => t.status === 'done' && t.linkedKnowledgeId);
  }, [tasks]);

  // 2. 核心過濾邏輯
  const filtered = useMemo(() => {
    if (aiMatchIds.length > 0) {
      const matches = knowledgeAssets.filter(t => aiMatchIds.includes(t.id));
      if (matches.length === 0) {
          return knowledgeAssets.filter(t => 
            aiMatchIds.some(id => t.title.includes(id) || id.includes(t.title))
          );
      }
      return matches;
    }
    return knowledgeAssets.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.problemSolved || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchGoal = filterGoal === 'all' || t.goal === filterGoal;
      return matchSearch && matchGoal;
    });
  }, [knowledgeAssets, searchTerm, filterGoal, aiMatchIds]);

  // 分頁邏輯
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;
  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  // AI 深度語意分析
  const handleAiStrategicSearch = async () => {
    if (!aiInput.trim()) return;
    setIsAiAnalyzing(true);
    
    const dbContext = knowledgeAssets.map(t => ({
      id: t.id,
      title: t.title,
      goal: t.goal,
      aar: t.submission?.problemSolved || ""
    })).slice(0, 40);

    try {
      // Fix: Follow guidelines for GoogleGenAI initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          任務目標：根據使用者描述的「瓶頸」，從「歷史戰略資產」中挑選最相關的經驗。
          
          使用者現況描述： "${aiInput}"
          歷史資產清單： ${JSON.stringify(dbContext)}
          
          請務必回傳 JSON：
          {
            "matches": ["精確的ID1", "精確的ID2"...],
            "reasoning": { "精確的ID1": "為什麼相關(20字內)" },
            "strategicSynthesis": "一段總結建議(100字內)。"
          }
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } },
              strategicSynthesis: { type: Type.STRING }
            },
            required: ["matches", "reasoning", "strategicSynthesis"]
          }
        }
      });

      const result = JSON.parse(response.text);
      const cleanedIds = (result.matches || []).map((id: string) => id.trim());
      
      setAiMatchIds(cleanedIds);
      setAiReasoning(result.reasoning || {});
      setAiSummary(result.strategicSynthesis || null);
      setCurrentPage(1);
    } catch (e) {
      console.error("AI Analysis Error:", e);
      alert("AI 顧問通訊失敗。");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const clearFilters = () => {
    setAiMatchIds([]);
    setAiReasoning({});
    setAiSummary(null);
    setSearchTerm('');
    setFilterGoal('all');
    setAiInput('');
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-10  pb-20">
      
      {/* 頂部標頭 */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4 px-2">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                  <Archive size={20} />
               </div>
               <h1 className="text-3xl font-black text-stone-900 tracking-tight italic">知識基因 DNA 庫</h1>
            </div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">目前共沉澱 {knowledgeAssets.length} 項戰略資產</p>
         </div>
         {(aiMatchIds.length > 0 || searchTerm || filterGoal !== 'all') && (
           <button onClick={clearFilters} className="bg-stone-100 text-stone-500 px-5 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95">
             <RotateCcw size={14} /> 重置所有條件
           </button>
         )}
      </div>

      {/* AI 整合面板 (原本是 Modal，現在直接嵌入) */}
      <div className={`bg-[#1c1917] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 transition-all duration-700 ${isAiAnalyzing ? 'ring-4 ring-amber-500/30' : ''}`}>
         <div className="p-10 lg:p-14 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-stone-900 shadow-xl transition-all duration-500 ${isAiAnalyzing ? 'bg-amber-400 animate-pulse' : 'bg-amber-500'}`}>
                     {isAiAnalyzing ? <Loader2 size={28} className="animate-spin" /> : <Zap size={28} fill="currentColor" />}
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white tracking-tight italic">戰略意圖檢索器</h2>
                     <p className="text-amber-500/50 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic">Intelligence Semantic Analysis</p>
                  </div>
               </div>
               {aiMatchIds.length > 0 && (
                 <div className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest animate-in zoom-in">
                    已為您過濾出 {aiMatchIds.length} 個相關戰術資產
                 </div>
               )}
            </div>

            <div className="relative group">
               <textarea 
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="描述您面臨的「瓶頸、風險或戰術需求」，AI 將掃描知識庫 DNA 為您提供對齊建議..."
                  className="w-full p-10 bg-white/5 border border-white/10 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-amber-500/50 text-white font-medium text-xl min-h-[180px] leading-relaxed transition-all placeholder:text-stone-700"
               />
               <button 
                  onClick={handleAiStrategicSearch}
                  disabled={isAiAnalyzing || !aiInput.trim()}
                  className="absolute bottom-6 right-6 bg-amber-500 text-stone-900 px-8 py-4 rounded-2xl font-black text-sm tracking-widest flex items-center gap-3 shadow-2xl hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-20"
               >
                  {isAiAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} fill="currentColor" />}
                  {isAiAnalyzing ? "正在對齊基因..." : "啟動深度分析"}
               </button>
            </div>

            {/* AI 摘要展示區 (分析完成後顯現) */}
            {aiSummary && (
              <div className="pt-8 border-t border-white/5 ">
                 <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-white"><ShieldCheck size={120} /></div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-4">
                          <Terminal size={14} className="text-amber-500" />
                          <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">戰略合圍建議</span>
                       </div>
                       <p className="text-white text-lg font-medium leading-relaxed italic">
                          「 {aiSummary} 」
                       </p>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* 搜尋工具列 */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
          <input 
            value={searchTerm} 
            onChange={(e) => { setAiMatchIds([]); setSearchTerm(e.target.value); }} 
            placeholder="或使用關鍵字進行傳統搜尋..." 
            className="w-full pl-16 pr-6 py-4 rounded-2xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition-all font-bold text-stone-700 text-sm" 
          />
        </div>
        <div className="h-8 w-px bg-stone-100 mx-2 hidden md:block"></div>
        <select 
          value={filterGoal} 
          onChange={(e) => { setAiMatchIds([]); setFilterGoal(e.target.value as any); }} 
          className="pl-6 pr-12 py-4 rounded-2xl bg-stone-50 border-transparent font-bold text-stone-600 text-sm focus:ring-2 focus:ring-amber-100 cursor-pointer appearance-none outline-none"
        >
          <option value="all">所有類別</option>
          {INITIAL_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* 資料表格 */}
      <div className="bg-white rounded-[3.5rem] border border-stone-100 shadow-xl overflow-hidden min-h-[500px]">
        <table className="w-full text-left table-fixed border-collapse">
          <thead>
            <tr className="bg-stone-50/50">
              <th className={`${UI_TOKEN.TH} w-32`}>維度</th>
              <th className={`${UI_TOKEN.TH}`}>戰略資產名稱</th>
              <th className={`${UI_TOKEN.TH} w-[35%]`}>覆盤心法 (AAR)</th>
              <th className={`${UI_TOKEN.TH} w-44 text-right`}>貢獻者</th>
              <th className={`${UI_TOKEN.TH} w-24`}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {paginatedData.length > 0 ? paginatedData.map(asset => {
              const user = users.find(u => u.id === asset.creatorId);
              const isAiMatched = aiMatchIds.includes(asset.id) || aiMatchIds.some(id => asset.title.includes(id));
              const reason = aiReasoning[asset.id];

              return (
                <tr 
                  key={asset.id} 
                  onClick={() => onSelectTask(asset)}
                  className={`group cursor-pointer transition-all ${isAiMatched ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-stone-50/80'}`}
                >
                  <td className={UI_TOKEN.TD}>
                     <div className="flex items-center gap-2">
                        {isAiMatched && <Sparkles size={14} className="text-amber-500" fill="currentColor" />}
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isAiMatched ? 'bg-amber-500 text-stone-900 shadow-sm' : 'bg-stone-100 text-stone-400'}`}>
                           {asset.goal}
                        </span>
                     </div>
                  </td>
                  <td className={UI_TOKEN.TD}>
                     <div className="space-y-2">
                        <p className="font-black text-stone-800 text-base leading-tight group-hover:text-amber-600 transition-colors">{asset.title}</p>
                        {isAiMatched && reason && (
                          <div className="flex items-start gap-2 p-2 bg-white/80 rounded-xl border border-amber-200/50 shadow-sm ">
                             <ShieldAlert size={12} className="text-amber-600 shrink-0 mt-0.5" />
                             <p className="text-[10px] font-black text-amber-800 italic leading-tight">AI 理由：{reason}</p>
                          </div>
                        )}
                     </div>
                  </td>
                  <td className={UI_TOKEN.TD}>
                     <div className="flex items-start gap-2">
                        <PenTool size={14} className="text-stone-300 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-stone-500 line-clamp-3 italic leading-relaxed">
                          「 {asset.problemSolved || "未留下戰術基因內容。"} 」
                        </p>
                     </div>
                  </td>
                  <td className={`${UI_TOKEN.TD} text-right`}>
                     <div className="flex items-center justify-end gap-3">
                        <div className="text-right">
                           <p className="text-xs font-black text-stone-700 mb-0.5">{user?.name}</p>
                           <p className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter">{new Date(asset.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                           {user?.name.charAt(0)}
                        </div>
                     </div>
                  </td>
                  <td className={UI_TOKEN.TD}>
                     <div className="flex justify-center text-stone-200 group-hover:text-amber-500 transition-all">
                        <div className="px-3 py-1.5 bg-stone-900 text-white text-[9px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 shadow-lg translate-x-2 group-hover:translate-x-0">
                           查看詳情 <ChevronRight size={12} />
                        </div>
                     </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="py-40 text-center">
                   <div className="flex flex-col items-center opacity-30">
                      <Archive size={64} className="mb-4 text-stone-200" />
                      <p className="font-black uppercase tracking-widest text-stone-400">目前無符合條件的數據</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁器 */}
      {totalPages > 1 && (
        <div className="bg-white px-8 py-6 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest">顯示行數</span>
              <div className="flex bg-stone-100 p-1 rounded-xl">
                 {[10, 20, 50].map(size => (
                   <button 
                     key={size} 
                     onClick={() => { setPageSize(size); setCurrentPage(1); }} 
                     className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${pageSize === size ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}
                   >
                     {size}
                   </button>
                 ))}
              </div>
           </div>
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={safeCurrentPage === 1} 
                className="p-3 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 transition-all disabled:opacity-20"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center min-w-[120px]">
                 <p className="text-sm font-black text-stone-800">第 {safeCurrentPage} / {totalPages} 頁</p>
                 <p className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter">共 {totalItems} 項資產</p>
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={safeCurrentPage === totalPages} 
                className="p-3 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 transition-all disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;