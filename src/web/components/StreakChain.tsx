'use client';

import React from 'react';
import { Flame, Zap, AlertTriangle } from 'lucide-react';

interface StreakDay {
  date: string;
  attested: boolean;
  graceUsed: boolean;
  chainBroken: boolean;
}

interface StreakChainProps {
  days: StreakDay[];
  currentStreak: number;
  longestStreak: number;
  neverMissTwiceActive: boolean;
  penaltyMultiplier: number;
  loading?: boolean;
}

export default function StreakChain({
  days,
  currentStreak,
  longestStreak,
  neverMissTwiceActive,
  penaltyMultiplier,
  loading,
}: StreakChainProps) {
  if (loading) {
    return (
      <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl animate-pulse">
        <div className="h-4 w-32 bg-neutral-800 rounded mb-4" />
        <div className="flex gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-8 w-3 bg-neutral-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const latestDays = days.slice(-30);

  return (
    <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Flame className="text-red-500" size={20} />
          <h2 className="text-xl font-bold tracking-tighter">STREAK CHAIN</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-400">
            Current: <strong className={currentStreak > 0 ? 'text-green-500' : 'text-neutral-500'}>{currentStreak}d</strong>
          </span>
          <span className="text-neutral-400">
            Best: <strong className="text-yellow-500">{longestStreak}d</strong>
          </span>
        </div>
      </div>

      <div className="flex gap-1 items-end mb-4 overflow-x-auto pb-2">
        {latestDays.map((day, i) => {
          const isToday = i === latestDays.length - 1;
          const dayNum = new Date(day.date).getDate();

          let bg: string;
          let tooltip: string;

          if (day.attested) {
            bg = 'bg-green-600';
            tooltip = `${day.date}: Attested`;
          } else if (day.graceUsed) {
            bg = 'bg-yellow-600';
            tooltip = `${day.date}: Grace day`;
          } else if (day.chainBroken) {
            bg = 'bg-red-800';
            tooltip = `${day.date}: Chain broken`;
          } else if (isToday) {
            bg = 'bg-neutral-700';
            tooltip = `${day.date}: Today — pending`;
          } else {
            bg = 'bg-neutral-800';
            tooltip = `${day.date}: Missed`;
          }

          return (
            <div
              key={day.date}
              className={`relative group flex-1 min-w-[8px] max-w-[16px] ${bg} rounded-t cursor-pointer transition-all hover:opacity-80`}
              style={{ height: day.attested ? '32px' : day.graceUsed ? '24px' : '16px' }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="bg-neutral-800 text-xs text-neutral-200 px-2 py-1 rounded whitespace-nowrap border border-neutral-700">
                  {tooltip}
                </div>
              </div>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-neutral-600">
                {i % 5 === 0 ? dayNum : ''}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-6">
        <div className="w-3 h-3 bg-green-600 rounded" />
        <span>Attested</span>
        <div className="w-3 h-3 bg-yellow-600 rounded ml-3" />
        <span>Grace day</span>
        <div className="w-3 h-3 bg-red-800 rounded ml-3" />
        <span>Chain broken</span>
        <div className="w-3 h-3 bg-neutral-800 rounded ml-3" />
        <span>Missed</span>
      </div>

      {penaltyMultiplier > 1 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-400">
            Never Miss Twice active — penalty is {penaltyMultiplier}x daily rate for consecutive misses.
          </p>
        </div>
      )}

      {neverMissTwiceActive && currentStreak >= 3 && (
        <div className="mt-2 flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
          <Zap size={14} className="text-green-500 shrink-0" />
          <p className="text-xs text-green-400">
            Never Miss Twice shield active — first miss is free.
          </p>
        </div>
      )}
    </div>
  );
}
