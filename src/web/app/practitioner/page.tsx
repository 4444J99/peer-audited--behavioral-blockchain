'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Bell,
  Loader2,
  Minus,
  RefreshCw,
  Stethoscope,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

type RiskLevel = 'GREEN' | 'YELLOW' | 'RED';
type Trend = 'IMPROVING' | 'STABLE' | 'DECLINING';
type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

interface RiskFactor {
  type: string;
  weight: number;
  value: number;
  description: string;
}

interface ClientRiskProfile {
  userId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  trend: Trend;
  lastUpdated: string;
}

interface JournalAlert {
  id: string;
  userId: string;
  alertType: string;
  excerpt: string;
  severity: AlertSeverity;
  createdAt: string;
}

interface PractitionerClient {
  clientId: string;
  clientAlias: string | null;
  riskProfile: ClientRiskProfile;
  recentAlerts: JournalAlert[];
  adherenceRate: number;
  streakDays: number;
  nextCheckIn: string | null;
}

const UNAUTHENTICATED = 'UNAUTHENTICATED';

async function practitionerFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
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

// The practitioner routes are new; tolerate both a bare array and a wrapped
// { clients } / { alerts } envelope so the page survives either contract.
function unwrapList<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const wrapped = (payload as Record<string, unknown> | null)?.[key];
  return Array.isArray(wrapped) ? (wrapped as T[]) : [];
}

function riskBadgeClasses(level: RiskLevel): string {
  switch (level) {
    case 'RED':
      return 'border-red-700 bg-red-950/40 text-red-400';
    case 'YELLOW':
      return 'border-yellow-700 bg-yellow-950/40 text-yellow-400';
    default:
      return 'border-green-700 bg-green-950/40 text-green-400';
  }
}

function severityClasses(severity: AlertSeverity): string {
  switch (severity) {
    case 'HIGH':
      return 'border-red-700 bg-red-950/40 text-red-400';
    case 'MEDIUM':
      return 'border-yellow-700 bg-yellow-950/40 text-yellow-400';
    default:
      return 'border-neutral-700 bg-neutral-900 text-neutral-400';
  }
}

function humanizeToken(token: string): string { // allow-secret
  return token
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

function clientLabel(client: PractitionerClient): string {
  if (client.clientAlias) return client.clientAlias;
  return `Client ${client.clientId.slice(0, 8)}`;
}

function TrendIndicator({ trend }: { trend: Trend }) {
  if (trend === 'IMPROVING') {
    return (
      <span className="inline-flex items-center gap-1 text-green-400 text-xs font-bold">
        <TrendingDown size={12} /> Improving
      </span>
    );
  }
  if (trend === 'DECLINING') {
    return (
      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold">
        <TrendingUp size={12} /> Declining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-neutral-400 text-xs font-bold">
      <Minus size={12} /> Stable
    </span>
  );
}

export default function PractitionerPage() {
  const [clients, setClients] = useState<PractitionerClient[]>([]);
  const [alerts, setAlerts] = useState<JournalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardPayload = await practitionerFetch<unknown>('/practitioner/dashboard');
      const dashboard = unwrapList<PractitionerClient>(dashboardPayload, 'clients');
      setClients(dashboard);
      // The dashboard embeds each client's recent alerts — flatten for the feed.
      setAlerts(
        dashboard
          .flatMap((client) => client.recentAlerts ?? [])
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      );
      setAuthRequired(false);
    } catch (err) {
      if (err instanceof Error && err.message === UNAUTHENTICATED) {
        setAuthRequired(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load practitioner data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (authRequired) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <Stethoscope className="mx-auto text-red-500" size={42} />
          <h1 className="text-xl font-black tracking-tight uppercase">
            Practitioner sign-in required
          </h1>
          <p className="text-sm text-neutral-400 leading-6">
            The practitioner console is restricted to verified clinical accounts with active
            client assignments.
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
        <span className="text-neutral-400 font-bold">Loading Practitioner Console...</span>
      </div>
    );
  }

  const redCount = clients.filter((c) => c.riskProfile?.riskLevel === 'RED').length;
  const yellowCount = clients.filter((c) => c.riskProfile?.riskLevel === 'YELLOW').length;
  const greenCount = clients.filter((c) => c.riskProfile?.riskLevel === 'GREEN').length;
  const highAlerts = alerts.filter((a) => a.severity === 'HIGH').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans">
      <header className="mb-10 border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            Practitioner Console
          </h1>
          <p className="text-sm text-neutral-500 mt-1 uppercase tracking-widest">
            Composite risk intelligence for assigned clients
          </p>
        </div>
        <button
          onClick={load}
          className="self-start md:self-auto px-4 py-2 rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-900 text-sm font-semibold flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      {error ? (
        <div className="mb-8 border border-red-900 bg-red-950/20 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="text-red-400 font-bold text-sm">{error}</p>
        </div>
      ) : null}

      {/* Caseload summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-black border border-neutral-800 p-5 rounded-lg">
          <h3 className="text-neutral-500 text-xs uppercase mb-2">Assigned Clients</h3>
          <p className="text-3xl font-bold text-white">{clients.length}</p>
        </div>
        <div className="bg-black border border-neutral-800 p-5 rounded-lg">
          <h3 className="text-neutral-500 text-xs uppercase mb-2">Red Risk</h3>
          <p className="text-3xl font-bold text-red-500">{redCount}</p>
        </div>
        <div className="bg-black border border-neutral-800 p-5 rounded-lg">
          <h3 className="text-neutral-500 text-xs uppercase mb-2">Yellow Risk</h3>
          <p className="text-3xl font-bold text-yellow-500">{yellowCount}</p>
        </div>
        <div className="bg-black border border-neutral-800 p-5 rounded-lg">
          <h3 className="text-neutral-500 text-xs uppercase mb-2">High-Severity Alerts</h3>
          <p className="text-3xl font-bold text-orange-500">{highAlerts}</p>
        </div>
      </section>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client roster */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <Activity size={14} /> Client Risk Profiles
            <span className="text-neutral-600 normal-case tracking-normal font-normal">
              ({greenCount} green)
            </span>
          </h2>
          {clients.length === 0 ? (
            <div className="border border-neutral-800 rounded-2xl bg-neutral-900 p-8 text-center text-neutral-500 text-sm">
              No clients assigned. Clients appear here once an active assignment links them to
              your practitioner account.
            </div>
          ) : (
            clients.map((client) => {
              const topFactors = [...(client.riskProfile?.factors ?? [])]
                .sort(
                  (a, b) =>
                    Math.min(1, b.value) * b.weight - Math.min(1, a.value) * a.weight,
                )
                .slice(0, 3);
              return (
                <article
                  key={client.clientId}
                  className="border border-neutral-800 rounded-2xl bg-neutral-900 p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-black text-lg">{clientLabel(client)}</h3>
                      <TrendIndicator trend={client.riskProfile?.trend ?? 'STABLE'} />
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${riskBadgeClasses(client.riskProfile?.riskLevel ?? 'GREEN')}`}
                      >
                        {client.riskProfile?.riskLevel ?? 'GREEN'}
                      </span>
                      <p className="text-2xl font-bold mt-1">
                        {client.riskProfile?.riskScore ?? 0}
                        <span className="text-neutral-600 text-sm font-normal">/100</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-black border border-neutral-800 rounded-lg p-3">
                      <p className="text-neutral-500 text-[10px] uppercase">Adherence</p>
                      <p className="font-bold">{client.adherenceRate}%</p>
                    </div>
                    <div className="bg-black border border-neutral-800 rounded-lg p-3">
                      <p className="text-neutral-500 text-[10px] uppercase">Streak</p>
                      <p className="font-bold">{client.streakDays}d</p>
                    </div>
                    <div className="bg-black border border-neutral-800 rounded-lg p-3">
                      <p className="text-neutral-500 text-[10px] uppercase">Next Check-in</p>
                      <p className="font-bold">
                        {client.nextCheckIn
                          ? new Date(client.nextCheckIn).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {topFactors.length > 0 ? (
                    <ul className="space-y-1">
                      {topFactors.map((factor) => (
                        <li
                          key={factor.type}
                          className="text-xs text-neutral-400 flex items-baseline gap-2"
                        >
                          <span className="text-neutral-600 font-mono shrink-0">
                            {humanizeToken(factor.type)}:
                          </span>
                          {factor.description}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {(client.recentAlerts?.length ?? 0) > 0 ? (
                    <p className="mt-3 text-xs text-orange-400 font-semibold">
                      {client.recentAlerts.length} recent journal alert
                      {client.recentAlerts.length === 1 ? '' : 's'}
                    </p>
                  ) : null}
                </article>
              );
            })
          )}
        </section>

        {/* Alerts feed */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <Bell size={14} /> Journal Alerts
          </h2>
          {alerts.length === 0 ? (
            <div className="border border-neutral-800 rounded-2xl bg-neutral-900 p-8 text-center text-neutral-500 text-sm">
              No open alerts. Journal language analysis posts rationalization, distress, and
              crisis signals here.
            </div>
          ) : (
            alerts.map((alert) => (
              <article
                key={alert.id}
                className="border border-neutral-800 rounded-xl bg-neutral-900 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide ${severityClasses(alert.severity)}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-neutral-600 text-xs">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-bold text-neutral-300">
                  {humanizeToken(alert.alertType)}
                </p>
                <p className="text-xs text-neutral-500 mt-1">&ldquo;{alert.excerpt}&rdquo;</p>
              </article>
            ))
          )}
        </section>
      </main>

      <p className="mt-12 text-xs text-neutral-700 uppercase tracking-widest text-center">
        Client identities are aliased. Raw journal text never leaves the analysis pipeline —
        only matched markers surface here.
      </p>
    </div>
  );
}
