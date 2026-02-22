import React from 'react';
import { DynamicP5Background } from './P5Background';
import { sketchSlide1 } from './p5Sketches';

export const Slide1 = () => (
  <div className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
    <DynamicP5Background sketch={sketchSlide1} />
    {/* Text overlaid via CSS pointer-events-none so it doesn't block the canvas interaction */}
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center px-4">
       <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white drop-shadow-2xl">
         STYX
       </h1>
       <h2 className="text-xl md:text-3xl text-neutral-400 font-light mt-4 drop-shadow-xl">
         The <span className="text-lime-400 font-bold">Blockchain of Truth</span>
       </h2>
    </div>
  </div>
);
