'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { api } from '../services/api-client';
import type { ContractDangerStatus } from '../services/api-client';

const SEVERITY_STYLE: Record<string, { box: string; text: string; label: string }> = {
  LOW: { box: 'bg-neutral-900 border-neutral-700', text: 'text-neutral-300', label: 'Low' },
  MEDIUM: { box: 'bg-yellow-900/20 border-yellow-800', text: 'text-yellow-400', label: 'Medium' },
  HIGH: { box: 'bg-orange-900/20 border-orange-800', text: 'text-orange-400', label: 'High' },
  CRITICAL: { box: 'bg-red-900/20 border-red-800', text: 'text-red-400', label: 'Critical' },
};

/**
 * The presentational half: one banner per open danger window, each paired with
 * the protection the API recommends for it. Renders nothing when the contract
 * is not in a danger zone, so a caller can mount it unconditionally.
 */
export function DangerZoneBanners({ status }: { status: ContractDangerStatus | null }) {
  if (!status || !status.inDangerZone || status.windows.length === 0) return null;

  return (
    <div className="space-y-3">
      {status.windows.map((danger) => {
        const style = SEVERITY_STYLE[danger.severity] || SEVERITY_STYLE.LOW;
        // Recommendations are returned keyed by the same window type, so the
        // pairing is by type rather than by index.
        const recommendation = status.recommendations.find((r) => r.type === danger.type);
        return (
          <div key={danger.type} className={`p-4 border rounded-xl ${style.box}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className={`shrink-0 ${style.text}`} />
              <span className={`font-bold text-sm ${style.text}`}>
                {style.label} risk &mdash; {danger.type.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-neutral-300">{danger.message}</p>
            {recommendation && (
              <div className="mt-3 flex items-start gap-2">
                <ShieldAlert size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-neutral-200">{recommendation.action}</p>
                  <p className="text-xs text-neutral-500 mt-1">{recommendation.description}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Danger-window banners for one contract. The API evaluates danger windows per
 * user across every ACTIVE contract (GET /behavioral/retention/danger-zone) —
 * there is no per-contract route — so this fetches the account-wide status and
 * keeps the row for `contractId`.
 */
export default function DangerZoneBanner({ contractId }: { contractId: string }) {
  const [status, setStatus] = useState<ContractDangerStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getDangerZoneStatus();
        if (cancelled) return;
        setStatus(data.contracts.find((c) => c.contractId === contractId) ?? null);
      } catch {
        // Advisory surface: a failed danger-zone read must not put an error on
        // a page whose primary content loaded fine.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  return <DangerZoneBanners status={status} />;
}
