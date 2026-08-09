#!/usr/bin/env node
import assert from 'node:assert/strict';

const apiBase = (process.env.STYX_DEMO_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const webBase = (process.env.STYX_DEMO_WEB_URL || 'http://localhost:3001').replace(/\/$/, '');
const demoPassword = process.env.STYX_DEMO_PASSWORD || 'demo-password-123'; // allow-secret: synthetic seed credential
const enterpriseId = 'e0000000-0000-0000-0000-000000000001';

async function requestJson(label, url, init = {}) {
  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new Error(`${label}: request failed (${error instanceof Error ? error.message : String(error)})`);
  }
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${label}: expected a successful response, got HTTP ${response.status}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${label}: expected JSON response`);
  }
}

async function login(email) {
  const session = await requestJson(`login for ${email}`, `${apiBase}/auth/login`, { // allow-secret: synthetic session request
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: demoPassword }), // allow-secret: synthetic seed credential
  });
  assert.equal(typeof session.token, 'string', `login for ${email}: token missing`);
  return { authorization: `Bearer ${session.token}` };
}

function authenticated(headers) {
  return { headers };
}

async function verify() {
  const health = await requestJson('API readiness', `${apiBase}/health/ready`);
  assert.equal(health.status, 'ready', 'API readiness: dependencies are not ready');
  assert.equal(health.checks?.database?.status, 'ok', 'API readiness: database is not healthy');
  assert.equal(health.checks?.redis?.status, 'ok', 'API readiness: redis is not healthy');

  const tour = await fetch(`${webBase}/tour`);
  const tourHtml = await tour.text();
  assert.equal(tour.status, 200, 'browser tour: expected HTTP 200');
  assert.match(tourHtml, /Test-money beta/i, 'browser tour: test-money boundary is missing');
  assert.match(tourHtml, /Working today/i, 'browser tour: truth labels are missing');

  const river = await login('river@demo.styx.protocol');
  const [balance, history, contracts, streak] = await Promise.all([
    requestJson('river ledger balance', `${apiBase}/wallet/balance`, authenticated(river)),
    requestJson('river ledger history', `${apiBase}/wallet/history?limit=10`, authenticated(river)),
    requestJson('river commitments', `${apiBase}/contracts`, authenticated(river)),
    requestJson('river behavioral streak', `${apiBase}/dashboard/streak`, authenticated(river)),
  ]);
  assert.equal(typeof balance.ledger_balance, 'number', 'river ledger balance: expected a numeric test-credit balance');
  assert.ok(Array.isArray(history.transactions) && history.transactions.length > 0, 'river ledger history: expected seeded ledger entries');
  assert.ok(Array.isArray(contracts) && contracts.length > 0, 'river commitments: expected synthetic commitments');
  assert.ok(Array.isArray(streak.days) && streak.days.length > 0, 'river behavioral streak: expected seeded check-in history');

  let proofFound = false;
  for (const contract of contracts) {
    const detail = await requestJson('commitment proof record', `${apiBase}/contracts/${contract.id}`, authenticated(river));
    if (Array.isArray(detail.proofs) && detail.proofs.length > 0) {
      proofFound = true;
      break;
    }
  }
  assert.equal(proofFound, true, 'commitment proof record: expected at least one auditable proof');

  const coach = await login('dr.moira@demo.styx.protocol');
  const coachDashboard = await requestJson('coach assignment view', `${apiBase}/practitioner/dashboard`, authenticated(coach));
  assert.ok(coachDashboard && typeof coachDashboard === 'object', 'coach assignment view: expected a scoped dashboard');

  const enterpriseAdmin = await login('hr.lead@acheron.example');
  const enterpriseMetrics = await requestJson(
    'enterprise aggregate preview',
    `${apiBase}/b2b/metrics/${enterpriseId}`,
    authenticated(enterpriseAdmin),
  );
  assert.ok(enterpriseMetrics && typeof enterpriseMetrics === 'object', 'enterprise aggregate preview: expected aggregate metrics');

  console.log('PASS: live API, browser, ledger, proof, behavioral, coach, and enterprise-preview checks passed.');
}

verify().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
