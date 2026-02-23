import type p5 from 'p5';
import type { SlideData } from '../data/slides';
import { SlideShell } from './SlideShell';
import { P5Canvas } from './P5Canvas';
import { ContentRenderer } from './ContentRenderer';
import { ExpandableCard } from './ExpandableCard';

interface SlideContentProps {
  slide: SlideData;
  sketch: (p: p5) => void;
  isActive: boolean;
}

export function SlideContent({ slide, sketch, isActive }: SlideContentProps) {
  return (
    <SlideShell id={slide.id} background={isActive ? <P5Canvas sketch={sketch} /> : undefined}>
      <div className="w-full max-w-5xl mx-auto space-y-6 pt-16 pb-20 overflow-y-auto max-h-full scrollbar-hide px-2">
        {/* Title */}
        <div className="text-center animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-lg md:text-xl text-neutral-400 mt-2 font-medium">
              {slide.subtitle}
            </p>
          )}
        </div>

        {/* Content blocks */}
        <ContentRenderer blocks={slide.contentBlocks} />

        {/* Expandable cards */}
        <div className="space-y-3 animate-fade-in stagger-5">
          <ExpandableCard title="ELI5 — Explain Like I'm Five" variant="eli5">
            <p>{slide.eli5}</p>
          </ExpandableCard>

          <ExpandableCard title="Tough Questions" variant="qa">
            <div className="space-y-4">
              {slide.toughQuestions.map((qa, i) => (
                <div key={i}>
                  <p className="font-semibold text-amber-400 mb-1">Q: {qa.question}</p>
                  <p className="text-neutral-300">{qa.answer}</p>
                </div>
              ))}
            </div>
          </ExpandableCard>
        </div>
      </div>
    </SlideShell>
  );
}
