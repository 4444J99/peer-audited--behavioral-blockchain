import React from 'react';
import { DynamicP5Background } from './P5Background';
import { sketchSlide10 } from './p5Sketches';

export const Slide10 = () => {
  return (
    <div className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
      <DynamicP5Background sketch={sketchSlide10} />
      <div className="absolute top-4 left-4 md:top-8 md:left-8 pointer-events-none z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 bg-neutral-950/80 p-2 rounded">The Ask</h2>
        <div className="inline-block px-4 py-2 md:px-6 md:py-3 bg-lime-400 text-neutral-950 font-extrabold text-lg md:text-2xl rounded-xl shadow-[0_0_30px_rgba(163,230,53,0.3)]">
          $1,500,000
        </div>
      </div>
    </div>
  );
};
