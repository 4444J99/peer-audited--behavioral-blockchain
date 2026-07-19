"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { api } from "../../../services/api-client";
import { useAuth } from "../../../contexts/AuthContext";

interface Jurisdiction {
  code: string;
  name: string;
  tier: string;
  disposition_mode: string;
  updated_at: string;
}

const TIER_LABELS: Record<string, string> = {
  FULL_ACCESS: "TIER 1 — Full Access",
  REFUND_ONLY: "TIER 2 — Refund Only",
  HARD_BLOCK: "TIER 3 — Hard Block",
};

const TIER_COLORS: Record<string, string> = {
  FULL_ACCESS: "bg-green-900/50 text-green-400 border-green-800",
  REFUND_ONLY: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
  HARD_BLOCK: "bg-red-900/50 text-red-400 border-red-800",
};

export default function JurisdictionsPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [jurisdictionsData, killSwitchData] = await Promise.all([
        api.getJurisdictions(),
        api.getKillSwitch(),
      ]);
      setJurisdictions(jurisdictionsData.jurisdictions || []);
      setKillSwitchActive(killSwitchData.refundOnlyMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !authUser) return;
    if (authUser.role !== "ADMIN") {
      setError("Forbidden: ADMIN role required");
      setLoading(false);
      return;
    }
    loadData();
  }, [authUser, authLoading, loadData]);

  const handleTierChange = async (code: string, newTier: string) => {
    setSaving(code);
    try {
      await api.updateJurisdiction(code, { tier: newTier });
      setJurisdictions((prev) =>
        prev.map((j) => (j.code === code ? { ...j, tier: newTier } : j)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update jurisdiction",
      );
    } finally {
      setSaving(null);
    }
  };

  const handleKillSwitchToggle = async () => {
    setKillSwitchLoading(true);
    try {
      const result = await api.setKillSwitch(!killSwitchActive);
      setKillSwitchActive(result.refundOnlyMode);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle kill switch",
      );
    } finally {
      setKillSwitchLoading(false);
    }
  };

  const filtered =
    filter === "ALL"
      ? jurisdictions
      : jurisdictions.filter((j) => j.tier === filter);

  const tierCounts = jurisdictions.reduce(
    (acc, j) => {
      acc[j.tier] = (acc[j.tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">
          Loading jurisdictions...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error}</p>
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white underline"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-3">
          <MapPin className="text-blue-500" size={28} />
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Jurisdiction Policy Registry
          </h1>
        </div>
        <button
          onClick={loadData}
          className="ml-auto p-2 text-neutral-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Kill Switch */}
      <div
        className={`mb-8 p-6 rounded-2xl border ${
          killSwitchActive
            ? "bg-red-950/50 border-red-800"
            : "bg-neutral-900 border-neutral-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {killSwitchActive ? (
              <ShieldAlert className="text-red-500" size={24} />
            ) : (
              <ShieldCheck className="text-green-500" size={24} />
            )}
            <div>
              <h2 className="font-bold uppercase tracking-widest text-sm">
                Kill Switch — Refund-Only Mode
              </h2>
              <p className="text-neutral-400 text-sm mt-1">
                {killSwitchActive
                  ? "ACTIVE: All settlements forced to REFUND mode regardless of jurisdiction"
                  : "INACTIVE: Settlements follow jurisdiction policy (CAPTURE for TIER_1, REFUND for TIER_2/3)"}
              </p>
            </div>
          </div>
          <button
            onClick={handleKillSwitchToggle}
            disabled={killSwitchLoading}
            className={`px-6 py-3 font-bold rounded-xl transition-colors flex items-center gap-2 ${
              killSwitchActive
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-red-700 hover:bg-red-600 text-white"
            }`}
          >
            {killSwitchLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : killSwitchActive ? (
              <ShieldCheck size={16} />
            ) : (
              <ShieldAlert size={16} />
            )}
            {killSwitchActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Object.entries(TIER_LABELS).map(([tier, label]) => (
          <button
            key={tier}
            onClick={() => setFilter(filter === tier ? "ALL" : tier)}
            className={`p-4 rounded-2xl border text-center transition-colors ${
              filter === tier
                ? TIER_COLORS[tier]
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600"
            }`}
          >
            <p className="text-2xl font-black">{tierCounts[tier] || 0}</p>
            <p className="text-xs uppercase tracking-widest">{label}</p>
          </button>
        ))}
      </div>

      {/* Jurisdictions Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  State
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Tier
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Disposition
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((jurisdiction) => (
                <tr
                  key={jurisdiction.code}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold">
                    {jurisdiction.name}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-neutral-400">
                    {jurisdiction.code}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={jurisdiction.tier}
                      onChange={(e) =>
                        handleTierChange(jurisdiction.code, e.target.value)
                      }
                      disabled={saving === jurisdiction.code}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${TIER_COLORS[jurisdiction.tier] || "bg-neutral-800 text-neutral-400 border-neutral-700"} focus:outline-none focus:border-blue-600`}
                      aria-label={`Tier for ${jurisdiction.code}`}
                    >
                      <option value="FULL_ACCESS">FULL_ACCESS</option>
                      <option value="REFUND_ONLY">REFUND_ONLY</option>
                      <option value="HARD_BLOCK">HARD_BLOCK</option>
                    </select>
                    {saving === jurisdiction.code && (
                      <Loader2
                        className="inline-block ml-2 animate-spin"
                        size={14}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {jurisdiction.disposition_mode}
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500">
                    {new Date(jurisdiction.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          No jurisdictions match the selected filter.
        </div>
      )}
    </div>
  );
}
