
import React from 'react';
import { TutorialTip } from '../types';
import { X, BookOpen, Lightbulb } from 'lucide-react';

interface TutorialModalProps {
  tip: TutorialTip;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ tip, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border-4 border-amber-100 transform transition-all scale-100">
        
        {/* Header with Icon */}
        <div className="bg-amber-50 p-6 flex flex-col items-center justify-center border-b border-amber-100 relative">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-amber-500">
              <Lightbulb size={32} fill="currentColor" className="opacity-80" />
           </div>
           <h3 className="text-xl font-bold text-stone-800 text-center">{tip.title}</h3>
           <div className="absolute top-4 right-4">
              <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
                 <X size={20} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-white">
           <div className="text-stone-600 text-base leading-relaxed whitespace-pre-wrap font-medium">
             {tip.content}
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-center">
           <button 
             onClick={onClose}
             className="bg-stone-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-stone-700 shadow-lg shadow-stone-200 transition-transform active:scale-95 flex items-center gap-2"
           >
             <BookOpen size={18} /> 我瞭解了
           </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
