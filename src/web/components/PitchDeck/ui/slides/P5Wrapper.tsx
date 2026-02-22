"use client";
import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface P5WrapperProps {
  sketch: (p: p5) => void;
}

export default function P5Wrapper({ sketch }: P5WrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;
    
    // Create new p5 instance
    const instance = new p5(sketch, containerRef.current);
    
    return () => {
      // Clean up instance on unmount
      instance.remove();
    };
  }, [sketch, isMounted]);

  return (
    <div 
      ref={containerRef} 
      // We remove the opacity/pointer-events filters so that the canvas is fully 
      // interactive and bright enough to be the focal point of the slide.
      className="absolute inset-0 z-0 w-full h-full flex items-center justify-center overflow-hidden" 
    />
  );
}
