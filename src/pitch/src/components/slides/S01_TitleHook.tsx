import { slides } from '../../data/slides';
import { titleParticles } from '../../sketches/titleParticles';
import { SlideContent } from '../SlideContent';

export function S01_TitleHook({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[0]} sketch={titleParticles} isActive={isActive} />;
}
