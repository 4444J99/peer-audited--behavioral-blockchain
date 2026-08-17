/**
 * Identity-based oath onboarding — the single source of truth shared by the
 * web onboarding wizard and the API that persists the declaration.
 *
 * A task list ("do not text them for 30 days") describes behavior. An identity
 * statement ("I am becoming someone who keeps the distance they chose")
 * describes the person the behavior belongs to, and it is the identity that the
 * contract is bound to. The archetypes, the pledge wording, and the copy-variant
 * assignment all live here so the sentence the user reads while declaring is
 * byte-identical to the sentence stored against their contract — a client that
 * composed its own wording would leave the persisted pledge silently divergent.
 *
 * Wording constraints (TKT-P1-016 legal gate): the pledge is a skill-contract
 * declaration, never a threat or an inducement. No copy here may reference
 * losing money, punishment, or another person's behavior.
 */

/**
 * Phase-1 scope lock: RECOVERY_NOCONTACT is the only exposed oath category, so
 * it is the only journey with declared archetypes. Adding a category means
 * adding its own archetype set, not reusing this one.
 */
export const IDENTITY_OATH_CATEGORIES = ["RECOVERY_NOCONTACT"] as const;

export type IdentityOathCategory = (typeof IDENTITY_OATH_CATEGORIES)[number];

/**
 * Activation copy variants. The two framings say the same thing — one declares
 * it, one asks it back — so the assignment can be split for copy testing
 * without either arm making a different promise.
 */
export const IDENTITY_COPY_VARIANTS = ["DECLARATIVE", "REFLECTIVE"] as const;

export type IdentityCopyVariant = (typeof IDENTITY_COPY_VARIANTS)[number];

export interface IdentityArchetype {
  /** Stable key persisted against the oath; never re-used for different copy. */
  id: string;
  /** Human label stored as `identity_label` and shown on contract surfaces. */
  label: string;
  /** Completes "I am becoming ..." — always lowercase, no trailing period. */
  becoming: string;
  /** One-line explanation shown next to the label during selection. */
  description: string;
}

export const IDENTITY_ARCHETYPES: readonly IdentityArchetype[] = [
  {
    id: "BOUNDARY_KEEPER",
    label: "The Boundary Keeper",
    becoming: "someone who keeps the distance they chose",
    description:
      "You decided where the line is. Holding it stops being a nightly decision and starts being a fact about you.",
  },
  {
    id: "STEADY_ONE",
    label: "The Steady One",
    becoming: "someone who feels the urge and stays steady",
    description:
      "The urge still arrives. What changes is that it passes through you instead of moving your hands.",
  },
  {
    id: "REBUILDER",
    label: "The Rebuilder",
    becoming: "someone who is building the next chapter instead of re-reading the last one",
    description:
      "Your attention goes into the life in front of you, and the days accumulate into something of your own.",
  },
  {
    id: "OWN_WITNESS",
    label: "Their Own Witness",
    becoming: "someone who answers to themselves first",
    description:
      "You log the day because you were there for it — the record is yours before it is anyone else's.",
  },
];

export function getIdentityArchetype(
  archetypeId: string,
): IdentityArchetype | null {
  return (
    IDENTITY_ARCHETYPES.find((archetype) => archetype.id === archetypeId) ?? null
  );
}

export function isIdentityOathCategory(
  category: string,
): category is IdentityOathCategory {
  return (IDENTITY_OATH_CATEGORIES as readonly string[]).includes(category);
}

/**
 * FNV-1a over the user/archetype pair. The assignment must be reproducible from
 * the identifiers alone: the wizard renders the pledge before the row exists,
 * the API re-derives it when persisting, and a resumed session must land on the
 * same arm — a stored random draw would make the first two disagree.
 */
function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function assignCopyVariant(
  userId: string,
  archetypeId: string,
): IdentityCopyVariant {
  const bucket = fnv1a32(`${userId}:${archetypeId}`) % IDENTITY_COPY_VARIANTS.length;
  return IDENTITY_COPY_VARIANTS[bucket];
}

export function buildPledgeCopy(
  archetype: IdentityArchetype,
  variant: IdentityCopyVariant,
): string {
  if (variant === "REFLECTIVE") {
    return `Who am I becoming? ${capitalize(archetype.becoming)}. Every day of no contact I log is the evidence.`;
  }
  return `I am becoming ${archetype.becoming}. Every day of no contact I log is the evidence.`;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

/**
 * The full declaration for a user/archetype pair: the archetype, the variant it
 * deterministically maps to, and the exact pledge sentence to store and show.
 */
export interface IdentityOathDeclaration {
  archetypeId: string;
  identityLabel: string;
  copyVariant: IdentityCopyVariant;
  pledgeCopy: string;
}

export function composeIdentityOath(
  userId: string,
  archetype: IdentityArchetype,
): IdentityOathDeclaration {
  const copyVariant = assignCopyVariant(userId, archetype.id);
  return {
    archetypeId: archetype.id,
    identityLabel: archetype.label,
    copyVariant,
    pledgeCopy: buildPledgeCopy(archetype, copyVariant),
  };
}
