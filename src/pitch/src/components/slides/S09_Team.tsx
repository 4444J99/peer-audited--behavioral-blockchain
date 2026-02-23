import { slides } from '../../data/slides';
import { teamGears } from '../../sketches/teamGears';
import { SlideContent } from '../SlideContent';

export function S09_Team({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[8]} sketch={teamGears} isActive={isActive} />;
}
