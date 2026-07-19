"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Wand2 } from 'lucide-react';
import { callGemini } from './services/gemini';
import { slidesData } from './data/slidesData';

import { Header } from './ui/controls/Header';
import { FooterNav } from './ui/controls/FooterNav';
import { FloatingELI5 } from './ui/controls/FloatingELI5';
import { ScriptPanel } from './ui/panels/ScriptPanel';
import { AIPanel } from './ui/panels/AIPanel';

import {
  Slide1, Slide2, Slide3, Slide4, Slide5,
  Slide6, Slide7, Slide8, Slide9, Slide10
} from './ui/slides';

export default function PitchDeck() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slide = slidesData[currentSlideIndex];

  // --- Layout & App State ---
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [rightTab, setRightTab] = useState('script'); // 'script' or 'ai'
  
  // --- Floating ELI5 State ---
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [slideExplanation, setSlideExplanation] = useState<string | null>(null);

  // --- Touch Swipe State ---
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Reset ELI5 state when slide changes
  useEffect(() => {
    setSlideExplanation(null);
  }, [currentSlideIndex]);

  const handleSimplifySlide = async () => {
    setIsSimplifying(true);
    try {
      const prompt = `Explain the core concept of this pitch deck slide to a 5-year-old. Keep it to one short, fun, and easy-to-understand paragraph.\n\nSlide Title: "${slide.title}"\nScript: "${slide.script}"`;
      const response = await callGemini(prompt);
      setSlideExplanation(response);
    } catch (error) {
      setSlideExplanation("Error generating explanation. Please try again.");
    }
    setIsSimplifying(false);
  };

  // --- Navigation Controls ---
  const nextSlide = () => {
    if (currentSlideIndex < slidesData.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const jumpToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex]);

  // Touch handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Only trigger if horizontal swipe is prominent (not just scrolling up/down)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        nextSlide(); // Swiped left
      } else {
        prevSlide(); // Swiped right
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const renderSlide = () => {
    switch(currentSlideIndex) {
      case 0: return <Slide1 />;
      case 1: return <Slide2 />;
      case 2: return <Slide3 />;
      case 3: return <Slide4 />;
      case 4: return <Slide5 />;
      case 5: return <Slide6 />;
      case 6: return <Slide7 />;
      case 7: return <Slide8 />;
      case 8: return <Slide9 />;
      case 9: return <Slide10 />;
      default: return <Slide1 />;
    }
  };

  return (
    // Note: use h-[100dvh] for mobile browsers
    <div className="flex flex-col h-[100dvh] bg-neutral-950 text-white font-sans overflow-hidden">
      
      {/* Custom Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }
      `}} />

      {/* Header / Nav */}
      <Header 
        currentSlideIndex={currentSlideIndex}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
        onJumpToSlide={jumpToSlide}
      />

      {/* Main Content Area: Splits into Slide and Script */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* LEFT/TOP COLUMN: Visual Presentation Board */}
        <div 
          className={`transition-all duration-500 bg-neutral-900 relative flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] lg:shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-y-auto overflow-x-hidden ${
            isPanelOpen ? 'h-[45vh] lg:h-full lg:flex-1 border-b lg:border-b-0 lg:border-r border-neutral-800' : 'h-full flex-1'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Internal padding container to ensure scrolling works well on mobile */}
          <div className="w-full max-w-5xl mx-auto p-6 md:p-12 animate-fade-in my-auto">
            {/* Dynamic Slide Rendering */}
            {renderSlide()}
          </div>

          {/* Floating AI Feature on the Slide */}
          <FloatingELI5 
            slideExplanation={slideExplanation}
            isSimplifying={isSimplifying}
            onSimplify={handleSimplifySlide}
            onClose={() => setSlideExplanation(null)}
          />
        </div>

        {/* RIGHT/BOTTOM COLUMN: Script Panel */}
        {isPanelOpen && (
          <div className="w-full h-[55vh] lg:h-full lg:w-[400px] xl:w-[500px] bg-neutral-950 flex flex-col animate-fade-in shrink-0">
            
            {/* Tabs (Horizontal Scrollable on mobile) */}
            <div className="flex border-b border-neutral-800 px-4 md:px-8 pt-4 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setRightTab('script')}
                className={`pb-3 px-4 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center border-b-2 transition-colors whitespace-nowrap touch-manipulation ${rightTab === 'script' ? 'border-lime-400 text-lime-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
              >
                <Play className="w-4 h-4 mr-2" /> Spoken Script
              </button>
              <button
                onClick={() => setRightTab('ai')}
                className={`pb-3 px-4 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center border-b-2 transition-colors whitespace-nowrap touch-manipulation ${rightTab === 'ai' ? 'border-purple-400 text-purple-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
              >
                <Wand2 className="w-4 h-4 mr-2" /> ✨ AI Co-Pilot
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">{slide.title}</h2>
              {slide.subtitle && <h3 className="text-lime-400 font-medium text-sm md:text-base mb-4 md:mb-6">{slide.subtitle}</h3>}
              
              {rightTab === 'script' ? (
                <ScriptPanel script={slide.script} />
              ) : (
                <AIPanel slide={slide} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Bottom Navigation Footer (Sticky) */}
      <FooterNav 
        currentSlideIndex={currentSlideIndex}
        onNext={nextSlide}
        onPrev={prevSlide}
      />
    </div>
  );
}