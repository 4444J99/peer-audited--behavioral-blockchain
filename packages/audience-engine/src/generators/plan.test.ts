import { describe, it, expect } from "vitest";
import { generatePlan, parseDateNoTimezoneDrift } from "./plan.js";
import { renderMarkdown } from "./markdown.js";
import type { InstanceConfig } from "../types/index.js";

/** Minimal valid config for testing. */
const testConfig: InstanceConfig = {
  systemName: "test-system",
  parameters: {
    p1Host: {
      archetype: "personal_creator",
      statement: "Test host",
    },
    p2Wedge: {
      statement: "Test wedge",
    },
    p3Product: {
      statement: "Test product",
      kind: "app",
      conversionCta: "Test CTA",
    },
    p4OwnedAsset: {
      statement: "Test asset",
      kind: "email_list",
    },
    p5ProofLoop: {
      statement: "Test proof",
      cadence: "weekly",
      format: "card",
    },
  },
  channels: {
    host: {
      role: "host",
      name: "Test Host Channel",
      voice: "Test voice",
      does: ["Test does"],
      doesNot: ["Test does not"],
      ratio: {
        value: 60,
        trust: 25,
        proof: 0,
        conversion: 15,
      },
      cadence: {
        shortForm: 3,
        longForm: 1,
        story: 1,
        conversion: 1,
        conversationPrompts: 1,
      },
    },
    product: {
      role: "product",
      name: "Test Product Channel",
      voice: "Test product voice",
      does: ["Test product does"],
      doesNot: ["Test product does not"],
      ratio: {
        value: 40,
        trust: 25,
        proof: 20,
        conversion: 15,
      },
      cadence: {
        shortForm: 1,
        longForm: 0,
        story: 0,
        conversion: 1,
        proofPosts: 1,
        scopeExplainers: 1,
      },
    },
  },
  ladder: {
    admissionRule: "Test",
    cohortSize: 20,
    weeklyRitual: "Test ritual",
    sourceMix: { own: 50, partner: 30, intermediary: 20 },
  },
  attack: {
    l1DemandCapture: { phrases: ["test phrase"], capturePageRoute: "/test" },
    l2BorrowedAudience: { targets: ["test target"], voice: "consumer_creator" },
    l3Intermediaries: { hook: "Test hook", referralAsset: "Test asset" },
    l4CommunityLoop: { shareCardMoment: "Test", referralMechanic: "Test" },
    l5Authority: { cornerstoneEssays: ["Test essay"] },
    doNotSayYet: ["Test"],
  },
  audienceAsProduct: {
    rungs: [{ name: "free" }, { name: "email" }],
    coexistenceRule: "Test",
  },
  kpis: [{ name: "Test KPI", weeklyTarget: 100, unit: "followers" }],
  healthBands: { green: "G", yellow: "Y", red: "R" },
  guardrails: {
    inheritedFrom: "Test",
    nicheRule: "Test rule",
  },
};

describe("generatePlan", () => {
  it("generates 5 weekly buckets covering 30 days", () => {
    const plan = generatePlan(
      testConfig,
      parseDateNoTimezoneDrift("2026-06-15"),
    );
    expect(plan.weeks).toHaveLength(5);
  });

  it("starts on a Monday (when given a Monday)", () => {
    // 2026-06-15 is a Monday — pass as a date-only string to avoid
    // UTC parsing drift.
    const plan = generatePlan(
      testConfig,
      parseDateNoTimezoneDrift("2026-06-15"),
    );
    expect(plan.startDate).toBe("2026-06-15");
  });

  it("produces 30 calendar days (start → start+29)", () => {
    const plan = generatePlan(
      testConfig,
      parseDateNoTimezoneDrift("2026-06-15"),
    );
    // The plan covers startDate → endDate inclusive = 30 calendar days.
    const start = parseDateNoTimezoneDrift(plan.startDate);
    const end = parseDateNoTimezoneDrift(plan.endDate);
    const diff = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diff).toBe(29);
  });

  it("endDate is start + 29 days", () => {
    const plan = generatePlan(
      testConfig,
      parseDateNoTimezoneDrift("2026-06-15"),
    );
    expect(plan.endDate).toBe("2026-07-14");
  });

  it("places every requested cadence slot across all 5 buckets", () => {
    // Per cadence: 3+1+1+1+1 (host) + 1+1+1+1+1 (product) = 11 slots/bucket.
    // 5 buckets × 11 = 55 placed slots. None dropped.
    const plan = generatePlan(
      testConfig,
      parseDateNoTimezoneDrift("2026-06-15"),
    );
    const totalPlaced = plan.weeks.reduce((n, w) => n + w.days.length, 0);
    expect(totalPlaced).toBe(11 * 5);
  });

  it("derives pillars from channel ratios", () => {
    const plan = generatePlan(testConfig, new Date("2026-06-15"));
    expect(plan.pillars.length).toBeGreaterThan(0);
    const totalHostRatio = plan.pillars
      .filter((p) => p.channel === "host")
      .reduce((sum, p) => sum + p.ratio, 0);
    const totalProductRatio = plan.pillars
      .filter((p) => p.channel === "product")
      .reduce((sum, p) => sum + p.ratio, 0);
    expect(totalHostRatio).toBe(100);
    expect(totalProductRatio).toBe(100);
  });
});

describe("renderMarkdown", () => {
  it("includes the system name in the title", () => {
    const plan = generatePlan(testConfig, new Date("2026-06-15"));
    const md = renderMarkdown(plan);
    expect(md).toContain("# test-system — 30-Day Content Calendar");
  });

  it("includes the pillars table", () => {
    const plan = generatePlan(testConfig, new Date("2026-06-15"));
    const md = renderMarkdown(plan);
    expect(md).toContain("## Pillars");
    expect(md).toContain("| # | Pillar | Channel | Ratio | Goal |");
  });

  it("includes production notes", () => {
    const plan = generatePlan(testConfig, new Date("2026-06-15"));
    const md = renderMarkdown(plan);
    expect(md).toContain("## Production notes");
    expect(md).toContain("engine-generated");
  });
});

describe("cadence honored", () => {
  it("emits exactly the cadence counts the user requested", () => {
    const plan = generatePlan(
      testConfig,
      parseDateNoTimezoneDrift("2026-06-15"),
    );
    // Sum the format types across all 5 buckets.
    const counts: Record<string, number> = {};
    for (const week of plan.weeks) {
      for (const day of week.days) {
        counts[day.format] = (counts[day.format] ?? 0) + 1;
      }
    }
    // Per cadence: host shortForm=3, longForm=1, story=1, conversion=1,
    // conversation_prompts=1, product shortForm=1, proof=1, scope=1,
    // conversion=1. Multiply by 5 buckets.
    expect(counts.short_form).toBe((3 + 1) * 5);
    expect(counts.long_form).toBe(1 * 5);
    expect(counts.story).toBe(1 * 5);
    expect(counts.conversion).toBe((1 + 1) * 5);
    expect(counts.conversation_prompt).toBe(1 * 5);
    expect(counts.proof).toBe(1 * 5);
    expect(counts.scope).toBe(1 * 5);
  });

  it("does not drop slots even when cadence > 14/week", () => {
    // Build a config with 21 slots/week to verify the walker places all of them.
    const highCadence: InstanceConfig = {
      ...testConfig,
      channels: {
        ...testConfig.channels,
        host: {
          ...testConfig.channels.host,
          cadence: {
            shortForm: 10,
            longForm: 5,
            story: 0,
            conversion: 2,
            conversationPrompts: 0,
          },
        },
        product: {
          ...testConfig.channels.product,
          cadence: {
            shortForm: 2,
            longForm: 0,
            story: 0,
            conversion: 2,
            proofPosts: 0,
            scopeExplainers: 0,
          },
        },
      },
    };
    const plan = generatePlan(
      highCadence,
      parseDateNoTimezoneDrift("2026-06-15"),
    );
    // 21 slots per bucket × 5 buckets = 105 total slots.
    const total = plan.weeks.reduce((n, w) => n + w.days.length, 0);
    expect(total).toBe(21 * 5);
  });
});

describe("pillar numbers are globally unique", () => {
  it("host and product pillars do not share indices", () => {
    const plan = generatePlan(testConfig, new Date("2026-06-15"));
    const hostPillars = plan.pillars.filter((p) => p.channel === "host");
    const productPillars = plan.pillars.filter((p) => p.channel === "product");
    const hostIndices = new Set(hostPillars.map((p) => p.index));
    const productIndices = new Set(productPillars.map((p) => p.index));
    // No overlap.
    for (const idx of productIndices) {
      expect(hostIndices.has(idx)).toBe(false);
    }
    // Product pillars come after host pillars.
    if (hostPillars.length > 0 && productPillars.length > 0) {
      const maxHostIdx = Math.max(...hostPillars.map((p) => p.index));
      const minProductIdx = Math.min(...productPillars.map((p) => p.index));
      expect(minProductIdx).toBeGreaterThan(maxHostIdx);
    }
  });
});

describe("date parsing", () => {
  it("parses date-only strings in local time, not UTC", () => {
    // 2026-06-15 is a Monday. If parsed as UTC midnight, west-of-UTC
    // users get a Sun. With local-time parsing, it should always be Mon.
    const d = parseDateNoTimezoneDrift("2026-06-15");
    // getDay(): 0=Sun, 1=Mon
    expect(d.getDay()).toBe(1);
  });
});
