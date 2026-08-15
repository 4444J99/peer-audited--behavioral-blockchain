#!/usr/bin/env node
/**
 * Ensures the beta Render estate is configured before a deploy builds against it.
 *
 * Three responsibilities, in order:
 *   1. The two March-provisioned services (api, web) exist and are not suspended
 *      — a suspended service is resumed, a missing one is a hard failure with an
 *      owner-routed message, because this script must not invent replacements
 *      for infrastructure it cannot see the history of.
 *   2. The feedback collector service exists (find-or-create by name). Collector
 *      failures WARN and continue: telemetry must never turn a working beta
 *      launch into a failed one — the same rule the local demo enforces.
 *   3. The env vars the beta build needs are present on each service. NEXT_PUBLIC_*
 *      values are baked at build time, so this must run BEFORE the deploy jobs:
 *      an unset NEXT_PUBLIC_STYX_GUIDED_TOUR compiles the entire tour out of the
 *      bundle while the Private-Beta banner defaults ON — a beta with chrome and
 *      no explanations.
 *
 * Log hygiene: this runs in a PUBLIC repo's Actions logs. Service IDs and URLs
 * that live in GitHub secrets are masked by GitHub; everything else printed here
 * is role names ("api", "web"), env-var KEY names, and the collector URL — which
 * is public by design (it is baked into the shipped web bundle).
 */

const API = "https://api.render.com/v1";
const key = process.env.RENDER_API_KEY;
const apiServiceId = process.env.RENDER_BETA_API_SERVICE_ID;
const webServiceId = process.env.RENDER_BETA_WEB_SERVICE_ID;
const feedbackToken = process.env.BETA_FEEDBACK_TOKEN || "";
const feedbackName = process.env.STYX_BETA_FEEDBACK_SERVICE_NAME || "styx-beta-feedback";
const repoUrl = "https://github.com/4444J99/peer-audited--behavioral-blockchain";
const FEEDBACK_DATA_DIR = "/var/styx-feedback";

if (!key || !apiServiceId || !webServiceId) {
  throw new Error("RENDER_API_KEY, RENDER_BETA_API_SERVICE_ID and RENDER_BETA_WEB_SERVICE_ID are required.");
}

async function render(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  return { status: response.status, ok: response.ok, body: parsed };
}

/** 1. Existence + suspension for a service we must not recreate. */
async function ensureLive(role, serviceId) {
  const got = await render("GET", `/services/${serviceId}`);
  if (got.status === 404) {
    throw new Error(
      `beta ${role} service does not exist on Render (404). It was provisioned outside render.yaml in ` +
        `2026-03; recreate it from the Render dashboard (or update the RENDER_BETA_*_SERVICE_ID secret) — ` +
        `this script deliberately does not re-invent app services.`,
    );
  }
  if (!got.ok) throw new Error(`beta ${role} service lookup failed: HTTP ${got.status}`);
  const suspended = got.body?.suspended === "suspended";
  if (suspended) {
    console.log(`beta ${role} service is suspended — resuming it ...`);
    const resumed = await render("POST", `/services/${serviceId}/resume`);
    if (!resumed.ok && resumed.status !== 202) {
      throw new Error(`could not resume the beta ${role} service: HTTP ${resumed.status}`);
    }
  }
  console.log(`beta ${role} service: exists${suspended ? ", resumed" : ""}.`);
  return got.body;
}

async function listEnvKeys(serviceId) {
  const got = await render("GET", `/services/${serviceId}/env-vars?limit=100`);
  if (!got.ok || !Array.isArray(got.body)) return new Map();
  const map = new Map();
  for (const row of got.body) {
    const entry = row.envVar || row;
    if (entry?.key) map.set(entry.key, entry.value ?? "");
  }
  return map;
}

/** 3. Add-or-update one env var; per-key PUT so unrelated dashboard config is untouched. */
async function ensureEnv(role, serviceId, wanted, current) {
  for (const [k, v] of Object.entries(wanted)) {
    if (current.get(k) === v) {
      console.log(`  ${role}: ${k} already set`);
      continue;
    }
    const put = await render("PUT", `/services/${serviceId}/env-vars/${encodeURIComponent(k)}`, { value: v });
    if (!put.ok) throw new Error(`failed to set ${k} on the ${role} service: HTTP ${put.status}`);
    console.log(`  ${role}: ${k} ${current.has(k) ? "updated" : "created"}`);
  }
}

/**
 * 2. Resolve the collector. An EXTERNAL collector URL wins (#894): the live
 * collector is a Cloudflare Worker (KV-backed, token-gated summary), so when
 * STYX_BETA_FEEDBACK_URL is configured, Render provisioning is skipped
 * entirely — no find-or-create, no paid service, no 402 on free-tier
 * workspaces. Only when no external URL is configured does the legacy Render
 * path below run. The URL is public by design (baked into the shipped
 * bundle); only the summary token is secret.
 */
async function resolveFeedbackUrl(ownerId) {
  const external = (process.env.STYX_BETA_FEEDBACK_URL || "").replace(/\/+$/, "");
  if (external) {
    console.log("feedback collector: external URL configured — skipping Render provisioning");
    return external;
  }
  return ensureFeedbackService(ownerId);
}

/** Legacy Render path: find-or-create the collector. Never fatal. */
async function ensureFeedbackService(ownerId) {
  try {
    const found = await render("GET", `/services?name=${encodeURIComponent(feedbackName)}&limit=20`);
    let service = null;
    if (found.ok && Array.isArray(found.body)) {
      service = found.body.map((row) => row.service || row).find((s) => s?.name === feedbackName) || null;
    }
    if (!service) {
      console.log(`feedback collector '${feedbackName}' not found — creating it ...`);
      const created = await render("POST", "/services", {
        type: "web_service",
        name: feedbackName,
        ownerId,
        repo: repoUrl,
        branch: "main",
        autoDeploy: "yes",
        serviceDetails: {
          env: "node",
          plan: "starter",
          region: "oregon",
          envSpecificDetails: {
            // The collector is dependency-free by design; an empty build would
            // still trigger a default install of the whole workspace, so say so.
            buildCommand: "echo 'no build: the collector is dependency-free'",
            startCommand: "node scripts/demo/feedback-server.mjs",
          },
          disk: {
            name: "feedback-data",
            mountPath: FEEDBACK_DATA_DIR,
            sizeGB: 1,
          },
        },
        envVars: [
          { key: "STYX_DEMO_FEEDBACK_DIR", value: FEEDBACK_DATA_DIR },
          ...(feedbackToken ? [{ key: "STYX_FEEDBACK_SUMMARY_TOKEN", value: feedbackToken }] : []),
        ],
      });
      if (!created.ok) {
        console.log(`::warning::could not create the feedback collector (HTTP ${created.status}); the beta launches without notes/tracking.`);
        return "";
      }
      service = created.body?.service || created.body;
    } else {
      if (service.suspended === "suspended") {
        console.log("feedback collector is suspended — resuming it ...");
        await render("POST", `/services/${service.id}/resume`);
      }
      const current = await listEnvKeys(service.id);
      const wanted = { STYX_DEMO_FEEDBACK_DIR: FEEDBACK_DATA_DIR };
      if (feedbackToken) wanted.STYX_FEEDBACK_SUMMARY_TOKEN = feedbackToken;
      await ensureEnv("feedback", service.id, wanted, current);
    }
    const url = service?.serviceDetails?.url || "";
    if (!url) {
      console.log("::warning::feedback collector exists but reported no URL; launching without notes/tracking.");
      return "";
    }
    console.log(`feedback collector ready at ${url}`);
    return url;
  } catch (error) {
    console.log(`::warning::feedback collector setup failed (${error?.message}); the beta launches without notes/tracking.`);
    return "";
  }
}

const apiService = await ensureLive("api", apiServiceId);
await ensureLive("web", webServiceId);

const feedbackUrl = await resolveFeedbackUrl(apiService.ownerId);

console.log("ensuring beta env vars (key names only) ...");
const apiCurrent = await listEnvKeys(apiServiceId);
const webCurrent = await listEnvKeys(webServiceId);

// Advisory: keys the API cannot boot (or pass /health/ready) without. The March
// services were configured by hand, so this is a report, not an enforcement.
const criticalApiKeys = ["DATABASE_URL", "JWT_SECRET"];
const redisKeys = ["REDIS_URL", "REDIS_BULLMQ_URL", "REDIS_CACHE_URL", "REDIS_HOST"];
for (const k of criticalApiKeys) {
  if (!apiCurrent.has(k)) console.log(`::warning::api service is missing env key ${k}`);
}
if (!redisKeys.some((k) => apiCurrent.has(k))) {
  console.log(`::warning::api service has no Redis env key (${redisKeys.join(", ")}) — /health/ready will report degraded`);
}

await ensureEnv("api", apiServiceId, { STYX_ENV_LABEL: "beta" }, apiCurrent);
await ensureEnv(
  "web",
  webServiceId,
  {
    NEXT_PUBLIC_STYX_GUIDED_TOUR: "true",
    NEXT_PUBLIC_STYX_TEST_MONEY_MODE: "true",
    NEXT_PUBLIC_STYX_PRIVATE_BETA: "true",
    NEXT_PUBLIC_STYX_ENV_LABEL: "beta",
    NEXT_PUBLIC_STYX_FEATURE_B2B_HR_UI: "true",
    ...(feedbackUrl ? { NEXT_PUBLIC_STYX_FEEDBACK_URL: feedbackUrl } : {}),
  },
  webCurrent,
);

if (process.env.GITHUB_OUTPUT) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_OUTPUT, `feedback_url=${feedbackUrl}\n`);
}
console.log("beta env assurance complete.");
