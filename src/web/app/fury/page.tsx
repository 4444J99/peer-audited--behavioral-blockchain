import React from 'react';
import { Eye, ShieldAlert, CheckCircle, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FuryWorkbench() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-red-900/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-none flex items-center justify-center -rotate-12 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <Eye className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-red-500">The Panopticon</h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Fury Peer Review Pipeline</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-right">
            <p className="text-xs text-neutral-500">Available Bounties</p>
            <p className="font-black text-lime-400">142</p>
          </div>
          <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-right">
            <p className="text-xs text-neutral-500">Your Grading Score</p>
            <p className="font-black text-white">98.5%</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Video Player & Evidence */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="w-full aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden relative group">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-neutral-700 font-bold tracking-widest">[ PROTECTED VIDEO BUFFER ]</span>
            </div>
            
            {/* Meta Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-bold text-white border border-white/10 uppercase tracking-wider">
                Habit: 6AM Wakeup
              </span>
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-bold text-white border border-white/10">
                Timestamp: 05:58 AM EST
              </span>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
              <div className="h-full bg-red-600 w-1/3"></div>
            </div>
          </div>
          
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <h3 className="font-bold text-neutral-400 mb-2 uppercase text-xs tracking-widest">Reviewer Instructions</h3>
            <p className="text-white text-lg">Verify that the subject is physically out of bed, visible in frame, and conscious.</p>
          </div>
        </div>

        {/* Voting Panel */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="p-6 bg-neutral-900 rounded-2xl border border-neutral-800 flex-1 flex flex-col">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Target size={20} className="text-red-500" /> Cast Judgment
            </h2>
            
            <p className="text-sm text-neutral-400 mb-8">
              Analyze the evidence. If the user successfully completed the habit parameters, hit VERIFY. If they are forging, stalling, or failing, hit BURN. 
              <br/><br/>
              <strong className="text-red-500">WARNING:</strong> If you verify a Honeypot (fake proof) your entire grading score will drop and you will incur a financial penalty.
            </p>

            <div className="mt-auto space-y-4">
              <button className="w-full py-5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 font-black rounded-xl transition-all flex justify-center items-center gap-2 text-lg">
                <CheckCircle size={24} />
                VERIFY PROOF
              </button>
              
              <button className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.3)] text-lg">
                <ShieldAlert size={24} />
                BURN STAKE (FRAUD)
              </button>
            </div>
          </div>

          <Link href="/dashboard" className="w-full py-4 text-center text-neutral-500 hover:text-white font-bold text-sm bg-neutral-900 border border-neutral-800 rounded-xl transition-colors">
            EXIT PANOPTICON
          </Link>
        </div>

      </main>
    </div>
  );
}
