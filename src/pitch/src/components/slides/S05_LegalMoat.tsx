import { slides } from '../../data/slides';
import { aegisShield } from '../../sketches/aegisShield';
import { SlideContent } from '../SlideContent';

export function S05_LegalMoat({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[4]} sketch={aegisShield} isActive={isActive} />;
}
