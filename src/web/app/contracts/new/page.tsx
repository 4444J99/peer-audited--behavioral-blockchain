'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../services/api-client';

const OATH_CATEGORIES = [
  { value: 'BIOLOGICAL_WEIGHT', label: 'Weight Management', stream: 'Biological' },
  { value: 'BIOLOGICAL_CARDIO', label: 'Cardiovascular Stamina', stream: 'Biological' },
  { value: 'BIOLOGICAL_METABOLIC', label: 'Glucose Stability', stream: 'Biological' },
  { value: 'BIOLOGICAL_SLEEP', label: 'Sleep Integrity', stream: 'Biological' },
  { value: 'BIOLOGICAL_SOBRIETY', label: 'Sobriety HRV', stream: 'Biological' },
  { value: 'COGNITIVE_DIGITAL', label: 'Digital Fasting', stream: 'Cognitive' },
  { value: 'COGNITIVE_FOCUS', label: 'Deep Work Focus', stream: 'Cognitive' },
  { value: 'COGNITIVE_QUEUE', label: 'Inbox Zero', stream: 'Cognitive' },
  { value: 'COGNITIVE_LEARNING', label: 'Learning Retention', stream: 'Cognitive' },
  { value: 'PROFESSIONAL_SALES', label: 'Sales Velocity', stream: 'Professional' },
  { value: 'PROFESSIONAL_CODE', label: 'Developer Throughput', stream: 'Professional' },
  { value: 'PROFESSIONAL_TIME', label: 'Punctuality', stream: 'Professional' },
  { value: 'CREATIVE_WRITING', label: 'Deep Writing', stream: 'Creative' },
  { value: 'CREATIVE_ART', label: 'Visual Arts', stream: 'Creative' },
  { value: 'CREATIVE_MUSIC', label: 'Music Practice', stream: 'Creative' },
  { value: 'CREATIVE_BUILD', label: 'Maker Build', stream: 'Creative' },
  { value: 'VISUAL_NUTRITION', label: 'Nutritional Transparency', stream: 'Environmental' },
  { value: 'VISUAL_ENVIRONMENT', label: 'Tidiness & Minimalism', stream: 'Environmental' },
  { value: 'VISUAL_IMAGE', label: 'Personal Presentation', stream: 'Environmental' },
  { value: 'VISUAL_LITERACY', label: 'Active Reading', stream: 'Environmental' },
  { value: 'SOCIAL_COMMUNITY', label: 'Civic Engagement', stream: 'Character' },
  { value: 'SOCIAL_CHARITY', label: 'Philanthropic Velocity', stream: 'Character' },
  { value: 'SOCIAL_CONNECTION', label: 'Family Presence', stream: 'Character' },
];

const VERIFICATION_METHODS = [
  { value: 'HEALTHKIT', label: 'HealthKit (iOS)' },
  { value: 'HEALTHCONNECT', label: 'Health Connect (Android)' },
  { value: 'SCREENTIME', label: 'Screen Time API' },
  { value: 'EXTERNAL_API', label: 'Third-Party API' },
  { value: 'FURY_NETWORK', label: 'Fury Peer Review' },
  { value: 'TIME_LAPSE_PROOF', label: 'Time-Lapse Proof' },
  { value: 'GPS', label: 'GPS Geofence' },
  { value: 'LEDGER', label: 'Financial Ledger' },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

export default function NewContractPage() {
  const router = useRouter();
  const [oathCategory, setOathCategory] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oathCategory || !verificationMethod || !stakeAmount) {
      setError('All fields are required.');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Stake amount must be a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createContract({
        oathCategory,
        verificationMethod,
        stakeAmount: amount,
        durationDays,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  // Group categories by stream
  const streams = OATH_CATEGORIES.reduce((acc, cat) => {
    if (!acc[cat.stream]) acc[cat.stream] = [];
    acc[cat.stream].push(cat);
    return acc;
  }, {} as Record<string, typeof OATH_CATEGORIES>);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="flex items-center gap-4 mb-12 border-b border-neutral-800 pb-6">
        <Link href="/dashboard" className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <Flame className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">New Behavioral Contract</h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Stake capital against your commitment</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
        {/* Oath Category */}
        <div>
          <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Oath Category
          </label>
          <select
            value={oathCategory}
            onChange={(e) => setOathCategory(e.target.value)}
            className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-bold appearance-none cursor-pointer focus:border-red-600 focus:outline-none"
          >
            <option value="">Select a behavioral oath...</option>
            {Object.entries(streams).map(([stream, categories]) => (
              <optgroup key={stream} label={`${stream} Stream`}>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Verification Method */}
        <div>
          <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Verification Method
          </label>
          <select
            value={verificationMethod}
            onChange={(e) => setVerificationMethod(e.target.value)}
            className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-bold appearance-none cursor-pointer focus:border-red-600 focus:outline-none"
          >
            <option value="">Select oracle type...</option>
            {VERIFICATION_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stake Amount */}
        <div>
          <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Stake Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-black text-xl">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 pl-10 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-black text-2xl placeholder:text-neutral-700 focus:border-red-600 focus:outline-none"
            />
          </div>
          <p className="text-xs text-neutral-600 mt-2">This amount will be held in FBO escrow. Failure means forfeiture.</p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Duration
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDurationDays(opt.value)}
                className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                  durationDays === opt.value
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-xl text-red-400 text-sm font-bold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl transition-colors text-lg flex justify-center items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              PROCESSING...
            </>
          ) : (
            <>
              <Flame size={24} />
              STAKE AND COMMIT
            </>
          )}
        </button>

        <p className="text-center text-xs text-neutral-600">
          By submitting, you authorize Styx to place an FBO hold on the specified amount.
          Funds are returned upon verified completion or forfeited upon failure.
        </p>
      </form>
    </div>
  );
}
