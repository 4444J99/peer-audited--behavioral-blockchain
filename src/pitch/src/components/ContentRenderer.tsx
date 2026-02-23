import type { ContentBlock, StatBlock, BulletBlock, CalloutBlock, FlowBlock, ColumnBlock } from '../data/slides';
import { StatCard } from './StatCard';

function renderStats(data: StatBlock, baseDelay: number) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.items.map((item, i) => (
        <StatCard key={i} value={item.value} label={item.label} source={item.source} delay={baseDelay + i * 0.1} />
      ))}
    </div>
  );
}

function renderBullets(data: BulletBlock) {
  return (
    <div className="animate-fade-in-up stagger-2">
      {data.title && <h3 className="text-lg font-semibold text-white mb-3">{data.title}</h3>}
      <ul className="space-y-2">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-start text-sm text-neutral-300">
            <span className="text-lime-400 mr-2 mt-0.5 shrink-0">&bull;</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderCallout(data: CalloutBlock) {
  return (
    <div className="animate-fade-in-up stagger-3 border-l-2 border-lime-400 bg-neutral-900/60 rounded-r-lg px-5 py-4">
      <h4 className="text-sm font-bold text-lime-400 mb-1">{data.title}</h4>
      <p className="text-sm text-neutral-300 leading-relaxed">{data.body}</p>
    </div>
  );
}

function renderFlow(data: FlowBlock) {
  return (
    <div className="animate-fade-in-up stagger-1 flex flex-wrap items-center justify-center gap-2">
      {data.steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <span className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 text-sm text-neutral-200 font-mono">
            {step}
          </span>
          {i < data.steps.length - 1 && (
            <span className="text-lime-400 mx-2 text-lg">&rarr;</span>
          )}
        </div>
      ))}
    </div>
  );
}

function renderColumns(data: ColumnBlock) {
  const colClass =
    data.columns.length === 2
      ? 'md:grid-cols-2'
      : 'md:grid-cols-3';

  return (
    <div className={`animate-fade-in-up stagger-2 grid gap-4 grid-cols-1 ${colClass}`}>
      {data.columns.map((col, i) => (
        <div key={i} className="bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-5 backdrop-blur-sm">
          <h3 className="text-base font-bold text-lime-400 mb-3">{col.title}</h3>
          <ul className="space-y-2">
            {col.items.map((item, j) => (
              <li key={j} className="flex items-start text-sm text-neutral-300">
                <span className="text-neutral-500 mr-2 mt-0.5 shrink-0">&bull;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface ContentRendererProps {
  blocks: ContentBlock[];
}

export function ContentRenderer({ blocks }: ContentRendererProps) {
  return (
    <div className="space-y-5 w-full max-w-5xl">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'stat':
            return <div key={i}>{renderStats(block.data as StatBlock, i * 0.15)}</div>;
          case 'bullets':
            return <div key={i}>{renderBullets(block.data as BulletBlock)}</div>;
          case 'callout':
            return <div key={i}>{renderCallout(block.data as CalloutBlock)}</div>;
          case 'flow':
            return <div key={i}>{renderFlow(block.data as FlowBlock)}</div>;
          case 'columns':
            return <div key={i}>{renderColumns(block.data as ColumnBlock)}</div>;
        }
      })}
    </div>
  );
}
