'use client';

import React, { useState } from 'react';
import { Shield, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';

interface FrictionQuestion {
  id: string;
  question: string;
  description: string;
}

const FRICTION_QUESTIONS: FrictionQuestion[] = [
  { id: 'physical_effort', question: 'How much physical effort does your habit require?', description: '1 = very easy, 5 = very hard' },
  { id: 'setup_time', question: 'How many minutes does it take to prepare?', description: '1 = ready instantly, 5 = takes 30+ min to start' },
  { id: 'bad_habit_access', question: 'How easily can you access the bad habit?', description: '1 = blocked completely, 5 = one tap away' },
  { id: 'environment_triggers', question: 'How often are you triggered by your environment?', description: '1 = never, 5 = constantly' },
  { id: 'social_support', question: 'How much social support do you have?', description: '1 = strong support, 5 = going it alone' },
];

interface FrictionAuditWizardProps {
  onComplete?: (result: any) => void;
}

export function FrictionAuditWizard({ onComplete }: FrictionAuditWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (id: string, value: number) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const canProceed = () => {
    if (step < FRICTION_QUESTIONS.length) {
      return answers[FRICTION_QUESTIONS[step].id] !== undefined;
    }
    return true;
  };

  const handleNext = () => {
    if (step < FRICTION_QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      submitAudit();
    }
  };

  const submitAudit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/behavioral/friction-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResult(data);
      onComplete?.(data);
    } catch {
      setResult({ totalScore: 0, maxScore: 25, riskLevel: 'UNKNOWN', recommendations: ['Failed to submit audit.'] });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
          {result.riskLevel === 'HIGH' ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : result.riskLevel === 'MEDIUM' ? (
            <Shield className="w-5 h-5 text-yellow-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          <h3 className="text-lg font-semibold">Friction Score: {result.totalScore}/{result.maxScore}</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm inline-block ${
          result.riskLevel === 'HIGH' ? 'bg-red-900/50 text-red-300' :
          result.riskLevel === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300' :
          'bg-green-900/50 text-green-300'
        }`}>
          {result.riskLevel} Risk
        </div>
        {result.recommendations?.length > 0 && (
          <ul className="space-y-2 mt-3">
            {result.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-blue-400 mt-0.5">&bull;</span>
                {rec}
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => { setStep(0); setAnswers({}); setResult(null); }}
          className="text-sm text-blue-400 hover:text-blue-300">
          Retake Audit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Friction Audit
        </h3>
        <span className="text-sm text-gray-500">Step {step + 1} of {FRICTION_QUESTIONS.length}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((step + 1) / FRICTION_QUESTIONS.length) * 100}%` }} />
      </div>
      <div key={step} className="space-y-4">
        <p className="font-medium">{FRICTION_QUESTIONS[step].question}</p>
        <p className="text-sm text-gray-400">{FRICTION_QUESTIONS[step].description}</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(val => (
            <button key={val} onClick={() => setAnswer(FRICTION_QUESTIONS[step].id, val)}
              className={`w-12 h-12 rounded-lg text-lg font-bold transition-colors ${
                answers[FRICTION_QUESTIONS[step].id] === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {val}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(s => s - 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button disabled={!canProceed() || submitting} onClick={handleNext}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-30">
          {submitting ? 'Submitting...' : step < FRICTION_QUESTIONS.length - 1 ? 'Next' : 'Submit'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
