'use client';

import React from 'react';

export default function Leaderboard() {
  const leaders = [
    { rank: 1, user: 'usr_1a4', score: 9850, streak: '14 weeks' },
    { rank: 2, user: 'usr_7b8', score: 8210, streak: '9 weeks' },
    { rank: 3, user: 'usr_9x2', score: 7900, streak: '8 weeks' },
  ];

  return (
    <div className="bg-black border border-gray-800 p-6 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4 flex justify-between items-center text-red-500">
        Global Integrity Rankings
        <span className="text-xs text-gray-500 uppercase tracking-widest">Top 3% percentile</span>
      </h2>
      <ul className="space-y-4">
        {leaders.map((leader) => (
          <li key={leader.user} className="flex justify-between items-center border-b border-gray-800 pb-3">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-gray-700">#{leader.rank}</span>
              <span className="font-mono">{leader.user}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-500">{leader.score} IS</div>
              <div className="text-xs text-gray-500">{leader.streak}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
