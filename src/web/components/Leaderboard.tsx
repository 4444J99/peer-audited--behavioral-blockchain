'use client';

import React, { useEffect, useState } from 'react';
import { api, LeaderboardEntry } from '../services/api-client';
import './Leaderboard.css';

type Period = 'weekly' | 'monthly' | 'alltime';

interface TierInfo {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  minScore: number;
  tierClass: string;
}

const TIERS: TierInfo[] = [
  { name: 'DIAMOND', color: '#b9f2ff', bgColor: 'rgba(185, 242, 255, 0.1)', icon: '💎', minScore: 90, tierClass: 'diamond' },
  { name: 'GOLD', color: '#ffd700', bgColor: 'rgba(255, 215, 0, 0.1)', icon: '🥇', minScore: 75, tierClass: 'gold' },
  { name: 'SILVER', color: '#c0c0c0', bgColor: 'rgba(192, 192, 192, 0.1)', icon: '🥈', minScore: 50, tierClass: 'silver' },
  { name: 'BRONZE', color: '#cd7f32', bgColor: 'rgba(205, 127, 50, 0.1)', icon: '🥉', minScore: 0, tierClass: 'bronze' },
];

function getTier(score: number): TierInfo {
  return TIERS.find(t => score >= t.minScore) || TIERS[TIERS.length - 1];
}

function getRankBadge(index: number): string {
  switch (index) {
    case 0: return '👑';
    case 1: return '⚔️';
    case 2: return '🛡️';
    default: return `#${index + 1}`;
  }
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('alltime');
  const [furyOfWeek, setFuryOfWeek] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    setLoading(true);
    // TODO: when backend supports ?period= filter, pass it here
    api.getLeaderboard(10)
      .then((data) => {
        setLeaders(data);
        // Fury of the Week = highest integrity score (first in sorted list)
        if (data.length > 0) setFuryOfWeek(data[0]);
      })
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="bg-black border border-gray-800 p-6 rounded-lg text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black tracking-wider text-red-500 uppercase">
          ⚔️ Tavern Board
        </h2>
        <div className="flex gap-1">
          {(['weekly', 'monthly', 'alltime'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs uppercase tracking-widest rounded transition-all ${
                period === p
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {p === 'alltime' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Fury of the Week Spotlight */}
      {furyOfWeek && (
        <div className="mb-6 p-4 rounded-lg border border-yellow-600/30 bg-gradient-to-r from-yellow-900/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 text-6xl opacity-10 -mr-2 -mt-2">👑</div>
          <div className="text-xs text-yellow-600 uppercase tracking-[0.3em] mb-1">
            Fury of the Week
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{getTier(furyOfWeek.integrity_score).icon}</span>
            <div>
              <div className="font-black text-lg text-white">
                {furyOfWeek.email.split('@')[0]}
              </div>
              <div className={`text-sm tier-${getTier(furyOfWeek.integrity_score).tierClass}-text`}>
                {getTier(furyOfWeek.integrity_score).name} · {furyOfWeek.integrity_score} IS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rankings */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">No warriors yet. Be the first.</p>
      ) : (
        <ul className="space-y-2">
          {leaders.map((leader, index) => {
            const tier = getTier(leader.integrity_score);
            return (
              <li
                key={leader.id}
                className={`flex justify-between items-center p-3 rounded-lg border transition-all duration-300 hover:scale-[1.01] tier-${tier.tierClass}-row`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <span className="w-10 text-center text-lg font-black">
                    {getRankBadge(index)}
                  </span>

                  {/* Tier Icon + Name */}
                  <div>
                    <div className="font-mono font-bold">
                      {leader.email.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-black tracking-[0.2em] px-2 py-0.5 rounded-full border tier-${tier.tierClass}-badge`}
                      >
                        {tier.icon} {tier.name}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        Joined {new Date(leader.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className={`font-black text-lg tier-${tier.tierClass}-text`}>
                    {leader.integrity_score}
                  </div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-widest">
                    Integrity
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
