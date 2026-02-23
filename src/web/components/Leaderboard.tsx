'use client';

import React, { useEffect, useState } from 'react';
import { api, LeaderboardEntry } from '../services/api-client';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard(10)
      .then(setLeaders)
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-black border border-gray-800 p-6 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4 flex justify-between items-center text-red-500">
        Global Integrity Rankings
        <span className="text-xs text-gray-500 uppercase tracking-widest">Live</span>
      </h2>
      {loading ? (
        <p className="text-neutral-500 text-center py-4">Loading rankings...</p>
      ) : leaders.length === 0 ? (
        <p className="text-neutral-500 text-center py-4">No rankings available.</p>
      ) : (
        <ul className="space-y-4">
          {leaders.map((leader, index) => (
            <li key={leader.id} className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-gray-700">#{index + 1}</span>
                <span className="font-mono">{leader.email.split('@')[0]}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-500">{leader.integrity_score} IS</div>
                <div className="text-xs text-gray-500">Joined {new Date(leader.created_at).toLocaleDateString()}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
