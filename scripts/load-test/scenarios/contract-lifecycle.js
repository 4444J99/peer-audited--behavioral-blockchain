import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    checks: ['rate==1.0'],
  },
};

export default function () {
  const url = __ENV.K6_API_BASE_URL;
  const email = __ENV.K6_DEMO_EMAIL || 'river@demo.styx.protocol';
  const password = __ENV.K6_DEMO_PASSWORD || 'demo-password-123'; // allow-secret: synthetic seed credential

  if (!url) {
    throw new Error('K6_API_BASE_URL is required.');
  }
  
  const healthRes = http.get(`${url}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  const loginRes = http.post(`${url}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });
  const loggedIn = check(loginRes, {
    'demo login status is 200': (r) => r.status === 200,
  });
  if (!loggedIn) return;

  const token = loginRes.json('token'); // allow-secret: short-lived synthetic session token
  const contractsRes = http.get(`${url}/contracts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(contractsRes, {
    'contracts status is 200': (r) => r.status === 200,
    'contracts return a collection': (r) => Array.isArray(r.json()),
  });

  sleep(1);
}
