import React, { useState, useEffect } from 'react';
import { Target, Loader2, Wand2, MessageSquare, Crosshair, Mic, Zap } from 'lucide-react';
import { callGemini } from '../../services/gemini';

interface AIPanelProps {
  slide: {
    id: number;
    title: string;
    script: string;
    subtitle?: string;
  };
}

export const AIPanel: React.FC<AIPanelProps> = ({ slide }) => {
  // Local AI State
  const [isGeneratingTailor, setIsGeneratingTailor] = useState(false);
  const [aiAudience, setAiAudience] = useState('Technical VC');
  const [tailoredScript, setTailoredScript] = useState('');
  
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [hardQuestions, setHardQuestions] = useState<any[] | null>(null);
  
  const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);
  const [coachNotes, setCoachNotes] = useState<string[] | null>(null);
  
  const [isGeneratingAnalogy, setIsGeneratingAnalogy] = useState(false);
  const [slideAnalogy, setSlideAnalogy] = useState('');

  // Reset when slide changes
  useEffect(() => {
    setTailoredScript('');
    setHardQuestions(null);
    setCoachNotes(null);
    setSlideAnalogy('');
  }, [slide.id]);

  const handleTailorScript = async () => {
    setIsGeneratingTailor(true);
    try {
      const prompt = `Rewrite the following pitch deck script for the slide titled "${slide.title}". Tailor the delivery specifically for a ${aiAudience} investor. Keep it confident, punchy, and around the same length as the original.\n\nOriginal Script:\n${slide.script}`;
      const response = await callGemini(prompt);
      setTailoredScript(response);
    } catch (error) {
      setTailoredScript("Error generating script. Please try again.");
    }
    setIsGeneratingTailor(false);
  };

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
       const prompt = `Based on this pitch deck slide "${slide.title}" and its script:\n"${slide.script}"\n\nGenerate the 3 hardest, most critical questions a ruthless VC would ask. Then provide a bulletproof 1-2 sentence answer for each. Return ONLY a JSON array of objects with keys "question" and "answer". Do not wrap the JSON in markdown blocks.`;
       const responseText = await callGemini(prompt, true);
       const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
       setHardQuestions(JSON.parse(cleanJson));
    } catch (error) {
       console.error(error);
       setHardQuestions([{question: "Error generating questions.", answer: "Please try again."}]);
    }
    setIsGeneratingQuestions(false);
  };

  const handleGenerateCoach = async () => {
    setIsGeneratingCoach(true);
    try {
       const prompt = `Act as an elite TED Talk speaking coach. Analyze this pitch deck script:\n"${slide.script}"\n\nProvide exactly 3 short, actionable delivery tips (e.g., where to pause for dramatic effect, which specific words to emphasize, tone shifts). Return ONLY a JSON array of strings. Do not wrap the JSON in markdown blocks.`;
       const responseText = await callGemini(prompt, true);
       const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
       setCoachNotes(JSON.parse(cleanJson));
    } catch (error) {
       console.error(error);
       setCoachNotes(["Error generating coaching notes. Please try again."]);
    }
    setIsGeneratingCoach(false);
  };

  const handleGenerateAnalogy = async () => {
    setIsGeneratingAnalogy(true);
    try {
      const prompt = `Based on this pitch deck slide "${slide.title}" and its script:\n"${slide.script}"\n\nGenerate one powerful, memorable analogy to help an investor instantly understand the core concept of this slide. Keep it to exactly one sentence.`;
      const response = await callGemini(prompt);
      setSlideAnalogy(response);
    } catch (error) {
      setSlideAnalogy("Error generating analogy. Please try again.");
    }
    setIsGeneratingAnalogy(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-8">
      {/* AI Feature 1: Tailor Script */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-5 shadow-lg">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
           <h4 className="font-bold text-white flex items-center text-sm md:text-base"><Target className="w-4 h-4 mr-2 text-purple-400"/> Tailor Audience</h4>
           <select
              value={aiAudience}
              onChange={(e) => setAiAudience(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 text-sm rounded-lg px-3 py-2 sm:py-1.5 text-white outline-none focus:border-purple-400 transition-colors w-full sm:w-auto"
           >
             <option>Technical VC</option>
             <option>Financial Quant VC</option>
             <option>Visionary Angel</option>
           </select>
         </div>
         <button
           onClick={handleTailorScript}
           disabled={isGeneratingTailor}
           className="w-full py-3 md:py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-bold hover:bg-purple-500/20 disabled:opacity-50 flex justify-center items-center transition-all touch-manipulation"
         >
           {isGeneratingTailor ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Wand2 className="w-4 h-4 mr-2"/>}
           Rewrite Script
         </button>
         {tailoredScript && (
           <div className="mt-4 p-4 bg-neutral-950 rounded-lg text-neutral-300 text-sm leading-relaxed border border-neutral-800 font-serif italic relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-lg"></div>
             {tailoredScript.split('\n\n').map((p, i) => <p key={i} className="mb-3 last:mb-0">{p}</p>)}
           </div>
         )}
      </div>

      {/* AI Feature 2: Grill Me */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-5 shadow-lg">
         <h4 className="font-bold text-white flex items-center mb-2 text-sm md:text-base"><MessageSquare className="w-4 h-4 mr-2 text-red-400"/> Anticipate Questions</h4>
         <p className="text-xs text-neutral-400 mb-4 leading-relaxed">Simulate a hostile investor Q&A. Generate 3 hard questions.</p>
         <button
           onClick={handleGenerateQuestions}
           disabled={isGeneratingQuestions}
           className="w-full py-3 md:py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold hover:bg-red-500/20 disabled:opacity-50 flex justify-center items-center transition-all touch-manipulation"
         >
           {isGeneratingQuestions ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Crosshair className="w-4 h-4 mr-2"/>}
           Grill Me
         </button>
         {hardQuestions && (
           <div className="mt-4 space-y-4">
              {hardQuestions.map((qa, i) => (
                 <div key={i} className="bg-neutral-950 p-3 md:p-4 rounded-lg border border-neutral-800 relative">
                   <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-lg"></div>
                   <div className="text-sm text-red-400 font-bold mb-1 md:mb-2">Q: {qa.question}</div>
                   <div className="text-sm text-lime-400">A: {qa.answer}</div>
                 </div>
              ))}
           </div>
         )}
      </div>

      {/* AI Feature 3: Pitch Coach */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-5 shadow-lg">
         <h4 className="font-bold text-white flex items-center mb-2 text-sm md:text-base"><Mic className="w-4 h-4 mr-2 text-blue-400"/> Delivery Coach</h4>
         <p className="text-xs text-neutral-400 mb-4 leading-relaxed">Get AI-generated stage directions and vocal emphasis tips.</p>
         <button
           onClick={handleGenerateCoach}
           disabled={isGeneratingCoach}
           className="w-full py-3 md:py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold hover:bg-blue-500/20 disabled:opacity-50 flex justify-center items-center transition-all touch-manipulation"
         >
           {isGeneratingCoach ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Mic className="w-4 h-4 mr-2"/>}
           Get Coaching Notes
         </button>
         {coachNotes && (
           <div className="mt-4 space-y-2">
              {coachNotes.map((note, i) => (
                 <div key={i} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-start">
                   <span className="text-blue-400 mr-2 md:mr-3 font-bold">{i+1}.</span>
                   <p className="text-xs md:text-sm text-neutral-300">{note}</p>
                 </div>
              ))}
           </div>
         )}
      </div>

      {/* AI Feature 4: Analogy Generator */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-5 shadow-lg">
         <h4 className="font-bold text-white flex items-center mb-2 text-sm md:text-base"><Zap className="w-4 h-4 mr-2 text-yellow-400"/> Explain with an Analogy</h4>
         <p className="text-xs text-neutral-400 mb-4 leading-relaxed">Generate a 1-sentence analogy to make this click instantly.</p>
         <button
           onClick={handleGenerateAnalogy}
           disabled={isGeneratingAnalogy}
           className="w-full py-3 md:py-2.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-bold hover:bg-yellow-500/20 disabled:opacity-50 flex justify-center items-center transition-all touch-manipulation"
         >
           {isGeneratingAnalogy ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Zap className="w-4 h-4 mr-2"/>}
           Generate Analogy
         </button>
         {slideAnalogy && (
           <div className="mt-4 p-4 bg-neutral-950 rounded-lg text-neutral-300 text-sm leading-relaxed border border-yellow-500/30 italic relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 rounded-l-lg"></div>
             "{slideAnalogy}"
           </div>
         )}
      </div>
    </div>
  );
};
