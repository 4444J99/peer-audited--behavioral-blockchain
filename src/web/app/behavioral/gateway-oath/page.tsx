'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { GatewayOathFlow } from '../../../components/GatewayOathFlow';

export default function GatewayOathPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="w-6 h-6 text-green-400" />
        <h1 className="text-xl font-bold">Gateway Oath</h1>
      </div>
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 text-sm text-gray-400 space-y-2">
        <p>The Gateway Oath is our lowest-stakes entry point — based on BJ Fogg's Tiny Habits and the Two-Minute Rule.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Stakes: $1.00 – $2.00</li>
          <li>Duration: 3 – 14 days</li>
          <li>Max 3 Gateway Oaths per user lifetime</li>
          <li>Must complete before unlocking higher stakes</li>
        </ul>
      </div>
      <GatewayOathFlow />
    </div>
  );
}
