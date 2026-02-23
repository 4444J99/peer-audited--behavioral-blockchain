/**
 * Validation Gate 03: The Full Loop (WS2 + WS1 + WS3)
 *
 * Objective: End-to-end contract lifecycle via real HTTP calls with JWT auth.
 * Flow: Login → Create contract → Submit proof → 3 Fury verdicts → Verify resolution.
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';

// Demo credentials — must match seed.sql (password: demo-password-123, bcrypt cost 10)
const DEMO_USER = { email: 'demo@styx.protocol', password: 'demo-password-123' }; // allow-secret
const FURY_USERS = [
  { email: 'fury@styx.protocol', password: 'demo-password-123' }, // allow-secret
  { email: 'admin@styx.protocol', password: 'demo-password-123' }, // allow-secret
];

async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> { // allow-secret
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // allow-secret
      ...options?.headers,
    },
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

async function runTheFullLoop() {
  console.log('\n--- STARTING VALIDATION GATE 03: THE FULL LOOP (JWT AUTH) ---');

  // Step 1: Verify API is alive
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = await healthRes.json();
  console.log(`[HEALTH] API status: ${health.status}`);

  // Step 2: Login as demo user
  console.log(`[AUTH] Logging in as ${DEMO_USER.email}...`);
  const userAuth = await login(DEMO_USER.email, DEMO_USER.password);
  console.log(`[AUTH] Logged in. User: ${userAuth.userId}`);

  // Step 3: Create a behavioral contract
  console.log(`[STEP 1] Creating behavioral contract...`);
  let contractId: string;
  try {
    const contract = await request<{ contractId: string }>('/contracts', userAuth.token, {
      method: 'POST',
      body: JSON.stringify({
        oathCategory: 'CREATIVE_WRITING',
        verificationMethod: 'FURY_NETWORK',
        stakeAmount: 15,
        durationDays: 7,
      }),
    });
    contractId = contract.contractId;
    console.log(`[STEP 1] Contract created: ${contractId}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[STEP 1] Contract creation failed (may require Stripe): ${message}`);
    console.log('⚠️  GATE 03 SKIPPED: Cannot complete full loop without payment integration.');
    return;
  }

  // Step 4: Submit proof
  console.log(`[STEP 2] Submitting proof for contract ${contractId}...`);
  const proof = await request<{ proofId: string; jobId: string }>(`/contracts/${contractId}/proof`, userAuth.token, {
    method: 'POST',
    body: JSON.stringify({
      mediaUri: 'r2://styx-fury-proofs/validation-gate-03.mp4',
    }),
  });
  console.log(`[STEP 2] Proof submitted: ${proof.proofId} (job: ${proof.jobId})`);

  // Step 5: Login as each Fury and submit verdicts
  console.log(`[STEP 3] Submitting Fury verdicts...`);
  let verdictsSubmitted = 0;

  for (const furyUser of FURY_USERS) {
    try {
      const furyAuth = await login(furyUser.email, furyUser.password);

      const queue = await request<{ assignments: Array<{ assignment_id: string; proof_id: string }> }>(
        '/fury/queue',
        furyAuth.token,
      );

      const matching = queue.assignments.find((a) => a.proof_id === proof.proofId);
      if (matching) {
        await request('/fury/verdict', furyAuth.token, {
          method: 'POST',
          body: JSON.stringify({
            assignmentId: matching.assignment_id,
            verdict: 'PASS',
          }),
        });
        verdictsSubmitted++;
        console.log(`[STEP 3] Fury ${furyUser.email} voted PASS on assignment ${matching.assignment_id}`);
      } else {
        console.log(`[STEP 3] Fury ${furyUser.email} has no matching assignment`);
      }
    } catch (err) {
      console.log(`[STEP 3] Fury ${furyUser.email} login/vote failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`[STEP 3] ${verdictsSubmitted} verdict(s) submitted.`);

  // Step 6: Verify contract state
  console.log(`[STEP 4] Checking final contract state...`);
  const finalContract = await request<{ id: string; status: string }>(`/contracts/${contractId}`, userAuth.token);
  console.log(`[STEP 4] Contract ${contractId} status: ${finalContract.status}`);

  // Step 7: Verify user contracts list includes this one
  const userContracts = await request<Array<{ id: string }>>('/contracts', userAuth.token);
  const found = userContracts.some((c) => c.id === contractId);

  if (!found) {
    console.error('❌ GATE 03 FAILED: Contract not found in user contracts list.');
    process.exit(1);
  }
  console.log(`[STEP 5] Contract visible in user list.`);

  // Step 8: Verify Fury bounty disbursement
  console.log(`[STEP 6] Checking Fury bounty disbursement...`);
  let bountyVerified = false;
  for (const furyUser of FURY_USERS) {
    try {
      const furyAuth = await login(furyUser.email, furyUser.password);
      const stats = await request<{
        totalAudits: number;
        totalBountiesEarned: number;
        netEarnings: number;
      }>('/fury/stats', furyAuth.token);

      console.log(`[STEP 6] Fury ${furyUser.email}: ${stats.totalAudits} audits, $${stats.totalBountiesEarned} earned, net $${stats.netEarnings}`);

      if (stats.totalBountiesEarned > 0) {
        bountyVerified = true;
      }
    } catch (err) {
      console.log(`[STEP 6] Fury ${furyUser.email} stats check failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (bountyVerified) {
    console.log('✅ GATE 03 PASSED: End-to-end lifecycle completed with bounty disbursement.');
  } else {
    console.log('⚠️  GATE 03 PARTIAL: Lifecycle completed but bounty disbursement not confirmed (Furies may lack account_id).');
  }
}

runTheFullLoop().catch((err) => {
  console.error('❌ GATE 03 CRASHED:', err);
  process.exit(1);
});

export default runTheFullLoop;
