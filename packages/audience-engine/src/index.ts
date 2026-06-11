/**
 * @styx/audience-engine — public API.
 *
 * Exported for programmatic use by other packages (notably
 * @styx/styx-cli, the Styx operational wrapper). The CLI itself is in
 * cli.ts.
 */

export { loadConfig } from "./loaders/config.js";
export { generatePlan } from "./generators/plan.js";
export { renderMarkdown } from "./generators/markdown.js";
export type {
  InstanceConfig,
  ContentPlan,
  PlannedDay,
  EngineParameters,
  Channel,
  ChannelRatio,
  Ladder,
  FiveLevelAttack,
  AudienceAsProduct,
  EngagementEconomics,
  KpiSet,
  HealthBands,
  Guardrails,
  HostArchetype,
  Wedge,
  Product,
  OwnedAsset,
  ProofLoop,
  WeeklyCadence,
} from "./types/index.js";
