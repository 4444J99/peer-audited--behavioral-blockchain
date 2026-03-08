'use client';

import { useParams } from 'next/navigation';
import { redirect } from 'next/navigation';

/**
 * Realm-scoped contract creation redirects to /contracts/new?realm=<slug>
 * to reuse the existing form with realm pre-filtering.
 */
export default function RealmNewContractPage() {
  const params = useParams();
  const slug = params.slug as string;
  redirect(`/contracts/new?realm=${encodeURIComponent(slug)}`);
}
