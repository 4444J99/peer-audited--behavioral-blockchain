import { slides } from '../../data/slides';
import { marketPipeline } from '../../sketches/marketPipeline';
import { SlideContent } from '../SlideContent';

export function S06_Market({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[5]} sketch={marketPipeline} isActive={isActive} />;
}
