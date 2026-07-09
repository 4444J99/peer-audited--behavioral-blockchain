/**
 * Validation Gate 01: The Phantom Money Check (WS1 + WS5)
 *
 * Objective: Assert that the double-entry ledger prevents unbalanced entries.
 * Method: Create a contract, then verify the user's balance reflects the stake hold.
 */

function requireApiBase(): string {
  const apiUrl =
    process.env.API_URL ||
    process.env.STYX_API_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error(
      "API_URL, STYX_API_PUBLIC_URL, or NEXT_PUBLIC_API_URL is required.",
    );
  }
  let end = apiUrl.length;
  while (end > 0 && apiUrl[end - 1] === "/") end--;
  return apiUrl.slice(0, end);
}

const API_BASE = requireApiBase();
const DEMO_USER = {
  email: "demo@styx.protocol",
  password: "demo-password-123",
}; // allow-secret

async function request<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  // allow-secret
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    }, // allow-secret
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function login(
  email: string,
  password: string,
): Promise<{ userId: string; token: string }> {
  // allow-secret
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  return res.json();
}

async function runPhantomMoneyCheck() {
  console.log("--- STARTING VALIDATION GATE 01: PHANTOM MONEY CHECK ---");

  // Authenticate as demo user
  const auth = await login(DEMO_USER.email, DEMO_USER.password);
  console.log(`[AUTH] Logged in as ${DEMO_USER.email} (${auth.userId})`);

  // 1. Snapshot initial ledger balance
  const before = await request<{ ledger_balance: number }>(
    `/wallet/balance`,
    auth.token,
  );
  console.log(
    `[STATE] Initial ledger balance: $${before.ledger_balance.toFixed(2)}`,
  );

  // 2. Attempt to create a contract (will stake funds)
  console.log(`[ACTION] Creating a $10 contract to verify ledger integrity...`);
  let contractId: string;
  try {
    const result = await request<{ contractId: string }>(
      "/contracts",
      auth.token,
      {
        method: "POST",
        body: JSON.stringify({
          oathCategory: "COGNITIVE_FOCUS",
          verificationMethod: "SCREENTIME",
          stakeAmount: 10,
          durationDays: 7,
        }),
      },
    );
    contractId = result.contractId;
    console.log(`[ACTION] Contract created: ${contractId}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      `[DEFENSE] Contract creation rejected (expected if no Stripe): ${message}`,
    );
    console.log("--- Checking ledger balance was not affected ---");

    const after = await request<{ ledger_balance: number }>(
      `/wallet/balance`,
      auth.token,
    );
    const delta = Math.abs(after.ledger_balance - before.ledger_balance);

    if (delta > 0.005) {
      console.error(
        `❌ GATE 01 FAILED: Ledger balance changed by $${delta.toFixed(2)} without a valid transaction.`,
      );
      process.exit(1);
    }
    // No phantom money was created, but the happy path (an actual stake hold) was never
    // exercised, so we cannot claim the ledger-balancing invariant was verified.
    console.warn(
      "⚠️  GATE 01 NOT VERIFIED: contract creation did not complete (e.g. Stripe unavailable);",
    );
    console.warn(
      "   the stake-hold ledger path was not exercised. No phantom money was detected on failure.",
    );
    process.exit(2);
  }

  // 3. Verify balance changed by (approximately) the stake amount.
  // NOTE: This checks the user's own ledger balance delta, not the system-wide
  // double-entry invariant (sum of credits === sum of debits). Use the ledger
  // integrity check (verifyLedgerIntegrity) for the cross-account invariant.
  const after = await request<{ ledger_balance: number }>(
    `/wallet/balance`,
    auth.token,
  );
  const delta = before.ledger_balance - after.ledger_balance;
  console.log(
    `[STATE] Final ledger balance: $${after.ledger_balance.toFixed(2)} (delta: $${delta.toFixed(2)})`,
  );

  if (Math.abs(delta - 10) < 0.005) {
    console.log(
      "✅ GATE 01 PASSED: Ledger delta matches stake amount. No phantom money.",
    );
  } else {
    console.error(
      `❌ GATE 01 FAILED: Expected delta of $10.00, got $${delta.toFixed(2)}`,
    );
    process.exit(1);
  }
}

runPhantomMoneyCheck().catch((err) => {
  console.error("❌ GATE 01 CRASHED:", err);
  process.exit(1);
});

export default runPhantomMoneyCheck;
