"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Network,
  RefreshCw,
  Gavel,
} from "lucide-react";
import { api } from "../../../services/api-client";
import type {
  CollusionRing,
  EnforcementCase,
} from "../../../services/api-client";
import { useAuth } from "../../../contexts/AuthContext";

const RING_WINDOW_HOURS = 24 * 30;

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-900/50 text-yellow-400 border-yellow-800",
  PENALTY_APPLIED: "bg-red-900/50 text-red-400 border-red-800",
  APPEALED: "bg-blue-900/50 text-blue-400 border-blue-800",
  UPHELD: "bg-red-900/50 text-red-400 border-red-800",
  REVERSED: "bg-green-900/50 text-green-400 border-green-800",
};

function statusClass(status: string): string {
  return (
    STATUS_COLORS[status] || "bg-neutral-800 text-neutral-400 border-neutral-700"
  );
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

export default function CollusionPage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [rings, setRings] = useState<CollusionRing[]>([]);
  const [cases, setCases] = useState<EnforcementCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ringsData, casesData] = await Promise.all([
        api.getCollusionRings(RING_WINDOW_HOURS),
        api.getEnforcementCases({ status: "PENDING_REVIEW" }),
      ]);
      setRings(ringsData.rings || []);
      setCases(casesData.cases || []);
      setError(null);
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

  // Confirming is what actually burns reputation — the sweep only ever files a
  // PENDING_REVIEW case, so this button is the human step the detector defers to.
  const handleConfirm = async (caseId: string) => {
    setConfirming(caseId);
    try {
      await api.confirmEnforcementCase(caseId, { penaltyType: "REP_BURN" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm case");
    } finally {
      setConfirming(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">
          Loading collusion detections...
        </span>
      </div>
    );
  }

  if (error && rings.length === 0 && cases.length === 0) {
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

  const pendingRings = rings.filter((r) => r.pending_count > 0).length;
  const flaggedReviewers = rings.reduce((sum, r) => sum + r.member_count, 0);

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
          <Network className="text-red-500" size={28} />
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Collusion Detections
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

      {error && (
        <p className="mb-6 text-red-400 font-bold text-sm">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl border bg-neutral-900 border-neutral-800 text-center">
          <p className="text-2xl font-black">{rings.length}</p>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Rings (30d)
          </p>
        </div>
        <div className="p-4 rounded-2xl border bg-neutral-900 border-neutral-800 text-center">
          <p className="text-2xl font-black">{pendingRings}</p>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Awaiting Review
          </p>
        </div>
        <div className="p-4 rounded-2xl border bg-neutral-900 border-neutral-800 text-center">
          <p className="text-2xl font-black">{flaggedReviewers}</p>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Flagged Reviewers
          </p>
        </div>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-3">
        Detected Rings
      </h2>
      <div className="space-y-4 mb-12">
        {rings.map((ring) => (
          <div
            key={ring.ring_id}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-mono text-xs text-neutral-500">
                  {ring.ring_id}
                </p>
                <p className="font-bold mt-1">
                  {ring.member_count} reviewers ·{" "}
                  {(Number(ring.confidence) * 100).toFixed(1)}% confidence
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Detected {new Date(ring.detected_at).toLocaleString()} ·{" "}
                  {ring.signal_count ?? 0} signals
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(ring.signal_types || []).map((signal) => (
                  <span
                    key={signal}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border bg-neutral-800 border-neutral-700 text-neutral-400"
                  >
                    {signal.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(ring.members || []).map((member) => (
                <span
                  key={member.caseId}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${statusClass(member.status)}`}
                  title={`Reviewer ${member.reviewerId} — case ${member.caseId}`}
                >
                  {shortId(member.reviewerId)} · {member.status}
                  {member.integrityScore !== null
                    ? ` · IS ${member.integrityScore}`
                    : ""}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {rings.length === 0 && (
        <div className="text-center py-8 text-neutral-500 mb-12">
          No collusion rings detected in the last 30 days.
        </div>
      )}

      <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-3">
        Cases Awaiting Review
      </h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Reviewer
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Confidence
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Integrity
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Opened
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((enforcementCase) => (
                <tr
                  key={enforcementCase.id}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-mono text-neutral-400">
                    {shortId(enforcementCase.reviewer_id)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {enforcementCase.case_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {(Number(enforcementCase.confidence) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {enforcementCase.integrity_score ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500">
                    {new Date(enforcementCase.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleConfirm(enforcementCase.id)}
                      disabled={confirming === enforcementCase.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-800 hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                    >
                      {confirming === enforcementCase.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Gavel size={14} />
                      )}
                      Confirm REP_BURN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          No enforcement cases awaiting review.
        </div>
      )}
    </div>
  );
}
