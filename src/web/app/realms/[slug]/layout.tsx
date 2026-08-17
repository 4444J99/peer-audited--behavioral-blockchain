import React from 'react';

import RealmChrome from './RealmChrome';
import { snapshotRealmParams } from '../../../lib/snapshot-params';

/**
 * A server layout whose only job beyond rendering the chrome is to declare the realm
 * pages the Cloudflare snapshot export generates. `output: export` refuses to build a
 * dynamic route without generateStaticParams, and a 'use client' module cannot export
 * it -- which is why the chrome now lives in RealmChrome.tsx. It covers both
 * /realms/[slug] and /realms/[slug]/contracts/new.
 *
 * Outside a snapshot build the helper returns [], so these routes render on demand
 * exactly as they did before this split.
 */
export function generateStaticParams() {
  return snapshotRealmParams();
}

export default function RealmLayout({ children }: { children: React.ReactNode }) {
  return <RealmChrome>{children}</RealmChrome>;
}
