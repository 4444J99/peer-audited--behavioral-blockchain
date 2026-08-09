import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    checks: ['rate==1.0'],
  },
};

export default function () {
  const url = __ENV.K6_API_BASE_URL;
  const email = __ENV.K6_FURY_EMAIL;
  const password = __ENV.K6_FURY_PASSWORD; // allow-secret: injected load-test credential
  if (!url || !email || !password) {
    throw new Error('K6_API_BASE_URL, K6_FURY_EMAIL, and K6_FURY_PASSWORD are required.');
  }

  const loginRes = http.post(`${url}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const loggedIn = check(loginRes, {
    'Fury demo login status is 200': (r) => r.status === 200,
  });
  if (!loggedIn) return;

  const token = loginRes.json('token'); // allow-secret: short-lived synthetic session token
  const res = http.get(`${url}/fury/queue`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(res, {
    'Fury queue status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
