'use client';

import React, { useState } from 'react';
import { Eye, Activity, AlertTriangle, Coffee } from 'lucide-react';

interface AuditorWellnessState {
  fatigueScore: number;
  biasRisk: string;
  recommendedBreak: boolean;
}

const biasColors: Record<string, string> = {
  LOW: 'bg-green-900/50 text-green-300 border-green-800/50',
  MEDIUM: 'bg-yellow-900/50 text-yellow-300 border-yellow-800/50',
  HIGH: 'bg-red-900/50 text-red-300 border-red-800/50',
};

export function AuditorWellnessPanel() {
  const [state, setState] = useState<AuditorWellnessState | null>(null);
  const [auditorId, setAuditorId] = useState('');
  const [consecutive, setConsecutive] = useState(0);
  const [avgTime, setAvgTime] = useState(30);
  const [rejectionRate, setRejectionRate] = useState(0.3);
  const [loading, setLoading] = useState(false);

  const assess = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/behavioral/auditor/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditorId: auditorId || 'current',
          consecutiveReviews: consecutive,
          avgReviewTimeSec: avgTime,
          recentRejectionRate: rejectionRate,
        }),
      });
      const data = await res.json();
      setState(data);
    } catch {
      setState({ fatigueScore: 0, biasRisk: 'LOW', recommendedBreak: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Consecutive Reviews</label>
          <input type="number" value={consecutive} onChange={e => setConsecutive(Number(e.target.value))}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200" min={0} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Avg Review Time (sec)</label>
          <input type="number" value={avgTime} onChange={e => setAvgTime(Number(e.target.value))}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200" min={1} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Rejection Rate</label>
          <input type="number" value={rejectionRate} onChange={e => setRejectionRate(Number(e.target.value))}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200" min={0} max={1} step={0.1} />
        </div>
      </div>

      <button onClick={assess} disabled={loading}
        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-30 transition-colors text-sm">
        {loading ? 'Assessing...' : 'Assess Wellness'}
      </button>

      {state && (
        <div className="space-y-3">
          <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Fatigue Score</span>
              </div>
              <span className={`text-sm font-bold ${
                state.fatigueScore > 60 ? 'text-red-400' : state.fatigueScore > 30 ? 'text-yellow-400' : 'text-green-400'
              }`}>{state.fatigueScore}/100</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${
                state.fatigueScore > 60 ? 'bg-red-500' : state.fatigueScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
              }`} style={{ width: `${state.fatigueScore}%` }} />
            </div>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg border ${biasColors[state.biasRisk] || 'bg-gray-900 border-gray-800'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Bias Risk</span>
            </div>
            <span className="text-sm font-bold">{state.biasRisk}</span>
          </div>

          {state.recommendedBreak && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <Coffee className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">Recommended: take a break before reviewing more</span>
            </div>
          )}

          {!state.recommendedBreak && state.fatigueScore < 30 && (
            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
              <Eye className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">Wellness status: good — no breaks needed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
