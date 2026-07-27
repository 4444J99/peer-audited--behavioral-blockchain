'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';
import { IntakeAssessment } from '../../../components/IntakeAssessment';

export default function AssessmentPage() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-purple-400" />
        <h1 className="text-xl font-bold">Intake Assessment</h1>
      </div>
      <p className="text-sm text-gray-400">
        Answer 8 quick questions to discover your behavioral profile and archetype.
        This helps us personalize your habit-building experience.
      </p>
      <IntakeAssessment />
    </div>
  );
}
