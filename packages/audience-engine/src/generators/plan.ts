/**
 * 30-day content plan generator.
 *
 * Given an InstanceConfig, generates 4 weeks of content days honoring the
 * channel ratios, weekly cadence, and pillar definitions. The output is a
 * ContentPlan that can be written as Markdown or JSON.
 *
 * The generator is *deterministic* — same input, same output. This is so
 * that a plan can be regenerated, diffed, and reviewed.
 */

import type {
  InstanceConfig,
  ContentPlan,
  PlannedDay,
  Channel,
} from "../types/index.js";

/** ISO date helpers. */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayOfWeek(date: Date): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

/**
 * Parse an ISO date string (date-only or date-time) without timezone drift.
 * A date-only string like "2026-06-15" must be interpreted in *local* time,
 * not UTC. Otherwise users west of UTC get a calendar where the first day
 * of a week is labeled Sun instead of Mon.
 */
function parseDateNoTimezoneDrift(input: string): Date {
  // Date-only: "YYYY-MM-DD" — parse as local midnight.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/;
  const m = dateOnly.exec(input);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d));
  }
  // Date-time: use as-is.
  return new Date(input);
}

/** Derive the pillar list from a channel's ratio. Pillars use a *shared* global
 *  counter so host pillars are 1..N and product pillars are N+1..M. This
 *  matches the existing planning docs (which use a single global pillar
 *  namespace) and avoids the bug where a host trust pillar and a product
 *  scope pillar both render as "pillar 2". */
function derivePillars(
  channel: Channel,
  role: "host" | "product",
  startIndex: number,
): { pillars: ContentPlan["pillars"]; nextIndex: number } {
  const pillars: ContentPlan["pillars"] = [];
  let idx = startIndex;

  if (channel.ratio.value > 0) {
    pillars.push({
      index: idx++,
      name:
        role === "host"
          ? "Niche value (raw, named, evidence-led)"
          : "Product clarity (what it is / isn't)",
      channel: role,
      ratio: channel.ratio.value,
      goal: role === "host" ? "discovery + trust" : "credible destination",
    });
  }
  if (channel.ratio.trust > 0) {
    pillars.push({
      index: idx++,
      name:
        role === "host"
          ? "Lived insight / founder POV"
          : "Trust / scope / safety",
      channel: role,
      ratio: channel.ratio.trust,
      goal: role === "host" ? "authenticity, depth" : "de-risk the decision",
    });
  }
  if (channel.ratio.proof > 0 && role === "product") {
    pillars.push({
      index: idx++,
      name: "Proof (user / output / citation)",
      channel: "product",
      ratio: channel.ratio.proof,
      goal: "social proof + apply",
    });
  }
  if (channel.ratio.conversion > 0) {
    pillars.push({
      index: idx++,
      name: "Selective conversion",
      channel: role,
      ratio: channel.ratio.conversion,
      goal: "funnel into Product",
    });
  }
  return { pillars, nextIndex: idx };
}

/** Generate the pillar-slot week. Each week honors the channel's ratio. */
function generateWeek(
  weekNumber: number,
  startDate: Date,
  config: InstanceConfig,
  themeByWeek: string[],
): PlannedDay[] {
  const days: PlannedDay[] = [];
  const hostChannel = config.channels.host;
  const productChannel = config.channels.product;
  const theme = themeByWeek[weekNumber - 1] ?? `Week ${weekNumber}`;

  // We allocate days across the 7 days of the week, splitting between
  // host and product per the cadence. The generator is *deterministic*:
  // for a given week, the allocation is the same.

  // Build a "slot list" of (day, channel, format) tuples that honors
  // the weekly cadence.
  const slots: Array<{
    channel: "host" | "product";
    format: string;
  }> = [];

  // Host channel slots
  for (let i = 0; i < hostChannel.cadence.shortForm; i++) {
    slots.push({ channel: "host", format: "short_form" });
  }
  for (let i = 0; i < hostChannel.cadence.longForm; i++) {
    slots.push({ channel: "host", format: "long_form" });
  }
  for (let i = 0; i < hostChannel.cadence.story; i++) {
    slots.push({ channel: "host", format: "story" });
  }
  for (let i = 0; i < hostChannel.cadence.conversion; i++) {
    slots.push({ channel: "host", format: "conversion" });
  }
  for (let i = 0; i < (hostChannel.cadence.conversationPrompts ?? 0); i++) {
    slots.push({ channel: "host", format: "conversation_prompt" });
  }

  // Product channel slots
  for (let i = 0; i < productChannel.cadence.shortForm; i++) {
    slots.push({ channel: "product", format: "short_form" });
  }
  for (let i = 0; i < productChannel.cadence.longForm; i++) {
    slots.push({ channel: "product", format: "long_form" });
  }
  for (let i = 0; i < productChannel.cadence.story; i++) {
    slots.push({ channel: "product", format: "story" });
  }
  for (let i = 0; i < (productChannel.cadence.proofPosts ?? 0); i++) {
    slots.push({ channel: "product", format: "proof" });
  }
  for (let i = 0; i < (productChannel.cadence.scopeExplainers ?? 0); i++) {
    slots.push({ channel: "product", format: "scope" });
  }
  for (let i = 0; i < productChannel.cadence.conversion; i++) {
    slots.push({ channel: "product", format: "conversion" });
  }

  // Distribute the slots across the 7 days of the week using a deterministic
  // round-robin walker. The number of slots per day is computed from the
  // total cadence (so a 21-slot week allocates 3/day, a 14-slot week
  // allocates 2/day, a 4-slot week allocates 1/day on the first 4 days).
  // This ensures *every* requested slot is placed — we never drop slots.
  const totalSlots = slots.length;
  const slotsPerDay =
    totalSlots === 0 ? 0 : Math.max(1, Math.ceil(totalSlots / 7));
  let slotIdx = 0;
  for (let day = 0; day < 7; day++) {
    if (slotIdx >= totalSlots) break;
    const date = addDays(startDate, day);
    const dow = getDayOfWeek(date);
    for (let i = 0; i < slotsPerDay && slotIdx < totalSlots; i++) {
      const s = slots[slotIdx++];
      const pillar = pickPillar(config, s.channel, s.format);
      const cta = s.format === "conversion" ? pickCta(config, s.channel) : null;
      const hook = `${theme} — ${s.format} on ${dow}`;
      days.push({
        date: formatDate(date),
        dayOfWeek: dow,
        channel: s.channel,
        format: s.format,
        hook,
        pillar,
        cta,
      });
    }
  }

  return days;
}

/** Pick a pillar index for a (channel, format) combination.
 *  Pillars use the *global* namespace (host 1..N, product N+1..M) so
 *  the output matches the existing planning docs. The conversion pillar
 *  for a channel is the *last* pillar in that channel. */
function pickPillar(
  config: InstanceConfig,
  channel: "host" | "product",
  format: string,
): number {
  // Compute the global pillar index range for the channel.
  const hostPillars = countPillars(config.channels.host);
  const productPillars = countPillars(config.channels.product);
  const hostStart = 1;
  const productStart = hostStart + hostPillars;
  // The "last pillar in the channel" is the conversion pillar.
  const hostConversion = hostStart + hostPillars - 1;
  const productConversion = productStart + productPillars - 1;
  const hostTrust = hostStart + (config.channels.host.ratio.value > 0 ? 1 : 0);
  const productTrust =
    productStart + (config.channels.product.ratio.value > 0 ? 1 : 0);
  const hostValue = hostStart; // pillar 1 (always 1, since host pillars start at 1)
  const productValue = productStart;
  const productProof =
    productStart +
    (config.channels.product.ratio.value > 0 ? 1 : 0) +
    (config.channels.product.ratio.trust > 0 ? 1 : 0);

  if (format === "conversion") {
    return channel === "host" ? hostConversion : productConversion;
  }
  if (format === "long_form" || format === "story") {
    return channel === "host" ? hostTrust : productTrust;
  }
  if (format === "proof") {
    return productProof;
  }
  if (format === "scope") {
    return channel === "product" ? productTrust : hostValue;
  }
  if (format === "conversation_prompt") {
    return hostValue;
  }
  return channel === "host" ? hostValue : productValue; // short_form defaults to value pillar
}

/**
 * Count the pillars a channel has, given its ratio.
 *
 * The host channel does NOT have a proof pillar (per the engine's design —
 * proof content lives on the product channel). So a `channels.host.ratio.proof`
 * value is silently ignored at the pillar-count level. Without this fix,
 * `countPillars` would count a non-existent pillar, shifting `productStart`
 * and causing product rows to reference pillar numbers not in the table.
 */
function countPillars(channel: Channel): number {
  const isProduct = channel.role === "product";
  return (
    (channel.ratio.value > 0 ? 1 : 0) +
    (channel.ratio.trust > 0 ? 1 : 0) +
    (isProduct && channel.ratio.proof > 0 ? 1 : 0) +
    (channel.ratio.conversion > 0 ? 1 : 0)
  );
}

/** Pick a CTA from the channel's fixed CTA set. */
function pickCta(config: InstanceConfig, channel: "host" | "product"): string {
  // CTAs are stored in the channel cadence as a free string in the
  // conversion slot. For now we use the product's conversion CTA.
  return config.parameters.p3Product.conversionCta;
}

/** Generate the full 30-day content plan from an InstanceConfig. */
export function generatePlan(
  config: InstanceConfig,
  startDate: Date = findNextMonday(new Date()),
): ContentPlan {
  // Default themes per week, derived from the engine's three phases:
  // Ignition, First Room, Compounding. Week 4 is the Authority phase.
  const themes = [
    `Week 1 — Ignition: open the ${config.parameters.p1Host.statement.split(" ")[0]} channel`,
    `Week 2 — First signals: ${config.parameters.p2Wedge.statement.slice(0, 60)}`,
    `Week 3 — First room: admit the first ${config.ladder.cohortSize}`,
    `Week 4 — Authority: cornerstone essay + compounding proof`,
  ];

  const hostPillarsResult = derivePillars(config.channels.host, "host", 1);
  const productPillarsResult = derivePillars(
    config.channels.product,
    "product",
    hostPillarsResult.nextIndex,
  );
  const pillars = [
    ...hostPillarsResult.pillars,
    ...productPillarsResult.pillars,
  ];

  const weeks = [];
  // Build 5 buckets of ~6 days each so the calendar covers a full 30 days
  // (not 28). Week 5 is short (2 days) so the total is 6+6+6+6+6 = 30.
  // Alternatively: 4 weeks of 7 + 1 partial week of 2. The bucket layout
  // is a content choice; we use 5 weekly buckets here so the
  // "4-week content plan" framing in the playbook still fits.
  for (let w = 0; w < 5; w++) {
    const weekStart = addDays(startDate, w * 6);
    weeks.push({
      weekNumber: w + 1,
      theme: themes[Math.min(w, themes.length - 1)] + ` (part ${w + 1})`,
      days: generateWeek(w + 1, weekStart, config, themes),
    });
  }

  return {
    systemName: config.systemName,
    startDate: formatDate(startDate),
    endDate: formatDate(addDays(startDate, 29)),
    pillars,
    weeks,
  };
}

/** Export the date parser so the CLI can use it for --start. */
export { parseDateNoTimezoneDrift };

/** Find the next Monday from a given date. */
function findNextMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  return addDays(d, daysUntilMonday);
}
