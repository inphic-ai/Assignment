import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, MessageSquare, Zap, Sun, Briefcase, Target, Send, Loader2, Info, Plus } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Task, TimeType } from '~/types';

interface FocusFlowAssistantProps {
  tasks: Task[];
  currentUser: any;
  onQuickCreate: (type: TimeType) => void;
}

const FocusFlowAssistant: React.FC<FocusFlowAssistantProps> = ({ tasks, currentUser, onQuickCreate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // Fix: Follow guidelines for GoogleGenAI initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `你是 FocusFlow 戰略指揮官。你的核心邏輯是：
          1. 雜事 (Misc) = 用「分鐘」計算 (< 60m)。
          2. 今日事 (Daily) = 用「小時」計算 (1-8h)。
          3. 任務 (Task/Long) = 用「天」計算 (> 1 day)。
          4. 案子 (Project) = 雜事 + 今日事 + 任務 的總和。
          
          如果使用者輸入的是一個模糊的目標或案子名稱，請主動協助他拆解成以上三種維度。
          回答風格：俐落、軍事風格、充滿戰略感。`,
        },
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "指揮官目前斷訊，請稍後再試。" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "連線異常，請確認 API Key 設定。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 浮動啟動按鈕 - 改為更精緻的圓型圖示 */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-[0_10px_40px_rgba(249,115,22,0.4)] z-[100] ${isOpen ? 'bg-stone-900 rotate-90' : 'bg-orange-500 hover:scale-110 active:scale-95'}`}
      >
        {isOpen ? <X className="text-white" /> : <Sparkles className="text-white" fill="currentColor" size={28} />}
      </button>

      {/* 戰略中心面板 - 依照截圖設計 */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[400px] h-[650px] bg-white rounded-[2.5rem] shadow-[0_25px_100px_rgba(0,0,0,0.2)] border border-stone-100 z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
          
          {/* Header Area (截圖深色部分) */}
          <div className="bg-[#1c1917] p-8 pb-10 flex flex-col items-center">
             <div className="flex items-center gap-2 mb-8 self-start">
                <div className="w-6 h-6 rounded-full border-2 border-orange-500 flex items-center justify-center">
                   <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">FOCUSFLOW 戰略中心</h3>
             </div>

             <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  { label: '雜事', unit: '分鐘', type: 'misc' },
                  { label: '今日事', unit: '小時', type: 'daily' },
                  { label: '任務', unit: '天算', type: 'long' },
                ].map(dim => (
                  <button 
                    key={dim.type}
                    onClick={() => onQuickCreate(dim.type as TimeType)}
                    className="bg-white/10 hover:bg-white/20 transition-all py-4 px-2 rounded-2xl flex flex-col items-center group active:scale-95"
                  >
                    <span className="text-[11px] font-bold text-stone-500 mb-1 group-hover:text-stone-300">{dim.label}</span>
                    <span className="text-sm font-black text-white">{dim.unit}</span>
                  </button>
                ))}
             </div>
             
             <div className="mt-5">
                <p className="text-[10px] font-black text-orange-500/80 uppercase tracking-widest">案子 = 雜事 + 今日事 + 任務</p>
             </div>
          </div>

          {/* Chat / Content Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                 <div className="w-20 h-20 rounded-[2rem] bg-stone-50 flex items-center justify-center text-stone-200 mb-6">
                    <Zap size={40} strokeWidth={1.5} />
                 </div>
                 <p className="text-stone-400 font-bold leading-relaxed">
                   我是你的指揮官<br/>
                   <span className="text-xs">需要幫你拆解案子還是規劃今日？</span>
                 </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-medium leading-relaxed ${m.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none shadow-lg shadow-orange-500/20' : 'bg-stone-50 text-stone-800 rounded-tl-none border border-stone-100'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-stone-50 p-5 rounded-3xl rounded-tl-none border border-stone-100">
                   <Loader2 size={20} className="animate-spin text-stone-400" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8 pt-0 bg-white shrink-0">
             <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-[2rem] border border-stone-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50 transition-all">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="詢問戰略建議..."
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-stone-700"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 bg-stone-900 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-all active:scale-90 shadow-lg"
                >
                  <Send size={18} fill="currentColor" />
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FocusFlowAssistant;