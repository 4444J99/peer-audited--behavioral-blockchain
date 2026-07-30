'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';

type VerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'REJECTED';

interface ComplianceStatus {
  userId: string;
  kycStatus: VerificationStatus;
  ageVerificationStatus: VerificationStatus;
  identityProvider: string | null;
  identityVerificationId: string | null;
  identityVerifiedAt: string | null;
  isKycVerified: boolean;
  isAgeVerified: boolean;
}

interface StartVerificationSession {
  provider: 'MOCK' | 'STRIPE_IDENTITY';
  verificationId: string;
  status: string;
  clientSecret?: string | null;
  hostedUrl?: string | null;
  userId: string;
}

type UploadPhase =
  | 'idle'
  | 'selected'
  | 'starting'
  | 'awaiting_provider'
  | 'completing'
  | 'done';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const UNAUTHENTICATED = 'UNAUTHENTICATED';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  for (const cookie of document.cookie.split(';')) {
    const [rawKey, ...rawValue] = cookie.trim().split('=');
    if (rawKey === name) return decodeURIComponent(rawValue.join('='));
  }
  return null;
}

async function kycFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const method = String(options?.method || 'GET').toUpperCase();
  const csrfToken = readCookie('styx_csrf_token') || '';
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(method !== 'GET' && csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    throw new Error(UNAUTHENTICATED);
  }
  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const payload = await res.json();
      const detail = payload?.message || payload?.error?.message || payload?.error;
      if (detail) message = `API ${res.status}: ${String(detail)}`;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

function statusBadgeClasses(status: VerificationStatus): string {
  switch (status) {
    case 'VERIFIED':
      return 'border-green-700 bg-green-950/40 text-green-400';
    case 'PENDING':
      return 'border-yellow-700 bg-yellow-950/40 text-yellow-400';
    case 'FAILED':
    case 'REJECTED':
      return 'border-red-700 bg-red-950/40 text-red-400';
    default:
      return 'border-neutral-700 bg-neutral-900 text-neutral-400';
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default function KycPage() {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [session, setSession] = useState<StartVerificationSession | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await kycFetch<ComplianceStatus>('/users/me/compliance');
      setStatus(data);
      setAuthRequired(false);
    } catch (err) {
      if (err instanceof Error && err.message === UNAUTHENTICATED) {
        setAuthRequired(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load verification status');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPhase('idle');
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFile(null);
      setPhase('idle');
      setFileError('Unsupported document type. Use JPEG, PNG, WebP, or PDF.');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setPhase('idle');
      setFileError('Document exceeds the 10 MB limit.');
      return;
    }
    setFile({ name: selected.name, size: selected.size, type: selected.type });
    setPhase('selected');
  };

  const beginVerification = async () => {
    setError(null);
    setPhase('starting');
    try {
      const result = await kycFetch<StartVerificationSession>(
        '/users/me/compliance/identity/start',
        {
          method: 'POST',
          body: JSON.stringify({
            mode: 'KYC_AND_AGE',
            returnUrl: `${window.location.origin}/kyc`,
          }),
        },
      );
      setSession(result);
      setPhase('awaiting_provider');
    } catch (err) {
      setPhase('selected');
      if (err instanceof Error && err.message === UNAUTHENTICATED) {
        setAuthRequired(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to start verification');
      }
    }
  };

  const completeMock = async (outcome: 'VERIFIED' | 'REJECTED') => {
    setError(null);
    setPhase('completing');
    try {
      const result = await kycFetch<ComplianceStatus>(
        '/users/me/compliance/identity/mock-complete',
        {
          method: 'POST',
          body: JSON.stringify({ mode: 'KYC_AND_AGE', status: outcome }),
        },
      );
      setStatus(result);
      setSession(null);
      setPhase('done');
    } catch (err) {
      setPhase('awaiting_provider');
      if (err instanceof Error && err.message === UNAUTHENTICATED) {
        setAuthRequired(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to complete verification');
      }
    }
  };

  if (authRequired) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <ShieldCheck className="mx-auto text-red-500" size={42} />
          <h1 className="text-xl font-black tracking-tight uppercase">Sign in required</h1>
          <p className="text-sm text-neutral-400 leading-6">
            Identity verification is tied to your account. Sign in to check your status or
            upload a document.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-white text-black font-extrabold rounded-full hover:bg-neutral-200 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading Verification Status...</span>
      </div>
    );
  }

  const busy = phase === 'starting' || phase === 'completing';

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans">
      <header className="max-w-3xl mx-auto mb-10 border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-black tracking-tighter uppercase">Identity Verification</h1>
        <p className="text-sm text-neutral-500 mt-1 uppercase tracking-widest">
          KYC &amp; Age Check — unlocks real-money tiers
        </p>
      </header>

      <main className="max-w-3xl mx-auto space-y-8">
        {error ? (
          <div className="border border-red-900 bg-red-950/20 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-red-400 font-bold text-sm">{error}</p>
          </div>
        ) : null}

        {/* Current status */}
        <section className="border border-neutral-800 rounded-2xl bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              Verification Status
            </h2>
            <button
              onClick={loadStatus}
              className="px-3 py-1.5 rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw size={12} /> Refresh Status
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black border border-neutral-800 p-4 rounded-lg">
              <h3 className="text-neutral-500 text-xs uppercase mb-2">KYC Identity</h3>
              <span
                className={`inline-block px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${statusBadgeClasses(status?.kycStatus ?? 'NOT_STARTED')}`}
              >
                {(status?.kycStatus ?? 'NOT_STARTED').replace('_', ' ')}
              </span>
            </div>
            <div className="bg-black border border-neutral-800 p-4 rounded-lg">
              <h3 className="text-neutral-500 text-xs uppercase mb-2">Age Verification</h3>
              <span
                className={`inline-block px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${statusBadgeClasses(status?.ageVerificationStatus ?? 'NOT_STARTED')}`}
              >
                {(status?.ageVerificationStatus ?? 'NOT_STARTED').replace('_', ' ')}
              </span>
            </div>
          </div>
          {status?.identityVerifiedAt ? (
            <p className="text-xs text-neutral-500 mt-4">
              Verified {new Date(status.identityVerifiedAt).toLocaleDateString()} via{' '}
              {status.identityProvider ?? 'provider'}
            </p>
          ) : null}
        </section>

        {/* Upload + start flow */}
        {status?.isKycVerified && status?.isAgeVerified ? (
          <section className="border border-green-900 rounded-2xl bg-green-950/20 p-6 flex items-start gap-4">
            <ShieldCheck className="text-green-500 shrink-0" size={28} />
            <div>
              <h2 className="font-black uppercase tracking-wide text-green-300">
                You are fully verified
              </h2>
              <p className="text-sm text-neutral-400 mt-1 leading-6">
                Your identity and age are confirmed. No further documents are needed.
              </p>
            </div>
          </section>
        ) : (
          <section className="border border-neutral-800 rounded-2xl bg-neutral-900 p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              Upload Identity Document
            </h2>
            <p className="text-sm text-neutral-400 leading-6">
              Select a government-issued ID (passport, driver&apos;s license, or national ID
              card). The document itself is captured by our verification provider over an
              encrypted session — it never touches Styx servers.
            </p>

            <div>
              <label
                htmlFor="kyc-document"
                className="block text-xs uppercase tracking-wider text-neutral-500 mb-2"
              >
                Identity Document
              </label>
              <input
                id="kyc-document"
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={onFileChange}
                className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-md file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-red-500"
              />
              {fileError ? (
                <p className="text-red-400 text-sm mt-2 font-semibold">{fileError}</p>
              ) : null}
              {file ? (
                <p className="text-neutral-400 text-sm mt-2 flex items-center gap-2">
                  <FileText size={14} className="text-neutral-500" />
                  {file.name} ({formatBytes(file.size)})
                </p>
              ) : null}
            </div>

            {(phase === 'awaiting_provider' || phase === 'completing') && session ? (
              <div className="border border-yellow-900 bg-yellow-950/20 rounded-lg p-4 space-y-3">
                <p className="text-yellow-300 text-sm font-bold">
                  Verification session created — status {session.status}.
                </p>
                {session.provider === 'STRIPE_IDENTITY' && session.hostedUrl ? (
                  <a
                    href={session.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black text-sm font-extrabold hover:bg-neutral-200"
                  >
                    <ExternalLink size={14} /> Continue to Secure Document Upload
                  </a>
                ) : null}
                {session.provider === 'MOCK' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">
                      Mock provider (non-production) — resolve the session:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => completeMock('VERIFIED')}
                        disabled={busy}
                        className="px-4 py-2 rounded-md border border-green-700 text-green-300 hover:bg-green-900/20 text-sm font-semibold disabled:opacity-50"
                      >
                        Approve (Mock)
                      </button>
                      <button
                        onClick={() => completeMock('REJECTED')}
                        disabled={busy}
                        className="px-4 py-2 rounded-md border border-red-700 text-red-300 hover:bg-red-900/20 text-sm font-semibold disabled:opacity-50"
                      >
                        Reject (Mock)
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                onClick={beginVerification}
                disabled={phase !== 'selected' || busy}
                className="px-6 py-3 rounded-full bg-red-600 text-white font-extrabold hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {phase === 'starting' ? 'Starting Verification...' : 'Begin Verification'}
              </button>
            )}

            {phase === 'done' ? (
              <p className="text-sm text-neutral-400">
                Session resolved. Your status above reflects the latest verification result.
              </p>
            ) : null}
          </section>
        )}

        <p className="text-xs text-neutral-600 uppercase tracking-widest text-center">
          Documents are processed by the identity provider only. Styx stores the verification
          outcome, never the document.
        </p>
      </main>
    </div>
  );
}
