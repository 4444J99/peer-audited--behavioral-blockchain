import { slides } from '../../data/slides';
import { retentionCurve } from '../../sketches/retentionCurve';
import { SlideContent } from '../SlideContent';

export function S02_Problem({ isActive }: { isActive: boolean }) {
  return <SlideContent slide={slides[1]} sketch={retentionCurve} isActive={isActive} />;
}
