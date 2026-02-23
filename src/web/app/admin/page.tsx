'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, Shield, Ban, Gavel, FlaskConical, Users, FileCheck, Activity } from 'lucide-react';
import { api } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';

interface AdminStats {
  totalUsers: number;
  activeContracts: number;
  pendingProofs: number;
  avgIntegrity: number;
}

export default function AdminPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Honeypot
  const [honeypotLoading, setHoneypotLoading] = useState(false);
  const [honeypotResult, setHoneypotResult] = useState<string | null>(null);

  // Ban
  const [banUserId, setBanUserId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [banResult, setBanResult] = useState<string | null>(null);

  // Resolution
  const [resolveContractId, setResolveContractId] = useState('');
  const [resolveOutcome, setResolveOutcome] = useState<'COMPLETED' | 'FAILED'>('COMPLETED');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveResult, setResolveResult] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (authUser.role !== 'ADMIN') {
      setError('Forbidden: ADMIN role required');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const statsData = await api.getAdminStats();
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authUser, authLoading, router]);

  const handleHoneypot = async () => {
    setHoneypotLoading(true);
    setHoneypotResult(null);
    try {
      const result = await api.injectHoneypot();
      setHoneypotResult(`Honeypot injected (job: ${result.jobId})`);
    } catch (err) {
      setHoneypotResult(err instanceof Error ? err.message : 'Failed');
    } finally {
      setHoneypotLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banUserId.trim()) return;
    setBanLoading(true);
    setBanResult(null);
    try {
      await api.banUser(banUserId, banReason || 'Admin action');
      setBanResult(`User ${banUserId.slice(0, 8)} banned.`);
      setBanUserId('');
      setBanReason('');
    } catch (err) {
      setBanResult(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBanLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveContractId.trim()) return;
    setResolveLoading(true);
    setResolveResult(null);
    try {
      await api.adminResolve(resolveContractId, resolveOutcome);
      setResolveResult(`Contract ${resolveContractId.slice(0, 8)} resolved as ${resolveOutcome}.`);
      setResolveContractId('');
    } catch (err) {
      setResolveResult(err instanceof Error ? err.message : 'Failed');
    } finally {
      setResolveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error}</p>
          <Link href="/dashboard" className="text-neutral-400 hover:text-white underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-3">
          <Shield className="text-red-500" size={28} />
          <h1 className="text-2xl font-black tracking-tight uppercase">Admin Panel</h1>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-center">
            <Users className="mx-auto text-neutral-500 mb-2" size={20} />
            <p className="text-2xl font-black">{stats.totalUsers}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Users</p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-center">
            <FileCheck className="mx-auto text-neutral-500 mb-2" size={20} />
            <p className="text-2xl font-black">{stats.activeContracts}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Active Contracts</p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-center">
            <Activity className="mx-auto text-neutral-500 mb-2" size={20} />
            <p className="text-2xl font-black">{stats.pendingProofs}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Pending Proofs</p>
          </div>
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-center">
            <Shield className="mx-auto text-neutral-500 mb-2" size={20} />
            <p className="text-2xl font-black">{stats.avgIntegrity}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Avg Integrity</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Honeypot Panel */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="text-yellow-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Honeypot</h2>
          </div>
          <p className="text-neutral-500 text-sm">Inject a known-fail proof into the Fury queue to test auditor integrity.</p>
          <button
            onClick={handleHoneypot}
            disabled={honeypotLoading}
            className="w-full py-3 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {honeypotLoading ? <Loader2 className="animate-spin" size={16} /> : <FlaskConical size={16} />}
            Inject Honeypot
          </button>
          {honeypotResult && <p className="text-sm text-neutral-400">{honeypotResult}</p>}
        </div>

        {/* Ban Panel */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Ban className="text-red-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Ban User</h2>
          </div>
          <input
            type="text"
            value={banUserId}
            onChange={(e) => setBanUserId(e.target.value)}
            placeholder="User ID"
            className="w-full px-4 py-2 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 text-sm"
          />
          <input
            type="text"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason"
            className="w-full px-4 py-2 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 text-sm"
          />
          <button
            onClick={handleBan}
            disabled={banLoading || !banUserId.trim()}
            className="w-full py-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {banLoading ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
            Ban User
          </button>
          {banResult && <p className="text-sm text-neutral-400">{banResult}</p>}
        </div>

        {/* Resolution Panel */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Gavel className="text-blue-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Resolve Contract</h2>
          </div>
          <input
            type="text"
            value={resolveContractId}
            onChange={(e) => setResolveContractId(e.target.value)}
            placeholder="Contract ID"
            className="w-full px-4 py-2 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 text-sm"
          />
          <select
            value={resolveOutcome}
            onChange={(e) => setResolveOutcome(e.target.value as 'COMPLETED' | 'FAILED')}
            className="w-full px-4 py-2 bg-black border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-red-600 text-sm"
          >
            <option value="COMPLETED">COMPLETED (return stake)</option>
            <option value="FAILED">FAILED (capture stake)</option>
          </select>
          <button
            onClick={handleResolve}
            disabled={resolveLoading || !resolveContractId.trim()}
            className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {resolveLoading ? <Loader2 className="animate-spin" size={16} /> : <Gavel size={16} />}
            Resolve
          </button>
          {resolveResult && <p className="text-sm text-neutral-400">{resolveResult}</p>}
        </div>
      </div>
    </div>
  );
}
