import { useNavigation } from './hooks/useNavigation';
import { slides } from './data/slides';
import { SlideSection } from './components/SlideSection';

export default function App() {
  const { currentSlide, goTo } = useNavigation();

  return (
    <>
      {/* Nav dots — right side */}
      <nav id="nav-dots" aria-label="Section navigation">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`nav-dot ${i === currentSlide ? 'active' : ''}`}
            onClick={() => goTo(i)}
            title={s.title}
            aria-label={`Go to ${s.title}`}
          />
        ))}
      </nav>

      {/* Sections — natural scroll */}
      <main>
        {slides.map((slide, i) => (
          <SlideSection key={slide.id} slide={slide} index={i} isActive={i === currentSlide} />
        ))}
      </main>
    </>
  );
}
