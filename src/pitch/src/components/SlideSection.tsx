import { useState, useRef, useEffect } from 'react';
import type p5 from 'p5';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type {
  SlideData,
  ContentBlock,
  StatBlock,
  BulletBlock,
  CalloutBlock,
  FlowBlock,
  ColumnBlock,
} from '../data/slides';
import { P5Canvas } from './P5Canvas';
import { titleParticles } from '../sketches/titleParticles';
import { retentionCurve } from '../sketches/retentionCurve';
import { escrowGravity } from '../sketches/escrowGravity';
import { furyNetwork } from '../sketches/furyNetwork';
import { aegisShield } from '../sketches/aegisShield';
import { marketPipeline } from '../sketches/marketPipeline';
import { revenueWaterfall } from '../sketches/revenueWaterfall';
import { costLayers } from '../sketches/costLayers';
import { techNetwork } from '../sketches/techNetwork';
import { teamGears } from '../sketches/teamGears';
import { milestoneRockets } from '../sketches/milestoneRockets';

interface SlideSectionProps {
  slide: SlideData;
  index: number;
  isActive: boolean;
}

const SKETCHES: ((p: p5) => void)[] = [
  titleParticles,
  retentionCurve,
  escrowGravity,
  furyNetwork,
  aegisShield,
  marketPipeline,
  revenueWaterfall,
  costLayers,
  techNetwork,
  teamGears,
  milestoneRockets,
];

export function SlideSection({ slide, index, isActive }: SlideSectionProps) {
  const isHero = index === 0;
  const isCta = index === 10;

  return (
    <>
      {/* Visual animation stage — precedes each slide */}
      <SketchStage
        sketch={SKETCHES[index]}
        isActive={isActive}
        isHero={isHero}
        isCta={isCta}
        slideNumber={index + 1}
        slideTitle={slide.title}
      />

      {/* Content section */}
      <section
        data-section={index}
        className={`slide-section ${isHero ? 'hero-section' : ''} ${isCta ? 'cta-section' : ''}`}
        style={{ flexDirection: 'column', minHeight: isHero || isCta ? '60vh' : undefined }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Label + Title */}
          <div data-reveal style={{ textAlign: isHero || isCta ? 'center' : undefined }}>
            {slide.subtitle && <p className="label">{slide.subtitle}</p>}
            <h2
              style={{
                fontSize: isHero ? 'clamp(3rem, 7vw, 6rem)' : 'clamp(1.8rem, 3.5vw, 2.8rem)',
                marginBottom: '1rem',
                color: isHero ? 'var(--accent)' : 'var(--ink)',
                letterSpacing: isHero ? '0.06em' : undefined,
              }}
            >
              {slide.title}
            </h2>
          </div>

          {/* Content blocks */}
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {slide.contentBlocks.map((block, i) => (
              <div key={i} data-reveal style={{ transitionDelay: `${i * 0.12}s` }}>
                <RenderBlock block={block} />
              </div>
            ))}
          </div>

          {/* Expandable ELI5 + Q&A */}
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Expandable title="ELI5 — Explain Like I'm Five" variant="eli5">
              <p>{slide.eli5}</p>
            </Expandable>
            <Expandable title="Tough Questions" variant="qa">
              {slide.toughQuestions.map((qa, i) => (
                <div key={i} className="qa-block">
                  <p className="qa-question">Q: {qa.question}</p>
                  <p className="qa-answer">{qa.answer}</p>
                </div>
              ))}
            </Expandable>
          </div>
        </div>
      </section>
    </>
  );
}

// ---- Sketch Stage: visual animation preceding each slide ----

function SketchStage({
  sketch,
  isActive,
  isHero,
  isCta,
  slideNumber,
  slideTitle,
}: {
  sketch: (p: p5) => void;
  isActive: boolean;
  isHero: boolean;
  isCta: boolean;
  slideNumber: number;
  slideTitle: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const height = isHero ? '100vh' : isCta ? '70vh' : '55vh';

  return (
    <div
      ref={stageRef}
      className="sketch-stage"
      style={{ height, position: 'relative', overflow: 'hidden' }}
    >
      {/* p5 canvas — rendered when in/near viewport */}
      {(visible || isActive) && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <P5Canvas sketch={sketch} />
        </div>
      )}

      {/* Overlay: slide number + title */}
      <div className="sketch-stage-overlay">
        {isHero ? (
          <>
            <span className="sketch-stage-title" style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', letterSpacing: '0.08em' }}>
              STYX
            </span>
            <span className="sketch-stage-subtitle">The Blockchain of Truth</span>
            <span className="scroll-hint" style={{ marginTop: '2rem' }}>scroll to explore ↓</span>
          </>
        ) : (
          <>
            <span className="sketch-stage-number">{String(slideNumber).padStart(2, '0')}</span>
            <span className="sketch-stage-title">{slideTitle}</span>
          </>
        )}
      </div>

      {/* Bottom fade into content */}
      <div className="sketch-stage-fade" />
    </div>
  );
}

// ---- Content Block Renderer ----

function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'stat':
      return <StatGrid data={block.data as StatBlock} />;
    case 'bullets':
      return <BulletList data={block.data as BulletBlock} />;
    case 'callout':
      return <Callout data={block.data as CalloutBlock} />;
    case 'flow':
      return <Flow data={block.data as FlowBlock} />;
    case 'columns':
      return <Columns data={block.data as ColumnBlock} />;
  }
}

function StatGrid({ data }: { data: StatBlock }) {
  return (
    <div className="stat-grid">
      {data.items.map((item, i) => (
        <div key={i} className="stat-card" data-reveal-scale style={{ transitionDelay: `${i * 0.1}s` }}>
          <div className="stat-value">{item.value}</div>
          <div className="stat-label">{item.label}</div>
          {item.source && <div className="stat-source">{item.source}</div>}
        </div>
      ))}
    </div>
  );
}

function BulletList({ data }: { data: BulletBlock }) {
  return (
    <div className="content-card">
      {data.title && <h3>{data.title}</h3>}
      <ul>
        {data.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Callout({ data }: { data: CalloutBlock }) {
  return (
    <div className="callout">
      <h4>{data.title}</h4>
      <p>{data.body}</p>
    </div>
  );
}

function Flow({ data }: { data: FlowBlock }) {
  return (
    <div className="flow-steps">
      {data.steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="flow-step">{step}</span>
          {i < data.steps.length - 1 && <span className="flow-arrow">→</span>}
        </div>
      ))}
    </div>
  );
}

function Columns({ data }: { data: ColumnBlock }) {
  const gridClass = data.columns.length <= 2 ? 'col-grid-2' : 'col-grid-3';
  return (
    <div className={gridClass}>
      {data.columns.map((col, i) => (
        <div key={i} className="content-card" data-reveal style={{ transitionDelay: `${i * 0.15}s` }}>
          <h3>{col.title}</h3>
          <ul>
            {col.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ---- Expandable ----

function Expandable({
  title,
  variant,
  children,
}: {
  title: string;
  variant: 'eli5' | 'qa';
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dotColor = variant === 'eli5' ? '#60a5fa' : '#fbbf24';

  return (
    <div className="expandable" data-reveal>
      <button className="expandable-trigger" onClick={() => setOpen(!open)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor,
              flexShrink: 0,
            }}
          />
          {title}
        </span>
        {open ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </button>
      {open && <div className="expandable-body">{children}</div>}
    </div>
  );
}
