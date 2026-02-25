'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, Flame, Shield, DollarSign, CreditCard, X,
} from 'lucide-react';

const OATH_CATEGORIES = [
  { id: 'RECOVERY_NOCONTACT', label: 'No Contact', icon: '\u{1F6AB}', description: 'Absolute severance. No texts, calls, or DMs.', color: 'border-red-700 hover:border-red-500' },
  { id: 'RECOVERY_DETOX', label: 'Digital Detox', icon: '\u{1F4F4}', description: 'Strict limits on social media doom-scrolling.', color: 'border-purple-700 hover:border-purple-500' },
  { id: 'RECOVERY_ENDORPHIN', label: 'Endorphin Recovery', icon: '\u{1F3CB}\u{FE0F}', description: 'Physical exertion to process stress (Gym/Steps).', color: 'border-green-700 hover:border-green-500' },
  { id: 'RECOVERY_DIVERSION', label: 'Venting Vault', icon: '\u{1F512}', description: 'Send toxic urges here instead of to them.', color: 'border-blue-700 hover:border-blue-500' },
];

const STAKE_PRESETS = [5, 10, 25, 50, 100, 250, 500];

const LOSS_AVERSION_LAMBDA = 1.955;

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stakeAmount, setStakeAmount] = useState(25);
  const [customStake, setCustomStake] = useState('');
  const router = useRouter();

  const totalSteps = 5;

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true; // Welcome — always
      case 1: return selectedCategory !== ''; // Must select category
      case 2: return stakeAmount >= 5 && stakeAmount <= 500; // Valid stake
      case 3: return true; // Payment info — always
      case 4: return true; // Redirect
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Final step — redirect to contract creation with pre-filled params
      const params = new URLSearchParams({
        category: selectedCategory,
        stake: String(stakeAmount),
        onboarding: '1',
      });
      router.push(`/contracts/new?${params.toString()}`);
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleCustomStake = (value: string) => {
    setCustomStake(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 5 && num <= 500) {
      setStakeAmount(num);
    }
  };

  const perceivedLoss = (stakeAmount * LOSS_AVERSION_LAMBDA).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Close / Skip */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white transition-colors z-10"
          title="Skip onboarding"
        >
          <X size={20} />
        </button>

        {/* Progress Bar */}
        <div className="px-8 pt-6">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-red-600' : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-2 uppercase tracking-widest">
            Step {step + 1} of {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <Flame className="text-black" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Welcome to Styx</h2>
                  <p className="text-neutral-400 text-sm">The Blockchain of Truth</p>
                </div>
              </div>

              <div className="space-y-4 text-neutral-300">
                <p>
                  Styx is a <strong className="text-white">peer-audited behavioral market</strong> that
                  uses real financial stakes to enforce habit follow-through.
                </p>

                <div className="p-4 bg-black rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      <strong className="text-white">Loss Aversion:</strong> Humans feel losses ~2x more
                      intensely than equivalent gains. Styx weaponizes this psychological principle to drive
                      real behavioral change.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Flame size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      <strong className="text-white">Fury Network:</strong> Anonymous peer reviewers
                      verify your proof submissions. Fraudulent proofs are caught and stakes are burned.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      <strong className="text-white">Financial Stakes:</strong> Commit real money to your
                      goals. Succeed and your capital returns. Fail and it is redistributed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Choose Oath Category */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Choose Your First Oath</h2>
                <p className="text-neutral-400 text-sm mt-1">
                  Select the behavioral stream for your first commitment contract.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OATH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedCategory === cat.id
                        ? 'border-red-500 bg-red-900/20'
                        : `border-neutral-800 bg-black ${cat.color}`
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="font-bold text-white">{cat.label}</span>
                    </div>
                    <p className="text-xs text-neutral-400">{cat.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Set Stakes */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Set Your Stakes</h2>
                <p className="text-neutral-400 text-sm mt-1">
                  How much are you willing to risk? Higher stakes = stronger motivation.
                </p>
              </div>

              {/* Loss Aversion Explainer */}
              <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-xl">
                <p className="text-sm text-neutral-300">
                  <strong className="text-red-400">Loss Aversion Coefficient: {LOSS_AVERSION_LAMBDA}</strong>
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  A ${stakeAmount} stake will feel like a <strong className="text-white">${perceivedLoss} loss</strong> if
                  you fail. This psychological multiplier is what makes Styx effective.
                </p>
              </div>

              {/* Preset Amounts */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {STAKE_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setStakeAmount(amount); setCustomStake(''); }}
                    className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                      stakeAmount === amount && !customStake
                        ? 'bg-red-600 text-white'
                        : 'bg-black border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                  Custom Amount ($5 - $500)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 font-black text-xl">$</span>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    step="1"
                    value={customStake}
                    onChange={(e) => handleCustomStake(e.target.value)}
                    placeholder={String(stakeAmount)}
                    className="w-full p-4 pl-10 bg-black border border-neutral-800 rounded-xl text-white font-black text-2xl placeholder:text-neutral-700 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Visual Stake Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Low Risk</span>
                  <span>High Risk</span>
                </div>
                <style>{`
                  .dynamic-stake-width {
                    width: ${Math.min((stakeAmount / 500) * 100, 100)}%;
                  }
                `}</style>
                <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 via-yellow-500 to-red-600 rounded-full transition-all dynamic-stake-width"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Connect Payment */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Connect Payment</h2>
                <p className="text-neutral-400 text-sm mt-1">
                  Set up your payment method to fund your first behavioral contract.
                </p>
              </div>

              <div className="p-6 bg-black border border-neutral-800 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard size={24} className="text-lime-500" />
                  <div>
                    <p className="font-bold">Stripe Escrow</p>
                    <p className="text-xs text-neutral-500">
                      Funds are held in FBO (For Benefit Of) escrow. Styx never touches your money directly.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-900 rounded-xl text-sm text-neutral-400 space-y-2">
                  <p>When you create a contract:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-neutral-500">
                    <li>A Stripe PaymentIntent is created for your stake amount</li>
                    <li>Funds are held (not captured) until the contract resolves</li>
                    <li>On success: hold is cancelled, money returns to you</li>
                    <li>On failure: hold is captured and redistributed</li>
                  </ul>
                </div>

                <Link
                  href="/wallet"
                  className="block w-full py-4 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl transition-colors text-center"
                >
                  Set Up Payment in Capital Escrow
                </Link>
              </div>

              <p className="text-xs text-neutral-600 text-center">
                You can also set up payment later. The first contract creation will prompt you.
              </p>
            </div>
          )}

          {/* Step 4: Ready to Go */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                <Flame className="text-black" size={40} />
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight">You Are Ready</h2>
                <p className="text-neutral-400 mt-2">
                  Your first behavioral contract is about to begin.
                </p>
              </div>

              <div className="p-6 bg-black border border-neutral-800 rounded-xl text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">Oath Stream</span>
                  <span className="font-bold capitalize">{selectedCategory || 'Not selected'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">Stake Amount</span>
                  <span className="font-black text-red-500">${stakeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">Perceived Loss</span>
                  <span className="font-bold text-neutral-300">${perceivedLoss}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">Onboarding Bonus</span>
                  <span className="font-bold text-green-400">+$5.00</span>
                </div>
              </div>

              <p className="text-sm text-neutral-500">
                Clicking below will take you to the contract creation form with your selections pre-filled.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <div>
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="px-5 py-3 text-neutral-400 hover:text-white font-bold text-sm transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <button
                onClick={onSkip}
                className="px-5 py-3 text-neutral-500 hover:text-neutral-300 font-bold text-sm transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors flex items-center gap-2"
          >
            {step === totalSteps - 1 ? 'Create Contract' : 'Continue'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
