/**
 * Realm Registry: Portal-Based Behavioral Domain Separation
 *
 * Each behavioral stream maps to a Realm — an isolated domain with its own
 * identity, verification oracle family, guardrails, and explicit cross-realm bridges.
 *
 * Naming convention: ontological-function IDs describe what the realm IS and
 * HOW it verifies. Public-facing branded names are a rendering concern
 * controlled by displayName — not baked into enum keys or DB columns.
 */

import { OathCategory, ACTIVE_OATH_STREAMS, VerificationMethod } from './behavioral-logic';

// ---------------------------------------------------------------------------
// Realm ID enum — compile-time constants, no DB roundtrip for UI rendering
// ---------------------------------------------------------------------------

export enum RealmId {
  BIOLOGICAL_HARDWARE   = 'BIOLOGICAL_HARDWARE',
  COGNITIVE_DEVICE      = 'COGNITIVE_DEVICE',
  PROFESSIONAL_API      = 'PROFESSIONAL_API',
  CREATIVE_PROCESS      = 'CREATIVE_PROCESS',
  ENVIRONMENTAL_VISUAL  = 'ENVIRONMENTAL_VISUAL',
  CHARACTER_SOCIAL      = 'CHARACTER_SOCIAL',
  RECOVERY_ABSTINENCE   = 'RECOVERY_ABSTINENCE',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OracleType =
  | 'HARDWARE'
  | 'DEVICE'
  | 'API'
  | 'PROCESS'
  | 'VISUAL'
  | 'MULTI'
  | 'ABSTINENCE';

export interface RealmBridge {
  /** Target realm this bridge connects to */
  targetRealm: RealmId;
  /** Direction of data flow */
  direction: 'READ' | 'WRITE' | 'BIDIRECTIONAL';
  /** What data is shared across the bridge */
  dataScope: string;
  /** Why this bridge exists */
  rationale: string;
}

export interface RealmGuardrail {
  /** Unique key for this guardrail */
  key: string;
  /** Human-readable description */
  description: string;
}

export interface RealmTheme {
  primary: string;
  accent: string;
}

export interface RealmDefinition {
  id: RealmId;
  displayName: string;
  slug: string;
  streamPrefix: string;
  oracleType: OracleType;
  tagline: string;
  guardrails: RealmGuardrail[];
  bridges: RealmBridge[];
  /** What other realms can see about this realm's data */
  visibility: 'PRIVATE' | 'AGGREGATE_ONLY' | 'PUBLIC_STATS';
  theme: RealmTheme;
}

// ---------------------------------------------------------------------------
// Registry — the single source of compile-time realm definitions
// ---------------------------------------------------------------------------

export const REALM_REGISTRY: readonly RealmDefinition[] = [
  {
    id: RealmId.BIOLOGICAL_HARDWARE,
    displayName: 'Biological Hardware',
    slug: 'biological-hardware',
    streamPrefix: 'BIOLOGICAL',
    oracleType: 'HARDWARE',
    tagline: 'Body metrics verified by hardware oracles',
    guardrails: [
      { key: 'AEGIS_BMI_FLOOR', description: 'Minimum safe BMI enforced (18.5)' },
      { key: 'AEGIS_VELOCITY_CAP', description: 'Max 2% weekly weight loss velocity' },
    ],
    bridges: [],
    visibility: 'PRIVATE',
    theme: { primary: '#dc2626', accent: '#991b1b' },
  },
  {
    id: RealmId.COGNITIVE_DEVICE,
    displayName: 'Cognitive Device',
    slug: 'cognitive-device',
    streamPrefix: 'COGNITIVE',
    oracleType: 'DEVICE',
    tagline: 'Focus and digital habits tracked by device APIs',
    guardrails: [],
    bridges: [],
    visibility: 'AGGREGATE_ONLY',
    theme: { primary: '#3b82f6', accent: '#1d4ed8' },
  },
  {
    id: RealmId.PROFESSIONAL_API,
    displayName: 'Professional API',
    slug: 'professional-api',
    streamPrefix: 'PROFESSIONAL',
    oracleType: 'API',
    tagline: 'Work output verified by third-party integrations',
    guardrails: [],
    bridges: [],
    visibility: 'PUBLIC_STATS',
    theme: { primary: '#f59e0b', accent: '#b45309' },
  },
  {
    id: RealmId.CREATIVE_PROCESS,
    displayName: 'Creative Process',
    slug: 'creative-process',
    streamPrefix: 'CREATIVE',
    oracleType: 'PROCESS',
    tagline: 'Creation verified by time-lapse and peer review',
    guardrails: [],
    bridges: [],
    visibility: 'PUBLIC_STATS',
    theme: { primary: '#a855f7', accent: '#7e22ce' },
  },
  {
    id: RealmId.ENVIRONMENTAL_VISUAL,
    displayName: 'Environmental Visual',
    slug: 'environmental-visual',
    streamPrefix: 'VISUAL',
    oracleType: 'VISUAL',
    tagline: 'Environment and habits verified by visual proof',
    guardrails: [],
    bridges: [],
    visibility: 'AGGREGATE_ONLY',
    theme: { primary: '#10b981', accent: '#047857' },
  },
  {
    id: RealmId.CHARACTER_SOCIAL,
    displayName: 'Character Social',
    slug: 'character-social',
    streamPrefix: 'SOCIAL',
    oracleType: 'MULTI',
    tagline: 'Community engagement verified by multi-oracle consensus',
    guardrails: [],
    bridges: [],
    visibility: 'PUBLIC_STATS',
    theme: { primary: '#06b6d4', accent: '#0e7490' },
  },
  {
    id: RealmId.RECOVERY_ABSTINENCE,
    displayName: 'Recovery Abstinence',
    slug: 'recovery-abstinence',
    streamPrefix: 'RECOVERY',
    oracleType: 'ABSTINENCE',
    tagline: 'Recovery commitments verified by attestation and peer review',
    guardrails: [
      { key: 'RECOVERY_MAX_DURATION', description: 'Contracts capped at 30 days' },
      { key: 'RECOVERY_MAX_TARGETS', description: 'Max 3 no-contact identifiers' },
      { key: 'RECOVERY_AP_REQUIRED', description: 'Accountability partner mandatory' },
    ],
    bridges: [
      {
        targetRealm: RealmId.BIOLOGICAL_HARDWARE,
        direction: 'READ',
        dataScope: 'health_safety_flags',
        rationale: 'Recovery realm reads health safety signals to prevent harm',
      },
    ],
    visibility: 'PRIVATE',
    theme: { primary: '#f97316', accent: '#c2410c' },
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup maps (built once at module load)
// ---------------------------------------------------------------------------

const _byId = new Map<RealmId, RealmDefinition>(
  REALM_REGISTRY.map((r) => [r.id, r]),
);

const _bySlug = new Map<string, RealmDefinition>(
  REALM_REGISTRY.map((r) => [r.slug, r]),
);

const _byPrefix = new Map<string, RealmDefinition>(
  REALM_REGISTRY.map((r) => [r.streamPrefix, r]),
);

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

/**
 * Derives the realm for a given oath category by extracting its stream prefix.
 * Returns undefined if the category doesn't map to any realm.
 */
export function getRealmForCategory(category: OathCategory): RealmId | undefined {
  const prefix = (category as string).split('_')[0];
  const realm = _byPrefix.get(prefix);
  return realm?.id;
}

/**
 * Look up a realm definition by its URL slug.
 */
export function getRealmBySlug(slug: string): RealmDefinition | undefined {
  return _bySlug.get(slug);
}

/**
 * Look up a realm definition by its ID.
 */
export function getRealmById(id: RealmId): RealmDefinition | undefined {
  return _byId.get(id);
}

/**
 * Returns all OathCategory values that belong to a given realm.
 */
export function getOathCategoriesForRealm(realmId: RealmId): OathCategory[] {
  const realm = _byId.get(realmId);
  if (!realm) return [];

  return Object.values(OathCategory).filter((cat) => {
    const prefix = (cat as string).split('_')[0];
    return prefix === realm.streamPrefix;
  });
}

/**
 * Returns all realm IDs in registry order.
 */
export function getAllRealmIds(): RealmId[] {
  return REALM_REGISTRY.map((r) => r.id);
}

/**
 * Returns all realm slugs in registry order.
 */
export function getAllRealmSlugs(): string[] {
  return REALM_REGISTRY.map((r) => r.slug);
}
