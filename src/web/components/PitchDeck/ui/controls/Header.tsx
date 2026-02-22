import React from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { slidesData } from '../../data/slidesData';

interface HeaderProps {
  currentSlideIndex: number;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  onJumpToSlide: (index: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSlideIndex,
  isPanelOpen,
  onTogglePanel,
  onJumpToSlide
}) => {
  return (
    <header className="flex justify-between items-center px-4 md:px-8 py-3 md:py-4 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md z-30 shrink-0">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-lime-400"></div>
        <span className="text-lg md:text-xl font-bold tracking-widest text-white">STYX</span>
      </div>
      
      {/* Progress Dots (Hidden on very small screens) */}
      <div className="hidden md:flex space-x-2">
        {slidesData.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onJumpToSlide(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlideIndex ? 'w-8 bg-lime-400' : 'w-2 bg-neutral-700 hover:bg-neutral-500'
            }`}
            title={s.title}
          />
        ))}
      </div>
      
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="text-xs md:text-sm font-mono text-neutral-400 bg-neutral-900 px-2 py-1 rounded-md">
          {currentSlideIndex + 1} / {slidesData.length}
        </div>
        <button 
          onClick={onTogglePanel}
          className="p-2 md:p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors active:scale-95 touch-manipulation"
          title="Toggle Script Panel"
        >
          {isPanelOpen ? <PanelRightClose className="w-4 h-4 md:w-5 md:h-5" /> : <PanelRightOpen className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
      </div>
    </header>
  );
};
