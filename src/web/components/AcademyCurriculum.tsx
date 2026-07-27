'use client';

import React, { useState } from 'react';
import { BookOpen, CheckCircle, Circle, Award, ChevronRight } from 'lucide-react';

interface AcademyModule {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  rewardCents: number;
}

const CURRICULUM: AcademyModule[] = [
  { id: 'AM-01', title: 'How Habits Work', description: 'The cue-routine-reward loop and why willpower fails', durationMin: 10, rewardCents: 25 },
  { id: 'AM-02', title: 'Friction Engineering', description: 'Design your environment for automatic good choices', durationMin: 15, rewardCents: 35 },
  { id: 'AM-03', title: 'The Two-Minute Rule', description: 'Start so small you cannot say no', durationMin: 8, rewardCents: 25 },
  { id: 'AM-04', title: 'Identity-Based Habits', description: 'I am the person who... — rewrite your self-concept', durationMin: 12, rewardCents: 35 },
  { id: 'AM-05', title: 'Temptation Bundling', description: 'Link want behaviors with need behaviors', durationMin: 10, rewardCents: 25 },
  { id: 'AM-06', title: 'Implementation Intentions', description: 'I will [X] at [TIME] in [LOCATION]', durationMin: 10, rewardCents: 25 },
  { id: 'AM-07', title: 'The 4 Laws of Behavior Change', description: 'Make it obvious, attractive, easy, satisfying', durationMin: 20, rewardCents: 50 },
  { id: 'AM-08', title: 'Recovery & Disenchantment', description: 'Why the old habit loses its grip', durationMin: 15, rewardCents: 35 },
];

export function AcademyCurriculum() {
  const [completed, setCompleted] = useState<string[]>([]);

  const toggleComplete = (id: string) => {
    setCompleted(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const total = CURRICULUM.length;
  const pct = Math.round((completed.length / total) * 100);
  const unlockedRewards = CURRICULUM.filter(m => completed.includes(m.id)).reduce((s, m) => s + m.rewardCents, 0);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold">Academy Progress</span>
          </div>
          <span className="text-sm text-gray-400">{completed.length}/{total} modules</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
          <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{pct}% complete</span>
          <span>{unlockedRewards}c unlocked</span>
        </div>
      </div>

      <div className="space-y-2">
        {CURRICULUM.map(mod => {
          const done = completed.includes(mod.id);
          return (
            <button key={mod.id} onClick={() => toggleComplete(mod.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                done
                  ? 'bg-green-900/20 border-green-800/50'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}>
              {done
                ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                : <Circle className="w-5 h-5 text-gray-500 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${done ? 'text-green-300' : 'text-gray-200'}`}>{mod.title}</span>
                  <span className="text-xs text-gray-500">{mod.durationMin} min</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{mod.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-400 shrink-0">
                <Award className="w-3 h-3" />
                <span>{mod.rewardCents}c</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
