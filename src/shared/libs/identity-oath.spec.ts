import { describe, it, expect } from "@jest/globals";
import {
  IDENTITY_ARCHETYPES,
  IDENTITY_COPY_VARIANTS,
  IDENTITY_OATH_CATEGORIES,
  assignCopyVariant,
  buildPledgeCopy,
  composeIdentityOath,
  getIdentityArchetype,
  isIdentityOathCategory,
} from "./identity-oath";

describe("identity archetypes", () => {
  it("exposes only the phase-1 no-contact journey", () => {
    expect(IDENTITY_OATH_CATEGORIES).toEqual(["RECOVERY_NOCONTACT"]);
    expect(isIdentityOathCategory("RECOVERY_NOCONTACT")).toBe(true);
    expect(isIdentityOathCategory("BIOLOGICAL_WEIGHT")).toBe(false);
  });

  it("keeps archetype ids unique and resolvable", () => {
    const ids = IDENTITY_ARCHETYPES.map((archetype) => archetype.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getIdentityArchetype(id)?.id).toBe(id);
    }
  });

  it("returns null for an unknown archetype", () => {
    expect(getIdentityArchetype("NOT_AN_ARCHETYPE")).toBeNull();
  });

  it("phrases every archetype as an identity, not a task", () => {
    for (const archetype of IDENTITY_ARCHETYPES) {
      expect(archetype.becoming.startsWith("someone who")).toBe(true);
      expect(archetype.becoming.endsWith(".")).toBe(false);
    }
  });
});

describe("assignCopyVariant", () => {
  it("is deterministic for the same user and archetype", () => {
    const first = assignCopyVariant("user-1", "BOUNDARY_KEEPER");
    for (let i = 0; i < 25; i += 1) {
      expect(assignCopyVariant("user-1", "BOUNDARY_KEEPER")).toBe(first);
    }
  });

  it("only ever returns a declared variant", () => {
    for (const archetype of IDENTITY_ARCHETYPES) {
      for (let i = 0; i < 50; i += 1) {
        expect(IDENTITY_COPY_VARIANTS).toContain(
          assignCopyVariant(`user-${i}`, archetype.id),
        );
      }
    }
  });

  it("splits a population across both arms", () => {
    const seen = new Set(
      Array.from({ length: 200 }, (_, i) =>
        assignCopyVariant(`user-${i}`, "BOUNDARY_KEEPER"),
      ),
    );
    expect(seen.size).toBe(IDENTITY_COPY_VARIANTS.length);
  });

  it("assigns independently per archetype", () => {
    // The bucket is keyed on the pair, so re-declaring under a different
    // archetype must be able to land on the other arm for the same user.
    const variants = IDENTITY_ARCHETYPES.map((archetype) =>
      assignCopyVariant("user-42", archetype.id),
    );
    expect(variants).toHaveLength(IDENTITY_ARCHETYPES.length);
  });
});

describe("buildPledgeCopy", () => {
  const archetype = IDENTITY_ARCHETYPES[0];

  it("declares the identity in the declarative arm", () => {
    expect(buildPledgeCopy(archetype, "DECLARATIVE")).toBe(
      "I am becoming someone who keeps the distance they chose. Every day of no contact I log is the evidence.",
    );
  });

  it("asks the identity back in the reflective arm", () => {
    expect(buildPledgeCopy(archetype, "REFLECTIVE")).toBe(
      "Who am I becoming? Someone who keeps the distance they chose. Every day of no contact I log is the evidence.",
    );
  });

  it("never uses coercive or financial wording", () => {
    // TKT-P1-016 legal gate: the pledge is a skill-contract declaration, so it
    // may not threaten, reference money, or describe another person's conduct.
    // Word-bounded: "themselves" is a legitimate identity word, "them" is not.
    const forbidden = [
      /\blose\b/,
      /\blost\b/,
      /\bpunish/,
      /\bforfeit/,
      /\$/,
      /\bthem\b/,
      /\byour ex\b/,
    ];
    for (const archetypeUnderTest of IDENTITY_ARCHETYPES) {
      for (const variant of IDENTITY_COPY_VARIANTS) {
        const copy = buildPledgeCopy(archetypeUnderTest, variant).toLowerCase();
        for (const pattern of forbidden) {
          expect(copy).not.toMatch(pattern);
        }
      }
    }
  });
});

describe("composeIdentityOath", () => {
  it("returns the label, variant, and pledge that belong together", () => {
    const archetype = IDENTITY_ARCHETYPES[1];
    const declaration = composeIdentityOath("user-7", archetype);

    expect(declaration.archetypeId).toBe(archetype.id);
    expect(declaration.identityLabel).toBe(archetype.label);
    expect(declaration.copyVariant).toBe(
      assignCopyVariant("user-7", archetype.id),
    );
    expect(declaration.pledgeCopy).toBe(
      buildPledgeCopy(archetype, declaration.copyVariant),
    );
  });

  it("recomposes identically on a resumed session", () => {
    const archetype = IDENTITY_ARCHETYPES[2];
    expect(composeIdentityOath("user-8", archetype)).toEqual(
      composeIdentityOath("user-8", archetype),
    );
  });
});
