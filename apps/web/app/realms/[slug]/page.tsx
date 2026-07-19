'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Flame, Plus } from 'lucide-react';
import { getRealmBySlug } from '../../../../shared/libs/realm-registry';

interface ContractRow {
  id: string;
  oath_category: string;
  verification_method: string;
  stake_amount: number;
  status: string;
  duration_days: number;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default function RealmInteriorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const realm = getRealmBySlug(slug);

  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [stats, setStats] = useState<{ activeContracts: number; totalStaked: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!realm) return;

    Promise.all([
      fetch(`/api/realms/${slug}`).then((r) => r.json()),
      fetch(`/api/realms/${slug}/contracts`).then((r) => r.json()),
    ])
      .then(([detail, contractsData]) => {
        setStats(detail.stats);
        setContracts(contractsData.contracts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, realm]);

  if (!realm) {
    return <p className="text-neutral-500">Realm not found.</p>;
  }

  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'PENDING_STAKE');
  const pastContracts = contracts.filter((c) => c.status !== 'ACTIVE' && c.status !== 'PENDING_STAKE');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Realm intro */}
      <div className="space-y-2">
        <p className="text-neutral-400">{realm.tagline}</p>
        {stats && (
          <div className="flex gap-6 text-sm text-neutral-500">
            <span>{stats.activeContracts} active contract{stats.activeContracts !== 1 ? 's' : ''}</span>
            <span className="font-bold" style={{ color: realm.theme.primary }}>
              ${stats.totalStaked.toLocaleString()} total staked
            </span>
          </div>
        )}
      </div>

      {/* New contract CTA */}
      <Link
        href={`/realms/${slug}/contracts/new`}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed text-sm font-bold uppercase tracking-widest transition-colors hover:bg-neutral-900"
        style={{ borderColor: `${realm.theme.primary}60`, color: realm.theme.primary }}
      >
        <Plus size={18} />
        New {realm.displayName} Contract
      </Link>

      {/* Active contracts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-neutral-900 rounded-xl animate-pulse border border-neutral-800" />
          ))}
        </div>
      ) : (
        <>
          {activeContracts.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Active</h2>
              <div className="space-y-3">
                {activeContracts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="block p-4 bg-neutral-950 border rounded-xl hover:bg-neutral-900 transition-colors"
                    style={{ borderColor: `${realm.theme.primary}30` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold">{c.oath_category.replace('_', ' ')}</span>
                        <span className="text-xs text-neutral-500 ml-2">{c.duration_days}d</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame size={14} style={{ color: realm.theme.primary }} />
                        <span className="font-black" style={{ color: realm.theme.primary }}>
                          ${Number(c.stake_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1">
                      {c.status} &middot; {c.verification_method}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {pastContracts.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">History</h2>
              <div className="space-y-3">
                {pastContracts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="block p-4 bg-neutral-950 border border-neutral-800 rounded-xl hover:bg-neutral-900 transition-colors opacity-70"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{c.oath_category.replace('_', ' ')}</span>
                      <span className={`text-xs font-bold ${c.status === 'COMPLETED' ? 'text-green-500' : 'text-red-500'}`}>
                        {c.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {contracts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-neutral-600 text-lg">No contracts in this realm yet.</p>
              <p className="text-neutral-700 text-sm mt-2">Create your first contract to enter this domain.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
