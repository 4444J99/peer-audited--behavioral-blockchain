'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!ageConfirmed) {
      setError('You must confirm you are 18 years or older');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, { ageConfirmation: true, termsAccepted: true });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.4)]">
            <span className="text-2xl font-black text-black">S</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Join the Protocol</h1>
          <p className="text-neutral-400 mt-2">Create your identity on the Styx truth ledger.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 transition-colors"
              placeholder="you@styx.protocol"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 transition-colors"
              placeholder="Min. 12 characters, 1 uppercase, 1 digit, 1 symbol"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Age Gate */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-red-500 shrink-0" />
              <span className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Legal Requirements</span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-neutral-600 bg-black text-red-600 focus:ring-red-600 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                I confirm that I am <strong className="text-white">18 years of age or older</strong>. Styx involves real financial stakes and is restricted to adults.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-neutral-600 bg-black text-red-600 focus:ring-red-600 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors">
                I accept the{' '}
                <Link href="/legal/terms" className="text-red-500 hover:text-red-400 underline" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy" className="text-red-500 hover:text-red-400 underline" target="_blank">
                  Privacy Policy
                </Link>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !ageConfirmed || !termsAccepted}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {loading ? 'CREATING IDENTITY...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center text-neutral-500 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-red-500 font-bold hover:text-red-400 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
