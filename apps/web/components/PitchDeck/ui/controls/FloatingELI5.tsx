import React from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface FloatingELI5Props {
  slideExplanation: string | null;
  isSimplifying: boolean;
  onSimplify: () => void;
  onClose: () => void;
}

export const FloatingELI5: React.FC<FloatingELI5Props> = ({
  slideExplanation,
  isSimplifying,
  onSimplify,
  onClose
}) => {
  return (
    <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end pointer-events-none">
      {slideExplanation && (
        <div className="mb-3 p-4 bg-neutral-950/95 backdrop-blur-md border border-lime-500/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] w-[85vw] md:max-w-sm text-sm text-neutral-200 relative animate-fade-in pointer-events-auto origin-bottom-right">
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-full p-1.5 transition-colors touch-manipulation"
          >
            <X className="w-3 h-3"/>
          </button>
          <div className="text-lime-400 font-bold mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2"/> ELI5
          </div>
          <div className="leading-relaxed">
            {slideExplanation}
          </div>
        </div>
      )}
      <button
         onClick={onSimplify}
         disabled={isSimplifying}
         className="pointer-events-auto px-4 py-2 md:px-5 md:py-2.5 bg-neutral-950 border border-neutral-700 rounded-full text-xs md:text-sm font-bold text-neutral-300 shadow-xl hover:border-lime-400 hover:text-lime-400 transition-all flex items-center active:scale-95 touch-manipulation disabled:opacity-50"
      >
         {isSimplifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-1 md:mr-2 text-lime-400"/>}
         <span className="hidden sm:inline">Explain Like I'm 5</span>
         <span className="sm:hidden">ELI5</span>
      </button>
    </div>
  );
};
