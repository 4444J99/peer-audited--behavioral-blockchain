'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { api } from '../../services/api-client';
import { SupportTraceMessage } from '../../components/support/SupportTraceMessage';

interface EnterpriseMetrics {
  enterpriseId: string;
  totalContracts: number;
  completedContracts: number;
  failedContracts: number;
  activeContracts: number;
  completionRate: number;
  avgIntegrityScore: number;
  totalEmployees: number;
}

const DEFAULT_ENTERPRISE_ID = 'e0000000-0000-0000-0000-000000000001';

function normalizeEnterpriseId(raw: string | null | undefined): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return DEFAULT_ENTERPRISE_ID;
  const isPlausible = /^[A-Za-z0-9-]{6,128}$/.test(trimmed);
  return isPlausible ? trimmed : DEFAULT_ENTERPRISE_ID;
}

export default function HRDashboard() {
  const hrEnabled = process.env.NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI === 'true';

  const [metrics, setMetrics] = useState<EnterpriseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enterpriseInput, setEnterpriseInput] = useState(DEFAULT_ENTERPRISE_ID);
  const [activeEnterpriseId, setActiveEnterpriseId] = useState(DEFAULT_ENTERPRISE_ID);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromQuery = normalizeEnterpriseId(
      new URLSearchParams(window.location.search).get('enterprise'),
    );
    setEnterpriseInput(fromQuery);
    setActiveEnterpriseId(fromQuery);
  }, []);

  useEffect(() => {
    if (!hrEnabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const data = await api.getEnterpriseMetrics(activeEnterpriseId);
        if (!cancelled) {
          setMetrics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load metrics');
          setMetrics(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [activeEnterpriseId, hrEnabled, refreshNonce]);

  const openRiskExposure = (metrics?.failedContracts ?? 0) + (metrics?.activeContracts ?? 0);

  const applyEnterpriseSelection = () => {
    const trimmed = enterpriseInput.trim();
    if (!trimmed) {
      setActiveEnterpriseId(DEFAULT_ENTERPRISE_ID);
      return;
    }

    if (!/^[A-Za-z0-9-]{6,128}$/.test(trimmed)) {
      setError('Enterprise ID format is invalid. Use letters, numbers, and hyphens only.');
      return;
    }

    setError(null);
    setActiveEnterpriseId(trimmed);
  };

  if (!hrEnabled) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="max-w-xl text-center space-y-4">
          <AlertTriangle className="mx-auto text-amber-500" size={42} />
          <h1 className="text-xl font-bold tracking-wide uppercase text-amber-200">Internal Feature Disabled</h1>
          <p className="text-sm text-gray-400 leading-6">
            B2B/HR analytics is hidden in the Phase 1 private beta build. This route remains internal-only and should not be exposed to testers.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-gray-400 font-bold">Loading Enterprise Analytics...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-12 font-sans">
      <header className="mb-12 border-b border-gray-800 pb-6 flex justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-gray-300">Styx Corporate</h1>
          <p className="text-sm text-gray-600 mt-1 uppercase tracking-widest">Enterprise Group Analytics</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-green-500 font-bold mb-1">Enterprise: {activeEnterpriseId}</div>
          <div className="text-gray-500">Total Enrolled: {metrics?.totalEmployees ?? 0} Employees</div>
          <div className="text-gray-500">Avg Integrity Score: {metrics?.avgIntegrityScore ?? 0}</div>
        </div>
      </header>

      <section className="mb-8 border border-gray-800 rounded-lg bg-black/40 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Enterprise ID</label>
            <input
              value={enterpriseInput}
              onChange={(event) => setEnterpriseInput(event.target.value)}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              placeholder="e0000000-0000-0000-0000-000000000001"
              aria-label="Enterprise ID"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyEnterpriseSelection}
              className="px-4 py-2 rounded-md border border-blue-700 text-blue-300 hover:bg-blue-900/20 text-sm font-semibold flex items-center gap-2"
            >
              <Search size={14} /> Load Enterprise
            </button>
            <button
              onClick={() => setRefreshNonce((value) => value + 1)}
              className="px-4 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-900 text-sm font-semibold flex items-center gap-2"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-8 border border-red-900 bg-red-950/20 p-4 rounded-lg">
          <SupportTraceMessage
            value={error}
            messageClassName="text-red-400 font-bold"
            traceClassName="text-xs text-gray-500 font-mono"
            containerClassName="space-y-2"
          />
        </div>
      ) : null}

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Total Contracts</h3>
          <p className="text-4xl font-bold text-white">{metrics?.totalContracts ?? 0}</p>
        </div>
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Completion Rate</h3>
          <p className="text-4xl font-bold text-blue-500">{metrics?.completionRate ?? 0}%</p>
        </div>
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Failed Contracts</h3>
          <p className="text-4xl font-bold text-red-500">{metrics?.failedContracts ?? 0}</p>
        </div>
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Active Contracts</h3>
          <p className="text-4xl font-bold text-yellow-500">{metrics?.activeContracts ?? 0}</p>
        </div>
        <div className="bg-black border border-gray-800 p-6 rounded-lg">
          <h3 className="text-gray-500 text-xs uppercase mb-2">Open Risk Exposure</h3>
          <p className="text-4xl font-bold text-orange-500">{openRiskExposure}</p>
        </div>
      </main>

      <div className="mt-12 text-xs text-gray-700 uppercase tracking-widest text-center">
        PII and specific employee performance metrics are structurally redacted by the Aegis protocol.
      </div>
    </div>
  );
}
