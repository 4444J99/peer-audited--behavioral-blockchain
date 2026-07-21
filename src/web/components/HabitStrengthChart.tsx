'use client';

import React from 'react';
import { TrendingUp, Flame, AlertTriangle } from 'lucide-react';

interface HabitStrengthChartProps {
  strength: number;
  label: string;
  loading?: boolean;
}

const STRENGTH_COLORS: Record<string, string> = {
  Fragile: 'bg-red-500',
  Developing: 'bg-orange-500',
  Established: 'bg-yellow-500',
  Automatic: 'bg-green-500',
  Identity: 'bg-blue-500',
};

export function HabitStrengthChart({ strength, label, loading }: HabitStrengthChartProps) {
  if (loading) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-4" />
        <div className="h-8 bg-gray-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Habit Strength
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          label === 'Identity' ? 'bg-blue-900/50 text-blue-300' :
          label === 'Automatic' ? 'bg-green-900/50 text-green-300' :
          label === 'Established' ? 'bg-yellow-900/50 text-yellow-300' :
          label === 'Developing' ? 'bg-orange-900/50 text-orange-300' :
          'bg-red-900/50 text-red-300'
        }`}>
          {label}
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${STRENGTH_COLORS[label] || 'bg-gray-500'}`}
          style={{ width: `${Math.min(strength * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Fragile</span>
        <span>Developing</span>
        <span>Established</span>
        <span>Automatic</span>
        <span>Identity</span>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        {strength < 0.2 ? 'Keep showing up. Every proof builds the groove.' :
         strength < 0.4 ? 'You are building momentum. Consistency is key.' :
         strength < 0.6 ? 'This is becoming part of your routine. Push through.' :
         strength < 0.8 ? 'Strong habits resist disruption. You are almost there.' :
         'This habit is core to who you are. Automatic execution.'}
      </p>
    </div>
  );
}
