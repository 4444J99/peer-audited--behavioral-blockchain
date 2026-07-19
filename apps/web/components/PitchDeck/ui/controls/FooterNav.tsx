import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { slidesData } from '../../data/slidesData';

interface FooterNavProps {
  currentSlideIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export const FooterNav: React.FC<FooterNavProps> = ({ currentSlideIndex, onNext, onPrev }) => {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 p-3 md:p-4 flex justify-between items-center shrink-0 z-30">
      <button 
        onClick={onPrev}
        disabled={currentSlideIndex === 0}
        className="flex-1 md:flex-none flex justify-center items-center px-4 md:px-6 py-3 md:py-2.5 rounded-lg border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors touch-manipulation"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> <span className="font-bold md:font-medium">Prev</span>
      </button>
      
      {/* Invisible spacer for flex-between on mobile */}
      <div className="w-4 md:w-8"></div>

      <button 
        onClick={onNext}
        disabled={currentSlideIndex === slidesData.length - 1}
        className="flex-1 md:flex-none flex justify-center items-center px-4 md:px-6 py-3 md:py-2.5 rounded-lg bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 disabled:opacity-30 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)] touch-manipulation"
      >
        <span>Next</span> <ChevronRight className="w-5 h-5 ml-1" />
      </button>
    </footer>
  );
};
