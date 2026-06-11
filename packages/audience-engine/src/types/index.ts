/**
 * Type definitions for the Audience Growth Engine CLI.
 *
 * These types are the *machine-readable* form of the 5-parameter engine
 * defined in docs/playbooks/playbook--audience-growth-engine.md. Every type
 * here corresponds to a section in the playbook; the CLI generates
 * content plans by walking the types in the same order the playbook does.
 */

/** P1: The Host persona. Three valid archetypes per Playbook §1. */
export type HostArchetype =
  | "personal_creator"
  | "branded_expert"
  | "founder_operator";

/** P2: The single narrow entry niche (one sentence). */
export interface Wedge {
  /** One-sentence description of the wedge. */
  statement: string;
  /** Optional list of high-intent phrases for L1 demand capture. */
  highIntentPhrases?: string[];
}

/** P3: The product the audience enters. */
export interface Product {
  /** One-sentence description. */
  statement: string;
  /** The asset type (CLI, dashboard, app, platform, etc). */
  kind: "cli" | "dashboard" | "app" | "platform" | "service" | "other";
  /** Conversion target (e.g. "CLI install", "private demo request"). */
  conversionCta: string;
}

/** P4: The owned asset (list you control). */
export interface OwnedAsset {
  /** One-sentence description. */
  statement: string;
  /** The asset type. */
  kind: "email_list" | "github_stars" | "curated_list" | "waitlist" | "other";
}

/** P5: The proof loop (repeatable social-proof moment). */
export interface ProofLoop {
  /** One-sentence description. */
  statement: string;
  /** Cadence at which the proof loop fires. */
  cadence: "daily" | "weekly" | "monthly" | "quarterly";
  /** Output format. */
  format: "card" | "digest" | "reveal" | "essay" | "milestone";
}

/** The 5 engine parameters. */
export interface EngineParameters {
  p1Host: {
    archetype: HostArchetype;
    /** One-sentence name/identity of the Host. */
    statement: string;
  };
  p2Wedge: Wedge;
  p3Product: Product;
  p4OwnedAsset: OwnedAsset;
  p5ProofLoop: ProofLoop;
}

/** Dual-channel ratio defaults from Playbook §3. */
export interface ChannelRatio {
  /** % value/native content (the niche's core material). */
  value: number;
  /** % personal/trust content (founder, lived insight). */
  trust: number;
  /** % proof content (only on product channel). */
  proof: number;
  /** % direct conversion. */
  conversion: number;
}

/** A single content channel (Host or Product). */
export interface Channel {
  /** Channel role: "host" (front door) or "product" (destination). */
  role: "host" | "product";
  /** Display name for the channel. */
  name: string;
  /** One-sentence voice identity. */
  voice: string;
  /** What this channel does (the "does" list). */
  does: string[];
  /** What this channel does NOT do (the "does not" list). */
  doesNot: string[];
  /** Ratio breakdown. Host doesn't have proof; product does. */
  ratio: ChannelRatio;
  /** Weekly cadence targets. */
  cadence: WeeklyCadence;
}

/** Weekly cadence target. */
export interface WeeklyCadence {
  /** Short-form posts per week. */
  shortForm: number;
  /** Long-form posts (essays, deep dives) per week. */
  longForm: number;
  /** Story / narrative sequences per week. */
  story: number;
  /** Conversion touch posts per week. */
  conversion: number;
  /** Direct conversation prompts per week (Host channel only). */
  conversationPrompts?: number;
  /** Proof posts per week (Product channel only). */
  proofPosts?: number;
  /** Scope/trust posts per week (Product channel only). */
  scopeExplainers?: number;
}

/** Ladder configuration. */
export interface Ladder {
  /** Admission rule for the cohort. */
  admissionRule: string;
  /** First cohort size. Default 15-30. */
  cohortSize: number;
  /** The single weekly ritual reason to show up. */
  weeklyRitual: string;
  /** Source mix for the cohort. */
  sourceMix: {
    /** Own audience contribution. */
    own: number;
    /** Partner referrals. */
    partner: number;
    /** Intermediary referrals. */
    intermediary: number;
  };
}

/** The 5-level attack (L1 demand capture ... L5 authority). */
export interface FiveLevelAttack {
  /** L1 demand capture — high-intent phrases. */
  l1DemandCapture: {
    phrases: string[];
    capturePageRoute: string;
  };
  /** L2 borrowed audience — outreach targets. */
  l2BorrowedAudience: {
    targets: string[];
    /** Outreach voice adaptation. */
    voice: "consumer_creator" | "trade_press" | "luxury_professional";
  };
  /** L3 intermediary distribution. */
  l3Intermediaries: {
    hook: string;
    referralAsset: string;
  };
  /** L4 community loop. */
  l4CommunityLoop: {
    shareCardMoment: string;
    referralMechanic: string;
  };
  /** L5 authority layer — cornerstone essays. */
  l5Authority: {
    cornerstoneEssays: string[];
  };
  /** Niche-specific "do not say yet" list. */
  doNotSayYet: string[];
}

/** Audience-as-Product ladder (Playbook §5). */
export interface AudienceAsProduct {
  /** Rung order. */
  rungs: Array<{
    name: string;
    /** Whether this rung is the "Product" (the flagship CTA). */
    isProduct?: boolean;
  }>;
  /** Coexistence rule: how monetization avoids eroding trust. */
  coexistenceRule: string;
}

/** Engagement economics. */
export interface EngagementEconomics {
  /** Weekly hours budget. */
  weeklyHours: number;
  /** In-scope deliverables. */
  inScope: string[];
  /** Out of scope (what the engine explicitly does NOT do). */
  outOfScope: string[];
  /** ROI statement. */
  roiStatement: string;
}

/** The 6-10 KPIs. */
export interface KpiSet {
  name: string;
  /** Weekly target (the unit depends on the KPI). */
  weeklyTarget: number | string;
  /** The unit (followers, stars, $, %, etc). */
  unit: string;
}

/** Health bands. */
export interface HealthBands {
  green: string;
  yellow: string;
  red: string;
}

/** Niche sensitivity rules. */
export interface Guardrails {
  /** Inherited from. */
  inheritedFrom: string;
  /** Niche-specific sensitivity rule. */
  nicheRule: string;
}

/** The full instance config — this is what the YAML file holds. */
export interface InstanceConfig {
  /** System name (e.g. "styx", "public-record-data-scrapper"). */
  systemName: string;
  /** The 5 engine parameters. */
  parameters: EngineParameters;
  /** The dual-channel setup. */
  channels: {
    host: Channel;
    product: Channel;
  };
  /** The ladder configuration. */
  ladder: Ladder;
  /** The 5-level attack. */
  attack: FiveLevelAttack;
  /** Audience-as-product model. */
  audienceAsProduct: AudienceAsProduct;
  /** Engagement economics (optional, only if paid build). */
  engagementEconomics?: EngagementEconomics;
  /** KPIs to track. */
  kpis: KpiSet[];
  /** Health bands. */
  healthBands: HealthBands;
  /** Guardrails. */
  guardrails: Guardrails;
}

/** A single day in a generated content plan. */
export interface PlannedDay {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Day of week. */
  dayOfWeek: string;
  /** Channel ("host" or "product"). */
  channel: "host" | "product";
  /** Format (short_form, long_form, story, conversion, conversation_prompt, scope, proof, owned). */
  format: string;
  /** Content hook (one sentence). */
  hook: string;
  /** Pillar reference (1-indexed from the engine's pillar list). */
  pillar: number;
  /** CTA (or null if no CTA). */
  cta: string | null;
}

/** A generated 30-day plan. */
export interface ContentPlan {
  systemName: string;
  /** Start date (Monday). */
  startDate: string;
  /** End date (Sunday, 4 weeks later). */
  endDate: string;
  /** Pillar definitions (generated from parameters + ratio). */
  pillars: Array<{
    index: number;
    name: string;
    channel: "host" | "product";
    ratio: number;
    goal: string;
  }>;
  /** The 4 weeks of planned days. */
  weeks: Array<{
    weekNumber: number;
    theme: string;
    days: PlannedDay[];
  }>;
}
