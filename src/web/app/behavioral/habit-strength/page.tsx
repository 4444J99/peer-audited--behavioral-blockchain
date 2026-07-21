'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { HabitStrengthChart } from '../../../components/HabitStrengthChart';

export default function HabitStrengthPage() {
  const [data, setData] = useState<{ strength: number; label: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/behavioral/habit-strength')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData({ strength: 0, label: 'Fragile' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-purple-400" />
        <h1 className="text-xl font-bold">Habit Strength</h1>
      </div>
      <p className="text-sm text-gray-400">
        Your habit strength score measures how automatic your commitment has become, from Fragile to Identity.
        The more consistently you attest, the stronger the habit becomes.
      </p>
      <HabitStrengthChart strength={data?.strength ?? 0} label={data?.label ?? 'Fragile'} loading={loading} />
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 text-sm text-gray-400 space-y-2">
        <p><strong className="text-gray-200">Fragile (0-0.2):</strong> Every proof is a battle. Focus on showing up.</p>
        <p><strong className="text-gray-200">Developing (0.2-0.4):</strong> Building momentum. Consistency matters most.</p>
        <p><strong className="text-gray-200">Established (0.4-0.6):</strong> The habit is sticking. Watch for boredom.</p>
        <p><strong className="text-gray-200">Automatic (0.6-0.8):</strong> Runs on autopilot. Time to level up?</p>
        <p><strong className="text-gray-200">Identity (0.8-1.0):</strong> This is who you are now. Omega territory.</p>
      </div>
    </div>
  );
}
