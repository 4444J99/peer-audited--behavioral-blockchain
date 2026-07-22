'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, Shield, TrendingUp, RefreshCw, Heart, Zap, Activity, BookOpen, ClipboardList, Eye } from 'lucide-react';
import { FrictionAuditWizard } from '../../components/FrictionAuditWizard';
import { GatewayOathFlow } from '../../components/GatewayOathFlow';

const FEATURES = [
  { href: '/behavioral/friction-audit', label: 'Friction Audit', icon: Shield, desc: 'Identify what makes good habits hard and bad habits easy.' },
  { href: '/behavioral/habit-strength', label: 'Habit Strength', icon: TrendingUp, desc: 'Track how automatic your habits have become.' },
  { href: '/behavioral/gateway-oath', label: 'Gateway Oath', icon: Zap, desc: 'Start small with micro-stakes and the two-minute rule.' },
  { href: '/behavioral/reentry', label: 'Re-entry Path', icon: RefreshCw, desc: 'Bounce back after a failed contract.' },
  { href: '/behavioral/academy', label: 'Styx Academy', icon: BookOpen, desc: 'Learn behavioral science through 8 psychoeducation modules.' },
  { href: '/behavioral/assessment', label: 'Intake Assessment', icon: ClipboardList, desc: 'Discover your behavioral archetype with an 8-question profile.' },
  { href: '/behavioral/auditor-wellness', label: 'Auditor Wellness', icon: Eye, desc: 'Monitor fatigue and bias risk for peer reviewers.' },
];

export default function BehavioralPage() {
  const [habitStrength, setHabitStrength] = useState<{ strength: number; label: string } | null>(null);

  useEffect(() => {
    fetch('/api/behavioral/habit-strength').then(r => r.json()).then(setHabitStrength).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold">Behavioral Tools</h1>
          <p className="text-sm text-gray-400">Science-backed features to build better habits</p>
        </div>
      </div>

      {habitStrength && habitStrength.strength > 0 && (
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overall Habit Strength</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              habitStrength.label === 'Identity' ? 'bg-blue-900/50 text-blue-300' :
              habitStrength.label === 'Automatic' ? 'bg-green-900/50 text-green-300' :
              'bg-yellow-900/50 text-yellow-300'
            }`}>{habitStrength.label}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${habitStrength.strength * 100}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map(f => {
          const Icon = f.icon;
          return (
            <Link key={f.href} href={f.href}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                <span className="font-semibold">{f.label}</span>
              </div>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
