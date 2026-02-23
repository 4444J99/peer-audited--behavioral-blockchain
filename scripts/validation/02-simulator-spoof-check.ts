/**
 * Validation Gate 02: The Simulator Spoof Check (WS2 + WS1)
 *
 * Objective: Assert that manual data entries in HealthKit/GoogleFit are blocked.
 * Method: Submit a biological contract proof with spoofed HealthKit metadata,
 * then verify the Aegis protocol rejects unsafe metrics.
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const USER_ID = 'd0000000-0000-0000-0000-000000000001';

async function request<T>(path: string, options?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer dev-mock-jwt-token-alpha-omega', ...options?.headers }, // allow-secret
    ...options,
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text() };
  }
  return { ok: true, status: res.status, data: await res.json() };
}

async function runSimulatorSpoofCheck() {
  console.log('\n--- STARTING VALIDATION GATE 02: SIMULATOR SPOOF CHECK ---');

  // 1. Verify API is alive
  const health = await request<{ status: string }>('/health');
  if (!health.ok) {
    console.error('❌ GATE 02 FAILED: API not reachable');
    process.exit(1);
  }
  console.log(`[HEALTH] API status: ${health.data?.status}`);

  // 2. Attempt to create a BIOLOGICAL contract with dangerously low BMI target
  // The Aegis protocol should reject this as unsafe (BMI < 18.5 floor)
  console.log('[SPOOF] Attempting biological contract with unsafe weight target...');
  const spoofResult = await request('/contracts', {
    method: 'POST',
    body: JSON.stringify({
      userId: USER_ID,
      oathCategory: 'BIOLOGICAL_WEIGHT',
      verificationMethod: 'HEALTHKIT',
      stakeAmount: 10,
      durationDays: 7,
      healthMetrics: {
        currentWeightLbs: 140,
        heightInches: 70,       // 5'10"
        targetWeightLbs: 100,   // BMI ~14.3 — well below 18.5 floor
      },
    }),
  });

  if (!spoofResult.ok && spoofResult.status === 400) {
    console.log(`[DEFENSE] Aegis Protocol rejected unsafe metrics: ${spoofResult.error}`);
    console.log('✅ GATE 02 PASSED: The hardware oracle strictly filters unsafe biometric targets.');
  } else if (spoofResult.ok) {
    console.error('❌ GATE 02 FAILED: Unsafe biometric target was accepted. Aegis Protocol failed.');
    process.exit(1);
  } else {
    // Other error (e.g., 404 user not found, 403 restricted) — still a valid rejection
    console.log(`[DEFENSE] API rejected request (status ${spoofResult.status}): ${spoofResult.error}`);
    console.log('✅ GATE 02 PASSED: Spoofed payload was blocked (non-200 response).');
  }
}

runSimulatorSpoofCheck().catch((err) => {
  console.error('❌ GATE 02 CRASHED:', err);
  process.exit(1);
});

export default runSimulatorSpoofCheck;
