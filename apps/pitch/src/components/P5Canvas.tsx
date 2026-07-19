import { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface P5CanvasProps {
  sketch: (p: p5) => void;
  className?: string;
}

export function P5Canvas({ sketch, className = '' }: P5CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const instance = new p5(sketch, containerRef.current);

    return () => {
      instance.remove();
    };
  }, [sketch, mounted]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden ${className}`}
    />
  );
}
