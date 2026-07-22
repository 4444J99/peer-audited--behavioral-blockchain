'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { AcademyCurriculum } from '../../../components/AcademyCurriculum';

export default function AcademyPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-yellow-400" />
        <h1 className="text-xl font-bold">Styx Academy</h1>
      </div>
      <p className="text-sm text-gray-400">
        Complete psychoeducation modules to earn rewards and build your behavioral science knowledge.
        Each module takes 8-20 minutes.
      </p>
      <AcademyCurriculum />
    </div>
  );
}
