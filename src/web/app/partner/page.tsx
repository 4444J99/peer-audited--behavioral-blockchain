'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Ban, Check, Clock, Inbox, Loader2, MessageSquare, PenLine, Users, X,
} from 'lucide-react';
import { api } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';
import type {
  AccountabilityStatus,
  PartnerCheckIn,
  PartnerInvitation,
  Partnership,
} from '../../services/api-client';

function categoryLabel(oathCategory: string): string {
  return oathCategory.replace(/_/g, ' ');
}

function stakeLabel(stakeAmount: string): string {
  const value = Number(stakeAmount);
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : '$0.00';
}

/**
 * Only RECOVERY_* contracts have a break-request timelock, so the veto is the
 * one partner action that is category-conditional.
 */
export function supportsVeto(oathCategory: string): boolean {
  return oathCategory.startsWith('RECOVERY_');
}

export function InvitationCard({
  invitation,
  busy,
  onAccept,
  onDecline,
}: {
  invitation: PartnerInvitation;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Invited by</p>
        <p className="font-bold text-white break-all">{invitation.owner_email}</p>
      </div>
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Oath</p>
          <p className="font-bold text-white">{categoryLabel(invitation.oath_category)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Stake</p>
          <p className="font-bold text-red-500">{stakeLabel(invitation.stake_amount)}</p>
        </div>
      </div>
      <p className="text-sm text-neutral-400">
        As their partner you co-sign daily attestations and can veto an intentional break
        while it is still in its 24-hour cooldown.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          disabled={busy}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-black font-black rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
          ACCEPT
        </button>
        <button
          onClick={onDecline}
          disabled={busy}
          className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <X size={16} />
          DECLINE
        </button>
      </div>
    </div>
  );
}

export function CheckInThread({
  checkIns,
  draft,
  busy,
  onDraftChange,
  onComplete,
}: {
  checkIns: PartnerCheckIn[];
  draft: string;
  busy: boolean;
  onDraftChange: (value: string) => void;
  onComplete: (checkInId: string) => void;
}) {
  const pending = checkIns.find((c) => c.status === 'PENDING');

  return (
    <div className="space-y-3">
      <h4 className="text-xs uppercase tracking-widest text-neutral-500">Check-In History</h4>
      {checkIns.length === 0 ? (
        <p className="text-sm text-neutral-500">No check-ins scheduled yet.</p>
      ) : (
        <ul className="space-y-2">
          {checkIns.map((checkIn) => (
            <li
              key={checkIn.id}
              className="p-3 bg-black border border-neutral-800 rounded-xl flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{checkIn.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-neutral-500">
                  {checkIn.scheduledAt ? new Date(checkIn.scheduledAt).toLocaleString() : 'Unscheduled'}
                </p>
                {checkIn.message && (
                  <p className="text-sm text-neutral-300 mt-1 break-words">{checkIn.message}</p>
                )}
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
                  checkIn.status === 'COMPLETED'
                    ? 'bg-green-900/30 text-green-400'
                    : checkIn.status === 'PENDING'
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'bg-red-900/30 text-red-400'
                }`}
              >
                {checkIn.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pending && (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="How are they holding up?"
            rows={2}
            className="w-full px-4 py-3 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
          />
          <button
            onClick={() => onComplete(pending.id)}
            disabled={busy || draft.trim().length === 0}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="animate-spin" size={16} /> : <MessageSquare size={16} />}
            COMPLETE CHECK-IN
          </button>
        </div>
      )}
    </div>
  );
}

export function PartnershipCard({
  partnership,
  busy,
  expanded,
  status,
  checkIns,
  draft,
  onToggle,
  onCosign,
  onVeto,
  onDraftChange,
  onCompleteCheckIn,
}: {
  partnership: Partnership;
  busy: boolean;
  expanded: boolean;
  status: AccountabilityStatus | null;
  checkIns: PartnerCheckIn[];
  draft: string;
  onToggle: () => void;
  onCosign: () => void;
  onVeto: () => void;
  onDraftChange: (value: string) => void;
  onCompleteCheckIn: (checkInId: string) => void;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Partnered with</p>
          <p className="font-bold text-white break-all">{partnership.owner_email}</p>
          <p className="text-sm text-neutral-400 mt-1">
            {categoryLabel(partnership.oath_category)} &bull; {stakeLabel(partnership.stake_amount)} at stake
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-900/30 text-blue-400">
          {partnership.contract_status}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onCosign}
          disabled={busy}
          className="flex-1 min-w-[12rem] py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-black font-black rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : <PenLine size={16} />}
          CO-SIGN ATTESTATION
        </button>
        {supportsVeto(partnership.oath_category) && (
          <button
            onClick={onVeto}
            disabled={busy}
            className="flex-1 min-w-[12rem] py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Ban size={16} />
            VETO PENDING BREAK
          </button>
        )}
        <button
          onClick={onToggle}
          className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <Clock size={16} />
          {expanded ? 'HIDE HISTORY' : 'SHOW HISTORY'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6 pt-2 border-t border-neutral-800">
          <div className="space-y-3 pt-4">
            <h4 className="text-xs uppercase tracking-widest text-neutral-500">Partner Ledger</h4>
            {status && status.history.length > 0 ? (
              <ul className="space-y-2">
                {status.history.map((event) => (
                  <li
                    key={event.id}
                    className="p-3 bg-black border border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <span className="text-sm font-bold text-white">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {event.created_at ? new Date(event.created_at).toLocaleString() : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No partner events recorded yet.</p>
            )}
          </div>

          <CheckInThread
            checkIns={checkIns}
            draft={draft}
            busy={busy}
            onDraftChange={onDraftChange}
            onComplete={onCompleteCheckIn}
          />
        </div>
      )}
    </div>
  );
}

export default function PartnerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AccountabilityStatus>>({});
  const [checkIns, setCheckIns] = useState<Record<string, PartnerCheckIn[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [invites, active] = await Promise.all([
      api.getPartnerInvitations(),
      api.getPartnerships(),
    ]);
    setInvitations(invites);
    setPartnerships(active);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    reload()
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load partner activity');
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, reload]);

  // Every action re-reads both lists: accepting moves a row from one section
  // to the other, and a decline removes it, so local mutation would drift.
  const run = async (contractId: string, action: () => Promise<string>) => {
    setBusyId(contractId);
    setError(null);
    setNotice(null);
    try {
      setNotice(await action());
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleAccept = (contractId: string) =>
    run(contractId, async () => {
      await api.acceptPartnerInvitation(contractId);
      return 'Invitation accepted. You are now an active accountability partner.';
    });

  const handleDecline = (contractId: string) =>
    run(contractId, async () => {
      await api.respondToPartnerInvite(contractId, false);
      return 'Invitation declined.';
    });

  const handleCosign = (contractId: string) =>
    run(contractId, async () => {
      await api.cosignAttestation(contractId);
      return "Today's attestation co-signed.";
    });

  const handleVeto = (contractId: string) =>
    run(contractId, async () => {
      const result = await api.vetoRecoveryBreak(contractId);
      return result.message;
    });

  const handleCompleteCheckIn = (contractId: string, checkInId: string) =>
    run(contractId, async () => {
      await api.completePartnerCheckIn(checkInId, drafts[contractId] ?? '');
      setDrafts((prev) => ({ ...prev, [contractId]: '' }));
      const refreshed = await api.getPartnerCheckIns(contractId);
      setCheckIns((prev) => ({ ...prev, [contractId]: refreshed }));
      return 'Check-in recorded.';
    });

  const handleToggle = async (contractId: string) => {
    if (expanded === contractId) {
      setExpanded(null);
      return;
    }
    setExpanded(contractId);
    try {
      const [status, history] = await Promise.all([
        api.getAccountabilityStatus(contractId),
        api.getPartnerCheckIns(contractId),
      ]);
      setStatuses((prev) => ({ ...prev, [contractId]: status }));
      setCheckIns((prev) => ({ ...prev, [contractId]: history }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partner history');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading partner activity...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12">
      <header className="flex items-center gap-4 mb-10 border-b border-neutral-800 pb-6">
        <Link
          href="/dashboard"
          className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <Users className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Accountability Partner</h1>
            <p className="text-xs text-neutral-500 uppercase tracking-widest">
              Invitations, co-signatures, and vetoes
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto space-y-10">
        {notice && (
          <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-xl text-green-400 text-sm font-bold">
            {notice}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-xl text-red-400 text-sm font-bold">
            {error}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 flex items-center gap-2">
            <Inbox size={14} /> Pending Invitations
          </h2>
          {invitations.length === 0 ? (
            <p className="text-neutral-500 text-sm">
              No one has invited you to be their accountability partner yet.
            </p>
          ) : (
            invitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                busy={busyId === invitation.contract_id}
                onAccept={() => handleAccept(invitation.contract_id)}
                onDecline={() => handleDecline(invitation.contract_id)}
              />
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 flex items-center gap-2">
            <Users size={14} /> Your Partnerships
          </h2>
          {partnerships.length === 0 ? (
            <p className="text-neutral-500 text-sm">
              You are not an active partner on any contract yet.
            </p>
          ) : (
            partnerships.map((partnership) => (
              <PartnershipCard
                key={partnership.id}
                partnership={partnership}
                busy={busyId === partnership.contract_id}
                expanded={expanded === partnership.contract_id}
                status={statuses[partnership.contract_id] ?? null}
                checkIns={checkIns[partnership.contract_id] ?? []}
                draft={drafts[partnership.contract_id] ?? ''}
                onToggle={() => handleToggle(partnership.contract_id)}
                onCosign={() => handleCosign(partnership.contract_id)}
                onVeto={() => handleVeto(partnership.contract_id)}
                onDraftChange={(value) =>
                  setDrafts((prev) => ({ ...prev, [partnership.contract_id]: value }))
                }
                onCompleteCheckIn={(checkInId) =>
                  handleCompleteCheckIn(partnership.contract_id, checkInId)
                }
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
