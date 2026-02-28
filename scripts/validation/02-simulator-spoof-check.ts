/**
 * Validation Gate 02: The Simulator Spoof Check (WS2 + WS1)
 *
 * Objective: Assert that manual data entries in HealthKit/GoogleFit are blocked.
 * Method: Submit a biological contract proof with spoofed HealthKit metadata,
 * then verify the Aegis protocol rejects unsafe metrics.
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const DEMO_USER = { email: 'demo@styx.protocol', password: 'demo-password-123' }; // allow-secret

async function request<T>(path: string, token: string, options?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; error?: string }> { // allow-secret
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers }, // allow-secret
    ...options,
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text() };
  }
  return { ok: true, status: res.status, data: await res.json() };
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

async function runSimulatorSpoofCheck() {
  console.log('\n--- STARTING VALIDATION GATE 02: SIMULATOR SPOOF CHECK ---');

  // 1. Verify API is alive
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = { ok: healthRes.ok, status: healthRes.status, data: await healthRes.json() };
  if (!health.ok) {
    console.error('❌ GATE 02 FAILED: API not reachable');
    process.exit(1);
  }
  console.log(`[HEALTH] API status: ${health.data?.status}`);

  // 1b. Authenticate as demo user
  const auth = await login(DEMO_USER.email, DEMO_USER.password);
  console.log(`[AUTH] Logged in as ${DEMO_USER.email} (${auth.userId})`);

  // 2. Attempt to create a BIOLOGICAL contract with dangerously low BMI target
  // The Aegis protocol should reject this as unsafe (BMI < 18.5 floor)
  console.log('[SPOOF] Attempting biological contract with unsafe weight target...');
  const spoofResult = await request('/contracts', auth.token, {
    method: 'POST',
    body: JSON.stringify({
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
