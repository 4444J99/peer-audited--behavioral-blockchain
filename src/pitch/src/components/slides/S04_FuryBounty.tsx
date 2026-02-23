import { slides } from '../../data/slides';
import { furyNetwork } from '../../sketches/furyNetwork';
import { SlideContent } from '../SlideContent';

export function S04_FuryBounty({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[3]} sketch={furyNetwork} isActive={isActive} />;
}
