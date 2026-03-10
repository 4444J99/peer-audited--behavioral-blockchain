'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flame, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../services/api-client';
import { getRealmBySlug } from '../../../../shared/libs/realm-registry';

const OATH_CATEGORIES = [
  // { value: 'BIOLOGICAL_WEIGHT', label: 'Weight Management', stream: 'Biological' },
  // { value: 'BIOLOGICAL_CARDIO', label: 'Cardiovascular Stamina', stream: 'Biological' },
  // { value: 'BIOLOGICAL_METABOLIC', label: 'Glucose Stability', stream: 'Biological' },
  // { value: 'BIOLOGICAL_SLEEP', label: 'Sleep Integrity', stream: 'Biological' },
  // { value: 'BIOLOGICAL_SOBRIETY', label: 'Sobriety HRV', stream: 'Biological' },
  // { value: 'COGNITIVE_DIGITAL', label: 'Digital Fasting', stream: 'Cognitive' },
  // { value: 'COGNITIVE_FOCUS', label: 'Deep Work Focus', stream: 'Cognitive' },
  // { value: 'COGNITIVE_QUEUE', label: 'Inbox Zero', stream: 'Cognitive' },
  // { value: 'COGNITIVE_LEARNING', label: 'Learning Retention', stream: 'Cognitive' },
  // { value: 'PROFESSIONAL_SALES', label: 'Sales Velocity', stream: 'Professional' },
  // { value: 'PROFESSIONAL_CODE', label: 'Developer Throughput', stream: 'Professional' },
  // { value: 'PROFESSIONAL_TIME', label: 'Punctuality', stream: 'Professional' },
  // { value: 'CREATIVE_WRITING', label: 'Deep Writing', stream: 'Creative' },
  // { value: 'CREATIVE_ART', label: 'Visual Arts', stream: 'Creative' },
  // { value: 'CREATIVE_MUSIC', label: 'Music Practice', stream: 'Creative' },
  // { value: 'CREATIVE_BUILD', label: 'Maker Build', stream: 'Creative' },
  // { value: 'VISUAL_NUTRITION', label: 'Nutritional Transparency', stream: 'Environmental' },
  // { value: 'VISUAL_ENVIRONMENT', label: 'Tidiness & Minimalism', stream: 'Environmental' },
  // { value: 'VISUAL_IMAGE', label: 'Personal Presentation', stream: 'Environmental' },
  // { value: 'VISUAL_LITERACY', label: 'Active Reading', stream: 'Environmental' },
  // { value: 'SOCIAL_COMMUNITY', label: 'Civic Engagement', stream: 'Character' },
  // { value: 'SOCIAL_CHARITY', label: 'Philanthropic Velocity', stream: 'Character' },
  // { value: 'SOCIAL_CONNECTION', label: 'Family Presence', stream: 'Character' },
  { value: 'RECOVERY_NOCONTACT', label: 'No-Contact Boundary', stream: 'Recovery' },
  // { value: 'RECOVERY_SUBSTANCE', label: 'Substance Abstinence', stream: 'Recovery' },
  // { value: 'RECOVERY_DETOX', label: 'Behavioral Detox', stream: 'Recovery' },
  // { value: 'RECOVERY_AVOIDANCE', label: 'Environment Avoidance', stream: 'Recovery' },
];

const VERIFICATION_METHODS = [
  // { value: 'HEALTHKIT', label: 'HealthKit (iOS)' },
  // { value: 'HEALTHCONNECT', label: 'Health Connect (Android)' },
  // { value: 'SCREENTIME', label: 'Screen Time API' },
  // { value: 'EXTERNAL_API', label: 'Third-Party API' },
  { value: 'FURY_NETWORK', label: 'Fury Peer Review' },
  // { value: 'TIME_LAPSE_PROOF', label: 'Time-Lapse Proof' },
  // { value: 'GPS', label: 'GPS Geofence' },
  // { value: 'LEDGER', label: 'Financial Ledger' },
  { value: 'ATTESTATION', label: 'Daily Attestation' },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

function NewContractPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const realmSlug = searchParams.get('realm');
  const realmFilter = realmSlug ? getRealmBySlug(realmSlug) : null;
  const [oathCategory, setOathCategory] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recovery stream fields
  const [apEmail, setApEmail] = useState('');
  const [noContactIds, setNoContactIds] = useState('');
  const [ackVoluntary, setAckVoluntary] = useState(false);
  const [ackNoMinors, setAckNoMinors] = useState(false);
  const [ackNoDependents, setAckNoDependents] = useState(false);
  const [ackNoLegal, setAckNoLegal] = useState(false);

  const isRecovery = oathCategory.startsWith('RECOVERY_');
  const isNoContact = oathCategory === 'RECOVERY_NOCONTACT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oathCategory || !verificationMethod || !stakeAmount) {
      setError('All fields are required.');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0 || amount > 20) {
      setError('Stake amount must be between $1 and $20 for the current beta phase.');
      return;
    }

    if (isRecovery && !apEmail) {
      setError('Accountability partner email is required for Recovery contracts.');
      return;
    }
    if (isRecovery && (!ackVoluntary || !ackNoMinors || !ackNoDependents || !ackNoLegal)) {
      setError('All safety acknowledgments must be confirmed for Recovery contracts.');
      return;
    }

    const effectiveDuration = isRecovery ? Math.min(durationDays, 30) : durationDays;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        oathCategory,
        verificationMethod,
        stakeAmount: amount,
        durationDays: effectiveDuration,
        ...(realmFilter ? { realmId: realmFilter.id } : {}),
      };

      if (isRecovery) {
        payload.recoveryMetadata = {
          accountabilityPartnerEmail: apEmail,
          noContactIdentifiers: isNoContact && noContactIds.trim()
            ? noContactIds.split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
          acknowledgments: {
            voluntary: ackVoluntary,
            noMinors: ackNoMinors,
            noDependents: ackNoDependents,
            noLegalObligations: ackNoLegal,
          },
        };
      }

      await api.createContract(payload);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  // Group categories by stream, optionally filtered by realm
  const filteredCategories = realmFilter
    ? OATH_CATEGORIES.filter((cat) => cat.value.startsWith(realmFilter.streamPrefix + '_'))
    : OATH_CATEGORIES;

  const streams = filteredCategories.reduce((acc, cat) => {
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
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Commit test-money against your recovery goal</p>
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
              max="20"
              step="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 pl-10 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-black text-2xl placeholder:text-neutral-700 focus:border-red-600 focus:outline-none"
            />
          </div>
          <p className="text-xs text-neutral-600 mt-2">Test-money only ($20 cap). Failure means simulated forfeiture.</p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Duration
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {DURATION_OPTIONS.filter(opt => !isRecovery || opt.value <= 30).map((opt) => (
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

        {/* Recovery Stream Fields */}
        {isRecovery && (
          <div className="space-y-6 p-6 bg-neutral-900/50 border border-amber-600/30 rounded-xl">
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Recovery Protocol</h3>

            <div>
              <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">
                Accountability Partner Email *
              </label>
              <input
                type="email"
                value={apEmail}
                onChange={(e) => setApEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-amber-600 focus:outline-none"
              />
              <p className="text-xs text-neutral-600 mt-1">Your AP will co-sign daily attestations and can cancel the contract if needed.</p>
            </div>

            {isNoContact && (
              <div>
                <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">
                  No-Contact Identifiers (hashed, max 3)
                </label>
                <input
                  type="text"
                  value={noContactIds}
                  onChange={(e) => setNoContactIds(e.target.value)}
                  placeholder="Comma-separated identifiers"
                  className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-amber-600 focus:outline-none"
                />
                <p className="text-xs text-neutral-600 mt-1">Identifiers are hashed client-side. Styx never stores plaintext.</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Safety Acknowledgments *</p>
              {[
                { id: 'voluntary', label: 'This contract is entirely voluntary', checked: ackVoluntary, set: setAckVoluntary },
                { id: 'noMinors', label: 'No minors are involved in this contract', checked: ackNoMinors, set: setAckNoMinors },
                { id: 'noDependents', label: 'No dependents are affected by this commitment', checked: ackNoDependents, set: setAckNoDependents },
                { id: 'noLegal', label: 'No legal obligations are being violated', checked: ackNoLegal, set: setAckNoLegal },
              ].map(({ id, label, checked, set }) => (
                <label key={id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => set(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-600 focus:ring-amber-600"
                  />
                  <span className="text-sm text-neutral-300">{label}</span>
                </label>
              ))}
            </div>

            {isRecovery && (
              <p className="text-xs text-amber-600/70 italic">
                Recovery contracts are capped at 30 days to ensure ongoing well-being evaluation.
                Emergency contacts (crisis hotlines, therapists, legal counsel) never count as violations.
              </p>
            )}
          </div>
        )}

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

export default function NewContractPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <Loader2 className="animate-spin mr-3" size={24} />
          <span className="text-neutral-400 font-bold">Loading contract builder...</span>
        </div>
      }
    >
      <NewContractPageContent />
    </Suspense>
  );
}
