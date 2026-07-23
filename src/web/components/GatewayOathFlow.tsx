'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, DollarSign, Shield } from 'lucide-react';

const STAKE_PRESETS = [100, 150, 200];
const DURATION_PRESETS = [3, 7, 14];

interface GatewayOathFlowProps {
  onComplete?: (result: any) => void;
}

export function GatewayOathFlow({ onComplete }: GatewayOathFlowProps) {
  const [step, setStep] = useState(0);
  const [stakeCents, setStakeCents] = useState(100);
  const [durationDays, setDurationDays] = useState(7);
  const [eligibility, setEligibility] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const checkEligibility = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/behavioral/gateway-oath/eligibility?stakeCents=${stakeCents}&durationDays=${durationDays}`);
      const data = await res.json();
      setEligibility(data);
      onComplete?.(data);
    } catch {
      setEligibility({ allowed: false, reason: 'Network error' });
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      checkEligibility();
    }
  };

  return (
    <div className="space-y-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold">Gateway Oath</h3>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">How much do you want to stake?</p>
          <div className="flex gap-2">
            {STAKE_PRESETS.map(val => (
              <button key={val} onClick={() => setStakeCents(val)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  stakeCents === val ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}>
                ${(val / 100).toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">How many days?</p>
          <div className="flex gap-2">
            {DURATION_PRESETS.map(val => (
              <button key={val} onClick={() => setDurationDays(val)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  durationDays === val ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}>
                {val} days
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Review your Gateway Oath:</p>
          <div className="p-3 bg-gray-800 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Stake:</span>
              <span className="font-bold text-green-400">${(stakeCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Duration:</span>
              <span className="font-bold">{durationDays} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Type:</span>
              <span className="font-bold">Two-Minute Rule</span>
            </div>
          </div>
          {eligibility && (
            <div className={`p-3 rounded-lg ${eligibility.allowed ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
              {eligibility.allowed ? 'You are eligible for a Gateway Oath!' : eligibility.reason}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(s => s - 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button disabled={checking || (step === 2 && eligibility && !eligibility.allowed)} onClick={handleNext}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-700 text-white disabled:opacity-30">
          {checking ? 'Checking...' : step < 2 ? 'Next' : 'Confirm'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
