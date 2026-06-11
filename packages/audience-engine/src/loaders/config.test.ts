import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

const BASE_VALID_CONFIG = `
systemName: test
parameters:
  p1Host:
    archetype: personal_creator
    statement: "Test host"
  p2Wedge:
    statement: "Test wedge"
  p3Product:
    statement: "Test product"
    kind: app
    conversionCta: "Test CTA"
  p4OwnedAsset:
    statement: "Test asset"
    kind: email_list
  p5ProofLoop:
    statement: "Test proof"
    cadence: weekly
    format: card
channels:
  host:
    role: host
    name: "H"
    voice: "V"
    does: []
    doesNot: []
    ratio: {value: 60, trust: 25, proof: 0, conversion: 15}
    cadence: {shortForm: 3, longForm: 1, story: 1, conversion: 1, conversationPrompts: 1}
  product:
    role: product
    name: "P"
    voice: "V"
    does: []
    doesNot: []
    ratio: {value: 40, trust: 25, proof: 20, conversion: 15}
    cadence: {shortForm: 1, longForm: 0, story: 0, conversion: 1, proofPosts: 1, scopeExplainers: 1}
ladder:
  admissionRule: "x"
  cohortSize: 20
  weeklyRitual: "x"
  sourceMix: {own: 50, partner: 30, intermediary: 20}
attack:
  l1DemandCapture: {phrases: ["x"], capturePageRoute: "/x"}
  l2BorrowedAudience: {targets: ["x"], voice: consumer_creator}
  l3Intermediaries: {hook: "x", referralAsset: "x"}
  l4CommunityLoop: {shareCardMoment: "x", referralMechanic: "x"}
  l5Authority: {cornerstoneEssays: ["x"]}
  doNotSayYet: ["x"]
audienceAsProduct:
  rungs: [{name: "x"}]
  coexistenceRule: "x"
kpis: [{name: "x", weeklyTarget: 1, unit: "x"}]
healthBands: {green: "G", yellow: "Y", red: "R"}
guardrails: {inheritedFrom: "x", nicheRule: "x"}
`;

async function loadFromString(yaml: string): Promise<void> {
  const tmpPath = `/tmp/test-config-${Date.now()}-${Math.random()}.yaml`;
  await (await import("node:fs/promises")).writeFile(tmpPath, yaml, "utf-8");
  try {
    await loadConfig(tmpPath);
  } finally {
    await (await import("node:fs/promises")).unlink(tmpPath);
  }
}

describe("loadConfig", () => {
  it("accepts a valid config", async () => {
    await expect(loadFromString(BASE_VALID_CONFIG)).resolves.toBeUndefined();
  });

  it("rejects missing p1Host.statement", async () => {
    const broken = BASE_VALID_CONFIG.replace(
      /p1Host:\n    archetype:.*\n    statement:.*\n/,
      "p1Host:\n    archetype: personal_creator\n",
    );
    await expect(loadFromString(broken)).rejects.toThrow(
      /p1Host\.statement is required/,
    );
  });

  it("rejects invalid archetype", async () => {
    const broken = BASE_VALID_CONFIG.replace(
      "archetype: personal_creator",
      "archetype: wizard",
    );
    await expect(loadFromString(broken)).rejects.toThrow(
      /archetype must be one of/,
    );
  });

  it("rejects missing p2Wedge.statement", async () => {
    const broken = BASE_VALID_CONFIG.replace(
      /p2Wedge:\n    statement:.*\n/,
      "p2Wedge: {}\n",
    );
    await expect(loadFromString(broken)).rejects.toThrow(
      /p2Wedge\.statement is required/,
    );
  });

  it("rejects missing p3Product.conversionCta", async () => {
    const broken = BASE_VALID_CONFIG.replace(
      'conversionCta: "Test CTA"',
      "conversionCta: ''",
    );
    await expect(loadFromString(broken)).rejects.toThrow(
      /p3Product\.conversionCta is required/,
    );
  });

  it("rejects invalid proofLoop cadence", async () => {
    const broken = BASE_VALID_CONFIG.replace(
      "cadence: weekly",
      "cadence: hourly",
    );
    await expect(loadFromString(broken)).rejects.toThrow(
      /p5ProofLoop\.cadence must be one of/,
    );
  });

  it("rejects missing channels.host.cadence", async () => {
    const broken = BASE_VALID_CONFIG.replace(
      /    cadence: \{shortForm: 3.*\n/,
      "",
    );
    await expect(loadFromString(broken)).rejects.toThrow(
      /channels\.host\.cadence is required/,
    );
  });

  it("rejects missing channels.product.ratio.proof", async () => {
    const broken = BASE_VALID_CONFIG.replace(/proof: 20,/, "");
    await expect(loadFromString(broken)).rejects.toThrow(
      /channels\.product\.ratio\.proof must be a number/,
    );
  });
});
