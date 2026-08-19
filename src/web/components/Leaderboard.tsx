'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, getAuthToken, LeaderboardEntry } from '../services/api-client';
import './Leaderboard.css';

type Period = 'weekly' | 'monthly' | 'alltime';

const BOARD_SIZE = 10;
// Matches the server's SSE tick, so the fallback path is no staler than the stream.
const POLL_INTERVAL_MS = 30000;
const SSE_RECONNECT_MS = 5000;

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

  const applyBoard = useCallback((data: LeaderboardEntry[]) => {
    setLeaders(data);
    // Fury of the Week = highest integrity score (first in sorted list)
    if (data.length > 0) setFuryOfWeek(data[0]);
  }, []);

  useEffect(() => {
    setLoading(true);

    // Route through the Next.js /api rewrite so the SSE request is same-origin
    // and carries the HttpOnly stream ticket cookie.
    const API_BASE = '/api';
    const apiPeriod = period === 'alltime' ? undefined : period;
    let eventSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const loadBoard = async () => {
      try {
        const data = await api.getLeaderboard(BOARD_SIZE, apiPeriod);
        if (stopped) return;
        applyBoard(data);
      } catch {
        if (!stopped) setLeaders([]);
      } finally {
        if (!stopped) setLoading(false);
      }
    };

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(() => {
        void loadBoard();
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!pollInterval) return;
      clearInterval(pollInterval);
      pollInterval = null;
    };

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connectStream();
      }, SSE_RECONNECT_MS);
    };

    const connectStream = async () => {
      if (stopped) return;

      // The stream is guarded; an anonymous viewer and any runtime without
      // EventSource (SSR, older embedded webviews) stay on the polling path.
      const token = getAuthToken(); // allow-secret
      if (!token || typeof EventSource === 'undefined') {
        startPolling();
        return;
      }

      try {
        await api.issueLeaderboardStreamCookie();
        if (stopped) return;

        const params = new URLSearchParams({ limit: String(BOARD_SIZE) });
        if (apiPeriod) params.set('period', apiPeriod);

        const source = new EventSource(
          `${API_BASE}/dashboard/leaderboard/stream?${params.toString()}`,
          { withCredentials: true },
        );
        eventSource = source;

        source.onopen = () => {
          stopPolling();
        };

        source.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!Array.isArray(data)) return;
            applyBoard(data as LeaderboardEntry[]);
            setLoading(false);
          } catch {
            // Invalid message — ignore
          }
        };

        source.onerror = () => {
          source.close();
          if (eventSource === source) {
            eventSource = null;
          }
          startPolling();
          scheduleReconnect();
        };
      } catch {
        // SSE not available — use polling
        startPolling();
      }
    };

    void loadBoard();
    void connectStream();

    return () => {
      stopped = true;
      eventSource?.close();
      stopPolling();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [period, applyBoard]);

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
