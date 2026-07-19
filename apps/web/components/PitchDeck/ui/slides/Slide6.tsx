import React from 'react';
import { DynamicP5Background } from './P5Background';
import { sketchSlide6 } from './p5Sketches';

export const Slide6 = () => (
  <div className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
    <DynamicP5Background sketch={sketchSlide6} />
    <div className="absolute top-4 left-4 md:top-8 md:left-8 pointer-events-none z-10">
      <h2 className="text-3xl md:text-4xl font-bold bg-neutral-950/80 p-2 rounded">Market Pipeline</h2>
      <p className="text-neutral-400 text-lg md:text-xl mt-1 md:mt-2 bg-neutral-950/80 p-2 rounded">From B2C to Unicorn B2B</p>
    </div>
  </div>
);
