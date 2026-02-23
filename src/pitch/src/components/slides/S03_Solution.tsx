import { slides } from '../../data/slides';
import { escrowGravity } from '../../sketches/escrowGravity';
import { SlideContent } from '../SlideContent';

export function S03_Solution({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[2]} sketch={escrowGravity} isActive={isActive} />;
}
