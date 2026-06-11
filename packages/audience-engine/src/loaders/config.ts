/**
 * YAML config loader.
 *
 * Reads an InstanceConfig from a YAML file. The YAML is the *machine-
 * readable* form of the engine instantiation worksheet
 * (docs/playbooks/templates/template--instantiation-worksheet.md).
 */

import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import type { InstanceConfig } from "../types/index.js";

/** Load and validate an InstanceConfig from a YAML file. */
export async function loadConfig(configPath: string): Promise<InstanceConfig> {
  const content = await readFile(configPath, "utf-8");
  const raw = parseYaml(content);

  // Validate the top-level shape.
  validateConfig(raw);
  return raw as InstanceConfig;
}

/**
 * Validation: ensure all 5 parameters are present.
 * Walks the nested channel structure so `audience-engine validate`
 * catches a missing `cadence` or `ratio` *before* the planner dereferences
 * it and crashes mid-generation.
 */
function validateConfig(raw: unknown): asserts raw is InstanceConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Config root must be an object");
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj.systemName !== "string" || obj.systemName.length === 0) {
    throw new Error("Config.systemName is required");
  }
  if (typeof obj.parameters !== "object" || obj.parameters === null) {
    throw new Error("Config.parameters is required (the 5 engine parameters)");
  }
  const p = obj.parameters as Record<string, unknown>;
  for (const key of [
    "p1Host",
    "p2Wedge",
    "p3Product",
    "p4OwnedAsset",
    "p5ProofLoop",
  ]) {
    if (typeof p[key] !== "object" || p[key] === null) {
      throw new Error(`Config.parameters.${key} is required`);
    }
  }
  // Validate the nested fields of each parameter so a broken config is
  // caught at validate-time, not mid-generation. Without this, a config
  // that passes the top-level check would crash inside the planner
  // (e.g. themes[].slice(0, 60) on undefined wedge.statement).
  validateP1Host(p.p1Host as Record<string, unknown>);
  validateP2Wedge(p.p2Wedge as Record<string, unknown>);
  validateP3Product(p.p3Product as Record<string, unknown>);
  validateP4OwnedAsset(p.p4OwnedAsset as Record<string, unknown>);
  validateP5ProofLoop(p.p5ProofLoop as Record<string, unknown>);
  if (typeof obj.channels !== "object" || obj.channels === null) {
    throw new Error("Config.channels is required (host + product)");
  }
  const c = obj.channels as Record<string, unknown>;
  if (typeof c.host !== "object" || c.host === null) {
    throw new Error("Config.channels.host is required");
  }
  validateChannel(c.host, "host");
  if (typeof c.product !== "object" || c.product === null) {
    throw new Error("Config.channels.product is required");
  }
  validateChannel(c.product, "product");
  if (typeof obj.ladder !== "object" || obj.ladder === null) {
    throw new Error("Config.ladder is required");
  }
  if (typeof obj.attack !== "object" || obj.attack === null) {
    throw new Error("Config.attack is required (5-level attack)");
  }
  if (typeof obj.kpis !== "object" || obj.kpis === null) {
    throw new Error("Config.kpis is required");
  }
  if (!Array.isArray(obj.kpis)) {
    throw new Error("Config.kpis must be an array");
  }
}

/** Validate a single channel config. */
function validateChannel(raw: unknown, role: "host" | "product"): void {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Config.channels.${role} must be an object`);
  }
  const ch = raw as Record<string, unknown>;
  if (typeof ch.name !== "string") {
    throw new Error(`Config.channels.${role}.name is required`);
  }
  if (typeof ch.voice !== "string") {
    throw new Error(`Config.channels.${role}.voice is required`);
  }
  if (typeof ch.ratio !== "object" || ch.ratio === null) {
    throw new Error(`Config.channels.${role}.ratio is required`);
  }
  const ratio = ch.ratio as Record<string, unknown>;
  for (const key of ["value", "trust", "proof", "conversion"]) {
    if (typeof ratio[key] !== "number") {
      throw new Error(`Config.channels.${role}.ratio.${key} must be a number`);
    }
  }
  if (typeof ch.cadence !== "object" || ch.cadence === null) {
    throw new Error(`Config.channels.${role}.cadence is required`);
  }
  const cadence = ch.cadence as Record<string, unknown>;
  for (const key of ["shortForm", "longForm", "story", "conversion"]) {
    if (typeof cadence[key] !== "number") {
      throw new Error(
        `Config.channels.${role}.cadence.${key} must be a number`,
      );
    }
  }
  if (!Array.isArray(ch.does)) {
    throw new Error(`Config.channels.${role}.does must be an array`);
  }
  if (!Array.isArray(ch.doesNot)) {
    throw new Error(`Config.channels.${role}.doesNot must be an array`);
  }
}

/** Validate the nested fields of parameters.p1Host. */
function validateP1Host(raw: unknown): void {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Config.parameters.p1Host must be an object");
  }
  const p = raw as Record<string, unknown>;
  const validArchetypes = [
    "personal_creator",
    "branded_expert",
    "founder_operator",
  ];
  if (
    typeof p.archetype !== "string" ||
    !validArchetypes.includes(p.archetype)
  ) {
    throw new Error(
      `Config.parameters.p1Host.archetype must be one of ${validArchetypes.join(", ")}`,
    );
  }
  if (typeof p.statement !== "string" || p.statement.length === 0) {
    throw new Error("Config.parameters.p1Host.statement is required");
  }
}

function validateP2Wedge(raw: unknown): void {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Config.parameters.p2Wedge must be an object");
  }
  const p = raw as Record<string, unknown>;
  if (typeof p.statement !== "string" || p.statement.length === 0) {
    throw new Error("Config.parameters.p2Wedge.statement is required");
  }
}

function validateP3Product(raw: unknown): void {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Config.parameters.p3Product must be an object");
  }
  const p = raw as Record<string, unknown>;
  if (typeof p.statement !== "string" || p.statement.length === 0) {
    throw new Error("Config.parameters.p3Product.statement is required");
  }
  if (typeof p.kind !== "string") {
    throw new Error("Config.parameters.p3Product.kind is required");
  }
  if (typeof p.conversionCta !== "string" || p.conversionCta.length === 0) {
    throw new Error("Config.parameters.p3Product.conversionCta is required");
  }
}

function validateP4OwnedAsset(raw: unknown): void {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Config.parameters.p4OwnedAsset must be an object");
  }
  const p = raw as Record<string, unknown>;
  if (typeof p.statement !== "string" || p.statement.length === 0) {
    throw new Error("Config.parameters.p4OwnedAsset.statement is required");
  }
  if (typeof p.kind !== "string") {
    throw new Error("Config.parameters.p4OwnedAsset.kind is required");
  }
}

function validateP5ProofLoop(raw: unknown): void {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Config.parameters.p5ProofLoop must be an object");
  }
  const p = raw as Record<string, unknown>;
  if (typeof p.statement !== "string" || p.statement.length === 0) {
    throw new Error("Config.parameters.p5ProofLoop.statement is required");
  }
  const validCadences = ["daily", "weekly", "monthly", "quarterly"];
  if (typeof p.cadence !== "string" || !validCadences.includes(p.cadence)) {
    throw new Error(
      `Config.parameters.p5ProofLoop.cadence must be one of ${validCadences.join(", ")}`,
    );
  }
  if (typeof p.format !== "string") {
    throw new Error("Config.parameters.p5ProofLoop.format is required");
  }
}
