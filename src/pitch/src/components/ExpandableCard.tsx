import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableCardProps {
  title: string;
  children: React.ReactNode;
  variant?: 'eli5' | 'qa';
}

export function ExpandableCard({ title, children, variant = 'eli5' }: ExpandableCardProps) {
  const [open, setOpen] = useState(false);

  const borderColor = variant === 'eli5' ? 'border-blue-500/30' : 'border-amber-500/30';
  const hoverBg = variant === 'eli5' ? 'hover:bg-blue-500/5' : 'hover:bg-amber-500/5';
  const dotColor = variant === 'eli5' ? 'bg-blue-400' : 'bg-amber-400';

  return (
    <div className={`border ${borderColor} rounded-lg bg-neutral-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${hoverBg} transition-colors`}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-medium text-neutral-200">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-neutral-300 leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
