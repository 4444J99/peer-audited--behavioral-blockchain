import { slides } from '../../data/slides';
import { milestoneRockets } from '../../sketches/milestoneRockets';
import { SlideContent } from '../SlideContent';

export function S10_TheAsk({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[9]} sketch={milestoneRockets} isActive={isActive} />;
}
