import { slides } from '../../data/slides';
import { techNetwork } from '../../sketches/techNetwork';
import { SlideContent } from '../SlideContent';

export function S08_TechStack({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[7]} sketch={techNetwork} isActive={isActive} />;
}
