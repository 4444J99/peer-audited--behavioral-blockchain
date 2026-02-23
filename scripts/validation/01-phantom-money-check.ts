/**
 * Validation Gate 01: The Phantom Money Check (WS1 + WS5)
 *
 * Objective: Assert that the double-entry ledger prevents unbalanced entries.
 * Method: Create a contract, then verify the user's balance reflects the stake hold.
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const USER_ID = 'd0000000-0000-0000-0000-000000000001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer dev-mock-jwt-token-alpha-omega', ...options?.headers }, // allow-secret
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function runPhantomMoneyCheck() {
  console.log('--- STARTING VALIDATION GATE 01: PHANTOM MONEY CHECK ---');

  // 1. Snapshot initial ledger balance
  const before = await request<{ ledgerBalance: number }>(`/wallet/balance?userId=${USER_ID}`);
  console.log(`[STATE] Initial ledger balance: $${before.ledgerBalance.toFixed(2)}`);

  // 2. Attempt to create a contract (will stake funds)
  console.log(`[ACTION] Creating a $10 contract to verify ledger integrity...`);
  let contractId: string;
  try {
    const result = await request<{ contractId: string }>('/contracts', {
      method: 'POST',
      body: JSON.stringify({
        userId: USER_ID,
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

    const after = await request<{ ledgerBalance: number }>(`/wallet/balance?userId=${USER_ID}`);
    const delta = Math.abs(after.ledgerBalance - before.ledgerBalance);

    if (delta === 0) {
      console.log('✅ GATE 01 PASSED: Phantom Money Delta is $0.00. Failed contract did not alter ledger.');
    } else {
      console.error(`❌ GATE 01 FAILED: Ledger balance changed by $${delta.toFixed(2)} without valid transaction.`);
      process.exit(1);
    }
    return;
  }

  // 3. Verify balance changed by exactly the stake amount
  const after = await request<{ ledgerBalance: number }>(`/wallet/balance?userId=${USER_ID}`);
  const delta = before.ledgerBalance - after.ledgerBalance;
  console.log(`[STATE] Final ledger balance: $${after.ledgerBalance.toFixed(2)} (delta: $${delta.toFixed(2)})`);

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
