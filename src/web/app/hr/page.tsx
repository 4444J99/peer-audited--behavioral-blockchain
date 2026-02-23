'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api-client';

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

export default function HRDashboard() {
  const [metrics, setMetrics] = useState<EnterpriseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getEnterpriseMetrics('e0000000-0000-0000-0000-000000000001');
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-gray-400 font-bold">Loading Enterprise Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-12 font-sans">
      <header className="mb-12 border-b border-gray-800 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-gray-300">Styx Corporate</h1>
          <p className="text-sm text-gray-600 mt-1 uppercase tracking-widest">Enterprise Group Analytics</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-green-500 font-bold mb-1">Enterprise: {metrics?.enterpriseId.slice(0, 8)}...</div>
          <div className="text-gray-500">Total Enrolled: {metrics?.totalEmployees ?? 0} Employees</div>
          <div className="text-gray-500">Avg Integrity Score: {metrics?.avgIntegrityScore ?? 0}</div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </main>
      <div className="mt-12 text-xs text-gray-700 uppercase tracking-widest text-center">
        Note: PII and specific employee performance metrics are structurally redacted by the Aegis protocol.
      </div>
    </div>
  );
}
