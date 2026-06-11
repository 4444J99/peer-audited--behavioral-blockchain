#!/usr/bin/env node
/**
 * @styx/styx-cli — Operational wrapper for the Audience Growth Engine.
 *
 * Two commands:
 *   styx plan-week [--start <iso>] [--output <md>]
 *       Run the engine with Styx defaults (templates/styx-instance.yaml),
 *       write the 30-day plan to <md> (default: outbox/styx/<week>.md).
 *
 *   styx log-week --week <YYYY-WNN> --followers <N> --email <N> [--opens <%>] [--waitlist <N>]
 *       Append a row to the weekly metrics log.
 *
 * The CLI is the friendly face of the engine. Jessica (or any operator)
 * can run it without reading the playbook.
 */

import { writeFile, mkdir, readFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import {
  loadConfig,
  generatePlan,
  renderMarkdown,
  parseDateNoTimezoneDrift,
} from "@styx/audience-engine";
import { isoWeekString } from "./iso-week.js";

function printUsage(): void {
  console.log(`@styx/styx-cli — Operational wrapper for the Audience Growth Engine

Usage:
  styx plan-week [--start <iso>] [--output <md>]
  styx log-week --week <YYYY-WNN> --followers <N> --email <N> [--opens <%>] [--waitlist <N>]

Commands:
  plan-week   Generate the 30-day content plan for Styx/Jessica
  log-week    Append a row to the weekly metrics log

Options:
  --start     Start date in ISO format (default: next Monday)
  --output    Output path (default: outbox/styx/<week>.md)
  --week      ISO week (e.g. 2026-W24) for log-week
  --followers Follower count (net) for log-week
  --email     Email subscriber count (net) for log-week
  --opens     Brief open rate (%), optional
  --waitlist  Qualified waitlist count, optional
  --help      Show this help
`);
}

function findDefaultConfig(): string {
  const pkgRequire = createRequire(
    require.resolve("@styx/audience-engine/package.json"),
  );
  try {
    return pkgRequire.resolve("@styx/audience-engine/templates/styx-instance.yaml");
  } catch {
    throw new Error(
      "Could not find templates/styx-instance.yaml in @styx/audience-engine. Pass --config <path>.",
    );
  }
}

interface PlanWeekArgs {
  start?: string;
  output?: string;
  config?: string;
}

async function cmdPlanWeek(args: PlanWeekArgs): Promise<number> {
  const configPath = args.config ?? findDefaultConfig();
  let config;
  try {
    config = await loadConfig(configPath);
  } catch (err) {
    console.error(
      `✗ Config invalid: ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }
  const startDate = args.start
    ? parseDateNoTimezoneDrift(args.start)
    : undefined;
  if (startDate && Number.isNaN(startDate.getTime())) {
    console.error(`✗ Invalid start date: ${args.start}`);
    return 1;
  }
  const plan = generatePlan(config, startDate);
  const markdown = renderMarkdown(plan);
  const week = isoWeekString(plan.startDate);
  const outPath = resolve(args.output ?? `outbox/styx/${week}.md`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, markdown, "utf-8");
  const placed = plan.weeks.reduce((n, w) => n + w.days.length, 0);
  console.error(
    `✓ Wrote 30-day Styx plan to ${outPath} (${plan.weeks.length} buckets, ${placed} placed slots)`,
  );
  console.error(`  Window: ${plan.startDate} → ${plan.endDate}`);
  return 0;
}

interface LogWeekArgs {
  week: string;
  followers: number;
  email: number;
  opens?: number;
  waitlist?: number;
  metricsFile?: string;
}

async function cmdLogWeek(args: LogWeekArgs): Promise<number> {
  const file = resolve(
    args.metricsFile ??
      process.env.STYX_METRICS_FILE ??
      "outbox/styx/metrics.csv",
  );
  await mkdir(dirname(file), { recursive: true });
  const row = [
    args.week,
    String(args.followers),
    String(args.email),
    args.opens !== undefined ? String(args.opens) : "",
    args.waitlist !== undefined ? String(args.waitlist) : "",
  ].join(",");
  const exists = existsSync(file);
  if (!exists) {
    const header = "week,followers_net,email_net,opens_pct,waitlist\n";
    await writeFile(file, header + row + "\n", "utf-8");
  } else {
    await appendFile(file, row + "\n", "utf-8");
  }
  console.error(`✓ Appended ${args.week} to ${file}`);
  return 0;
}

function parseArgs(argv: string[]): {
  command: string;
  args: Record<string, string>;
} {
  const [, , command, ...rest] = argv;
  const args: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = rest[i + 1];
      if (value && !value.startsWith("--")) {
        args[key] = value;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return { command: command ?? "help", args };
}

async function main(): Promise<number> {
  const { command, args } = parseArgs(process.argv);
  if (command === "help" || args.help === "true") {
    printUsage();
    return 0;
  }
  if (command === "plan-week") {
    return cmdPlanWeek(args as unknown as PlanWeekArgs);
  }
  if (command === "log-week") {
    if (!args.week || !args.followers || !args.email) {
      console.error("Error: log-week requires --week, --followers, --email");
      printUsage();
      return 2;
    }
    const followers = Number(args.followers);
    const email = Number(args.email);
    const opens = args.opens !== undefined ? Number(args.opens) : undefined;
    const waitlist = args.waitlist !== undefined ? Number(args.waitlist) : undefined;
    if (!Number.isFinite(followers) || !Number.isFinite(email)) {
      console.error(`✗ Invalid metric value: --followers and --email must be numbers`);
      return 2;
    }
    if (opens !== undefined && !Number.isFinite(opens)) {
      console.error(`✗ Invalid --opens value: must be a number`);
      return 2;
    }
    if (waitlist !== undefined && !Number.isFinite(waitlist)) {
      console.error(`✗ Invalid --waitlist value: must be a number`);
      return 2;
    }
    return cmdLogWeek({
      week: args.week,
      followers,
      email,
      opens,
      waitlist,
      metricsFile: args["metrics-file"],
    });
  }
  console.error(`Unknown command: ${command}`);
  printUsage();
  return 2;
}

main().then((code) => process.exit(code));
