import { slides } from '../data/slides';

interface SideDotsProps {
  currentSlide: number;
  onJump: (index: number) => void;
}

export function SideDots({ currentSlide, onJump }: SideDotsProps) {
  return (
    <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col space-y-3">
      {slides.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onJump(i)}
          className="group flex items-center"
          title={s.title}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? 'bg-lime-400 scale-125'
                : 'bg-neutral-700 group-hover:bg-neutral-400'
            }`}
          />
          <span
            className={`ml-3 text-xs font-mono transition-all duration-300 whitespace-nowrap ${
              i === currentSlide
                ? 'opacity-100 text-lime-400'
                : 'opacity-0 group-hover:opacity-100 text-neutral-400'
            }`}
          >
            {String(i + 1).padStart(2, '0')} {s.title}
          </span>
        </button>
      ))}
    </nav>
  );
}
