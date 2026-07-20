import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const url = __ENV.API_BASE_URL || 'http://localhost:3000';
  
  // 1. Health check
  const healthRes = http.get(`${url}/api/v1/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Fetch contracts
  const contractsRes = http.get(`${url}/api/v1/contracts`);
  check(contractsRes, {
    'contracts response received': (r) => [200, 401].includes(r.status),
  });

  sleep(1);
}
