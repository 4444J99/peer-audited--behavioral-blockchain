'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  REALM_REGISTRY,
  type RealmDefinition,
} from '../../../shared/libs/realm-registry';

interface RealmStats {
  activeContracts: number;
  totalStaked: number;
}

interface RealmWithStats {
  id: string;
  displayName: string;
  slug: string;
  oracleType: string;
  tagline: string;
  theme: { primary: string; accent: string };
  stats: RealmStats;
}

export default function RealmsHubPage() {
  const [realms, setRealms] = useState<RealmWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/realms')
      .then((res) => res.json())
      .then((data) => {
        setRealms(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to static registry data without stats
        setRealms(
          REALM_REGISTRY.map((r) => ({
            id: r.id,
            displayName: r.displayName,
            slug: r.slug,
            oracleType: r.oracleType,
            tagline: r.tagline,
            theme: r.theme,
            stats: { activeContracts: 0, totalStaked: 0 },
          })),
        );
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="flex items-center gap-4 mb-12 border-b border-neutral-800 pb-6">
        <Link
          href="/dashboard"
          className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Behavioral Realms
          </h1>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">
            Enter a domain to stake against your commitments
          </p>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-neutral-900 rounded-xl animate-pulse border border-neutral-800"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {realms.map((realm) => (
            <Link
              key={realm.id}
              href={`/realms/${realm.slug}`}
              className="group relative block rounded-xl border-2 bg-neutral-950 p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{
                borderColor: realm.theme.primary,
                '--realm-glow': `${realm.theme.primary}33`,
              } as React.CSSProperties}
            >
              {/* Color bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{ backgroundColor: realm.theme.primary }}
              />

              <div className="mt-2">
                <h2 className="text-lg font-black uppercase tracking-tight">
                  {realm.displayName}
                </h2>
                <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">
                  {realm.oracleType} oracle
                </p>
                <p className="text-sm text-neutral-400 mt-3">{realm.tagline}</p>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-neutral-500">
                {realm.stats.activeContracts > 0 ? (
                  <>
                    <span>
                      {realm.stats.activeContracts} active contract
                      {realm.stats.activeContracts !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold" style={{ color: realm.theme.primary }}>
                      ${realm.stats.totalStaked.toLocaleString()} staked
                    </span>
                  </>
                ) : (
                  <span className="italic">Unexplored</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
