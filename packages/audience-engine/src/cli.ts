#!/usr/bin/env node
/**
 * @styx/audience-engine CLI.
 *
 * Usage:
 *   audience-engine plan --config <yaml> --output <md> [--start <iso>]
 *   audience-engine validate --config <yaml>
 *
 * Commands:
 *   plan       Generate a 30-day content plan from a config
 *   validate   Validate a config without generating
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "./loaders/config.js";
import { generatePlan, parseDateNoTimezoneDrift } from "./generators/plan.js";
import { renderMarkdown } from "./generators/markdown.js";

function printUsage(): void {
  console.log(`@styx/audience-engine — Portable Audience Growth Engine CLI

Usage:
  audience-engine plan --config <yaml> [--output <md>] [--start <iso>]
  audience-engine validate --config <yaml>

Commands:
  plan        Generate a 30-day content plan from a config
  validate    Validate a config without generating

Options:
  --config    Path to the InstanceConfig YAML file (required)
  --output    Path to the output markdown file (default: stdout)
  --start     Start date in ISO format (default: next Monday)
  --help      Show this help
`);
}

interface PlanArgs {
  config: string;
  output?: string;
  start?: string;
}

interface ValidateArgs {
  config: string;
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

async function cmdPlan(args: PlanArgs): Promise<number> {
  const configPath = resolve(args.config);
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
  if (args.start && Number.isNaN(startDate!.getTime())) {
    console.error(`Invalid --start date: ${args.start}`);
    return 2;
  }
  const plan = generatePlan(config, startDate);
  const markdown = renderMarkdown(plan);
  if (args.output) {
    const outPath = resolve(args.output);
    await writeFile(outPath, markdown, "utf-8");
    console.error(
      `✓ Wrote 30-day plan to ${outPath} (${plan.weeks.length} buckets, ${plan.weeks.reduce((n, w) => n + w.days.length, 0)} placed slots)`,
    );
  } else {
    console.log(markdown);
  }
  return 0;
}

async function cmdValidate(args: ValidateArgs): Promise<number> {
  const configPath = resolve(args.config);
  try {
    const config = await loadConfig(configPath);
    console.log(
      `✓ Config valid: ${config.systemName} (Host: ${config.parameters.p1Host.archetype}, Wedge: ${config.parameters.p2Wedge.statement.slice(0, 50)}...)`,
    );
    return 0;
  } catch (err) {
    console.error(
      `✗ Config invalid: ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }
}

async function main(): Promise<number> {
  const { command, args } = parseArgs(process.argv);
  if (command === "help" || args.help === "true") {
    printUsage();
    return 0;
  }
  if (command === "plan") {
    if (!args.config) {
      console.error("Error: --config is required");
      printUsage();
      return 2;
    }
    return cmdPlan(args as unknown as PlanArgs);
  }
  if (command === "validate") {
    if (!args.config) {
      console.error("Error: --config is required");
      printUsage();
      return 2;
    }
    return cmdValidate(args as unknown as ValidateArgs);
  }
  console.error(`Unknown command: ${command}`);
  printUsage();
  return 2;
}

main().then((code) => process.exit(code));
