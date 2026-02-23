import { slides } from '../data/slides';

interface HeaderProps {
  currentSlide: number;
  onJump: (index: number) => void;
}

export function Header({ currentSlide, onJump }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-lime-400" />
        <span className="text-lg md:text-xl font-bold tracking-widest text-white">STYX</span>
      </div>

      <div className="hidden md:flex space-x-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onJump(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? 'w-8 bg-lime-400'
                : 'w-2 bg-neutral-700 hover:bg-neutral-500'
            }`}
            title={s.title}
          />
        ))}
      </div>

      <div className="text-xs md:text-sm font-mono text-neutral-400 bg-neutral-900 px-2 py-1 rounded-md">
        {currentSlide + 1} / {slides.length}
      </div>
    </header>
  );
}
