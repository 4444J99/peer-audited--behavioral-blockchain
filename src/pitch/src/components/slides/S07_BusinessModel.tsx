import { slides } from '../../data/slides';
import { revenueWaterfall } from '../../sketches/revenueWaterfall';
import { SlideContent } from '../SlideContent';

export function S07_BusinessModel({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[6]} sketch={revenueWaterfall} isActive={isActive} />;
}
