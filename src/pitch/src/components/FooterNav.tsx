import { ChevronLeft, ChevronRight } from 'lucide-react';
import { slides } from '../data/slides';

interface FooterNavProps {
  currentSlide: number;
  onNext: () => void;
  onPrev: () => void;
}

export function FooterNav({ currentSlide, onNext, onPrev }: FooterNavProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md p-3 md:p-4 flex justify-between items-center">
      <button
        onClick={onPrev}
        disabled={currentSlide === 0}
        className="flex items-center px-4 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        <span className="font-medium">Prev</span>
      </button>

      <span className="text-xs text-neutral-500 font-mono hidden sm:block">
        {slides[currentSlide].title}
      </span>

      <button
        onClick={onNext}
        disabled={currentSlide === slides.length - 1}
        className="flex items-center px-4 py-2.5 rounded-lg bg-lime-500 text-neutral-950 font-bold hover:bg-lime-400 disabled:opacity-30 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
      >
        <span>Next</span>
        <ChevronRight className="w-5 h-5 ml-1" />
      </button>
    </footer>
  );
}
