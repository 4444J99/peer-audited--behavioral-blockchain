'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { AuditorWellnessPanel } from '../../../components/AuditorWellnessPanel';

export default function AuditorWellnessPage() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Eye className="w-6 h-6 text-purple-400" />
        <h1 className="text-xl font-bold">Auditor Wellness</h1>
      </div>
      <p className="text-sm text-gray-400">
        Monitor fatigue, bias risk, and review quality for peer auditors.
        Regular wellness checks prevent empathy fatigue and ensure fair verdicts.
      </p>
      <AuditorWellnessPanel />
    </div>
  );
}
