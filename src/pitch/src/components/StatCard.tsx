interface StatCardProps {
  value: string;
  label: string;
  source?: string;
  delay?: number;
}

export function StatCard({ value, label, source, delay = 0 }: StatCardProps) {
  return (
    <div
      className="animate-scale-in bg-neutral-900/80 border border-neutral-700/50 rounded-xl px-5 py-4 text-center backdrop-blur-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="text-2xl md:text-3xl font-bold text-lime-400 font-mono">
        {value}
      </div>
      <div className="text-sm text-neutral-300 mt-1">{label}</div>
      {source && (
        <div className="text-xs text-neutral-500 mt-1 italic">{source}</div>
      )}
    </div>
  );
}
