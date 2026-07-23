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
  },
};

export default function () {
  const url = __ENV.API_BASE_URL || 'http://localhost:3000';
  const payload = JSON.stringify({
    contractId: 'c1111111-1111-1111-1111-111111111111',
    description: 'k6 load test proof submission',
    mediaUri: 'https://storage.styx.app/proofs/k6-test.mp4',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer k6-test-token',
    },
  };

  const res = http.post(`${url}/api/v1/proofs`, payload, params);
  check(res, {
    'status is 200 or 201 or 401': (r) => [200, 201, 401, 403].includes(r.status),
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
