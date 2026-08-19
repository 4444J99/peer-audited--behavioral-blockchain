/**
 * Static params for the Cloudflare snapshot export.
 *
 * `output: export` requires every dynamic route to declare the pages it generates.
 * These ids come from the synthetic seed (src/api/database/seed.sql plus
 * scripts/demo/seed-circles.sql), so the exported pages match what a real demo run
 * shows -- they are not invented.
 *
 * Every helper returns [] unless the snapshot flag is set. In a normal build that
 * leaves each route rendering on demand exactly as before, so adding these exports
 * does not change how the product behaves when served by a real API.
 */

const SNAPSHOT = process.env.NEXT_PUBLIC_STYX_SNAPSHOT === 'true';

/** Seeded contracts, including the two on River's dashboard. */
export const SNAPSHOT_CONTRACT_IDS = [
  'c0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000004',
  'c1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000004',
];

/** The seeded realms, each with its own evidence rules and auditor expertise. */
export const SNAPSHOT_REALM_SLUGS = [
  'biological-hardware',
  'character-social',
  'cognitive-device',
  'creative-process',
  'environmental-visual',
  'professional-api',
  'recovery-abstinence',
];

export function snapshotContractParams(): Array<{ id: string }> {
  if (!SNAPSHOT) return [];
  return SNAPSHOT_CONTRACT_IDS.map((id) => ({ id }));
}

export function snapshotRealmParams(): Array<{ slug: string }> {
  if (!SNAPSHOT) return [];
  return SNAPSHOT_REALM_SLUGS.map((slug) => ({ slug }));
}
