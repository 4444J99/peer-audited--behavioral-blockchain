'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getRealmBySlug, REALM_REGISTRY } from '../../../../shared/libs/realm-registry';

export default function RealmLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;
  const realm = getRealmBySlug(slug);

  if (!realm) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-neutral-500">Realm not found.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        '--realm-primary': realm.theme.primary,
        '--realm-accent': realm.theme.accent,
      } as React.CSSProperties}
    >
      {/* Realm header */}
      <header className="border-b px-6 py-4 flex items-center gap-4" style={{ borderColor: `${realm.theme.primary}40` }}>
        <Link
          href="/realms"
          className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex-1">
          <h1 className="text-lg font-black uppercase tracking-tight" style={{ color: realm.theme.primary }}>
            {realm.displayName}
          </h1>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">
            {realm.oracleType} oracle
          </p>
        </div>

        {/* Other realms as small navigation dots */}
        <div className="hidden sm:flex items-center gap-2">
          {REALM_REGISTRY.filter((r) => r.id !== realm.id).map((r) => (
            <Link
              key={r.id}
              href={`/realms/${r.slug}`}
              title={r.displayName}
              className="w-3 h-3 rounded-full opacity-40 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: r.theme.primary }}
            />
          ))}
        </div>
      </header>

      <main className="p-6 md:p-12">{children}</main>
    </div>
  );
}
