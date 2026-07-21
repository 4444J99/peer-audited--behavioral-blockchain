'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { FrictionAuditWizard } from '../../../components/FrictionAuditWizard';

export default function FrictionAuditPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-purple-400" />
        <h1 className="text-xl font-bold">Friction Audit</h1>
      </div>
      <p className="text-sm text-gray-400">
        This quick assessment identifies the friction points in your environment. Answer 5 questions
        to get personalized recommendations for making good habits easier and bad habits harder.
      </p>
      <FrictionAuditWizard />
    </div>
  );
}
