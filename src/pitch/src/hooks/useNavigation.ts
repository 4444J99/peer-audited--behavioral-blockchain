import { useState, useEffect, useCallback } from 'react';
import { slides } from '../data/slides';

const TOTAL = slides.length;

export function useNavigation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // IntersectionObserver to track which section is in view
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-section]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-section') || '0', 10);
            setCurrentSlide(idx);
          }
        }
      },
      { threshold: 0.3 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Scroll-reveal observer
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll('[data-reveal], [data-reveal-left], [data-reveal-scale]');

    if (prefersReduced) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const parent = entry.target.parentElement;
            const siblings = parent ? Array.from(parent.children) : [];
            const idx = siblings.indexOf(entry.target as Element);
            const delay = Math.max(0, idx) * 120;
            setTimeout(() => entry.target.classList.add('visible'), delay);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(TOTAL - 1, index));
    // Scroll to the sketch stage (visual intro) for this slide
    const stages = document.querySelectorAll<HTMLElement>('.sketch-stage');
    const target = stages[clamped] || document.querySelector(`[data-section="${clamped}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(currentSlide + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(currentSlide - 1);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentSlide, goTo]);

  return { currentSlide, goTo };
}
