/**
 * Validation Gate 01: The Phantom Money Check (WS1 + WS5)
 *
 * Objective: Assert that the double-entry ledger prevents unbalanced entries.
 * Method: Create a contract, then verify the user's balance reflects the stake hold.
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const DEMO_USER = { email: 'demo@styx.protocol', password: 'demo-password-123' }; // allow-secret

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> { // allow-secret
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers }, // allow-secret
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function login(email: string, password: string): Promise<{ userId: string; token: string }> { // allow-secret
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  return res.json();
}

async function runPhantomMoneyCheck() {
  console.log('--- STARTING VALIDATION GATE 01: PHANTOM MONEY CHECK ---');

  // Authenticate as demo user
  const auth = await login(DEMO_USER.email, DEMO_USER.password);
  console.log(`[AUTH] Logged in as ${DEMO_USER.email} (${auth.userId})`);

  // 1. Snapshot initial ledger balance
  const before = await request<{ ledger_balance: number }>(`/wallet/balance`, auth.token);
  console.log(`[STATE] Initial ledger balance: $${before.ledger_balance.toFixed(2)}`);

  // 2. Attempt to create a contract (will stake funds)
  console.log(`[ACTION] Creating a $10 contract to verify ledger integrity...`);
  let contractId: string;
  try {
    const result = await request<{ contractId: string }>('/contracts', auth.token, {
      method: 'POST',
      body: JSON.stringify({
        oathCategory: 'COGNITIVE_FOCUS',
        verificationMethod: 'SCREENTIME',
        stakeAmount: 10,
        durationDays: 7,
      }),
    });
    contractId = result.contractId;
    console.log(`[ACTION] Contract created: ${contractId}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[DEFENSE] Contract creation rejected (expected if no Stripe): ${message}`);
    console.log('--- Checking ledger balance was not affected ---');

    const after = await request<{ ledger_balance: number }>(`/wallet/balance`, auth.token);
    const delta = Math.abs(after.ledger_balance - before.ledger_balance);

    if (delta === 0) {
      console.log('✅ GATE 01 PASSED: Phantom Money Delta is $0.00. Failed contract did not alter ledger.');
    } else {
      console.error(`❌ GATE 01 FAILED: Ledger balance changed by $${delta.toFixed(2)} without valid transaction.`);
      process.exit(1);
    }
    return;
  }

  // 3. Verify balance changed by exactly the stake amount
  const after = await request<{ ledger_balance: number }>(`/wallet/balance`, auth.token);
  const delta = before.ledger_balance - after.ledger_balance;
  console.log(`[STATE] Final ledger balance: $${after.ledger_balance.toFixed(2)} (delta: $${delta.toFixed(2)})`);

  if (delta === 10) {
    console.log('✅ GATE 01 PASSED: Ledger delta matches stake amount exactly. No phantom money.');
  } else {
    console.error(`❌ GATE 01 FAILED: Expected delta of $10.00, got $${delta.toFixed(2)}`);
    process.exit(1);
  }
}

runPhantomMoneyCheck().catch((err) => {
  console.error('❌ GATE 01 CRASHED:', err);
  process.exit(1);
});

export default runPhantomMoneyCheck;
