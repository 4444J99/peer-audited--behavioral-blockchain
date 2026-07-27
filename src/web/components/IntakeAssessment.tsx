'use client';

import React, { useState } from 'react';
import { ClipboardList, ChevronRight, UserCheck } from 'lucide-react';

interface AssessmentQuestion {
  id: string;
  question: string;
  scale: string;
  dimension: string;
}

const QUESTIONS: AssessmentQuestion[] = [
  { id: 'AS-01', question: 'I follow through on commitments even when I do not feel like it', scale: 'agree_1_5', dimension: 'CONSCIENTIOUSNESS' },
  { id: 'AS-02', question: 'I act on impulse without thinking about consequences', scale: 'agree_1_5', dimension: 'IMPULSIVITY' },
  { id: 'AS-03', question: 'I am confident I can change my habits', scale: 'agree_1_5', dimension: 'SELF_EFFICACY' },
  { id: 'AS-04', question: 'How often do you feel motivated to work on your goals?', scale: 'frequency_1_5', dimension: 'MOTIVATION' },
  { id: 'AS-05', question: 'I have people in my life who support my growth', scale: 'agree_1_5', dimension: 'SOCIAL_SUPPORT' },
  { id: 'AS-06', question: 'I complete tasks I start', scale: 'agree_1_5', dimension: 'CONSCIENTIOUSNESS' },
  { id: 'AS-07', question: 'How important is personal growth to you right now?', scale: 'importance_1_5', dimension: 'MOTIVATION' },
  { id: 'AS-08', question: 'I can resist temptation when I set my mind to it', scale: 'agree_1_5', dimension: 'IMPULSIVITY' },
];

const SCALE_LABELS: Record<string, string[]> = {
  agree_1_5: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  frequency_1_5: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  importance_1_5: ['Not Important', 'Slightly', 'Moderately', 'Very', 'Extremely'],
};

const ARCHETYPE_EMOJI: Record<string, string> = {
  ACHIEVER: '🏆',
  STRUGGLER: '🌱',
  SOCIAL_DEPENDENT: '🤝',
  IMPULSIVE: '⚡',
  BALANCED: '⚖️',
};

export function IntakeAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (id: string, value: number) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/behavioral/intake-assessment/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setProfile(data);
    } catch {
      setProfile({
        conscientiousness: 3, impulsivity: 3, motivation: 3,
        selfEfficacy: 3, socialSupport: 3, archetype: 'BALANCED',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (profile) {
    const dims = [
      { key: 'conscientiousness', label: 'Conscientiousness', color: 'bg-blue-500' },
      { key: 'impulsivity', label: 'Impulsivity', color: 'bg-red-500' },
      { key: 'motivation', label: 'Motivation', color: 'bg-green-500' },
      { key: 'selfEfficacy', label: 'Self-Efficacy', color: 'bg-purple-500' },
      { key: 'socialSupport', label: 'Social Support', color: 'bg-yellow-500' },
    ] as const;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 text-center">
          <div className="text-3xl mb-2">{ARCHETYPE_EMOJI[profile.archetype] || '⚖️'}</div>
          <h3 className="text-lg font-bold text-purple-300">{profile.archetype.replace('_', ' ')}</h3>
          <p className="text-xs text-gray-400">Your behavioral archetype</p>
        </div>

        <div className="space-y-3">
          {dims.map(d => (
            <div key={d.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{d.label}</span>
                <span className="text-gray-400">{profile[d.key].toFixed(1)}/5</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className={`${d.color} h-2 rounded-full transition-all`}
                  style={{ width: `${(profile[d.key] / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => { setProfile(null); setAnswers({}); }}
          className="w-full py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm">
          Retake Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {QUESTIONS.map((q, idx) => (
        <div key={q.id} className="p-3 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs text-gray-500 mt-0.5">{idx + 1}.</span>
            <p className="text-sm text-gray-200">{q.question}</p>
          </div>
          <div className="flex justify-between gap-1 px-2">
            {[1, 2, 3, 4, 5].map(val => (
              <button key={val} onClick={() => setAnswer(q.id, val)}
                className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                  answers[q.id] === val
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {val}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {answers[q.id] ? SCALE_LABELS[q.scale]?.[answers[q.id] - 1] : SCALE_LABELS[q.scale]?.[0]} — {SCALE_LABELS[q.scale]?.[4]}
          </p>
        </div>
      ))}

      <button onClick={submitAssessment} disabled={!allAnswered || submitting}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        {submitting ? 'Analyzing...' : 'View My Profile'}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
