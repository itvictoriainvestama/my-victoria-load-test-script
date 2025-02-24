import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { getAccessToken, default as login } from '../customer/profile.js';

// Metrik Global
const totalRequests = new Counter('total_requests');
const successCount = new Counter('success_count');
const failedCount = new Counter('failed_count');
const responseTimeTrend = new Trend('response_time');

export const options = {
  stages: [
    { duration: '5s', target: 100 },    // Naik ke 100 VU
    { duration: '10s', target: 1000 },  // Naik ke 1000 VU
    { duration: '10s', target: 3000 },  // Naik ke 3000 VU
    { duration: '10s', target: 5000 },  // Naik ke 5000 VU
    { duration: '10s', target: 7000 },  // Naik ke 7000 VU
    { duration: '10s', target: 10000 }, // Naik ke 10.000 VU
    { duration: '20s', target: 10000 }, // Tahan di 10.000 VU
    { duration: '10s', target: 5000 },  // Turun ke 5000 VU
    { duration: '10s', target: 2000 },  // Turun ke 2000 VU
    { duration: '10s', target: 1000 },  // Turun ke 1000 VU
    { duration: '5s', target: 100 },    // Turun ke 100 VU
    { duration: '5s', target: 0 },      // Turun ke 0 VU
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // Maksimal 1% error
    http_req_duration: ['p(90)<2000'], // 90% request harus di bawah 2 detik
  },
};

export function setup() {
  console.log("🔑 Fetching Access Token...");
  login();
  sleep(2);
  return getAccessToken();
}

export default function (accessToken) {
  if (!accessToken) {
    console.error('❌ ERROR: Access token is missing. Skipping request.');
    return;
  }

  const url = 'https://api-sandbox.vlife.id/client/policy';

  const payload = JSON.stringify({
    "product_sub_id": "678f5e75ae10ec0ac6e6a3ff",
    "period": 1,
    "request_letter": { "agree": true },
    "policyholder_type": "customer",
    "policyholderData": {
      "fullname": "Pieter",
      "gender": "m",
      "birth": 242586000000,
      "address": [{ "value": "22 Bluestem Court", "type": "domicile" }],
      "contact": [{ "value": "3318449078", "type": "phone_no" }],
      "identities": [{ "value": "1975136235929796", "type": "id" }]
    },
    "insuredData": {
      "fullname": "Muhammad Pieter",
      "gender": "m",
      "birth": 242586000000,
      "address": [{ "value": "22 Bluestem Court", "type": "domicile" }],
      "contact": [{ "value": "3318449078", "type": "phone_no" }],
      "identities": [{ "value": "1975136235929796", "type": "id" }]
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  const res = http.post(url, payload, params);
  totalRequests.add(1);
  responseTimeTrend.add(res.timings.duration);

  const success = check(res, {
    'is status 201 and empty body': (r) => r.status === 201 && r.body.trim() === '{}',
  });

  if (success) {
    successCount.add(1);
  } else {
    failedCount.add(1);
    console.error(`❌ Failed Request! Response: ${res.body}`);
  }

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    stdout: `
  ========== Load Test Summary ==========
  ✅ Total Requests: ${data.metrics.total_requests.values.count}
  🟢 Success Count: ${data.metrics.success_count.values.count} (${((data.metrics.success_count.values.count / data.metrics.total_requests.values.count) * 100).toFixed(2)}%)
  🔴 Failed Count: ${data.metrics.failed_count.values.count} (${((data.metrics.failed_count.values.count / data.metrics.total_requests.values.count) * 100).toFixed(2)}%)
  ⏳ Avg Response Time: ${data.metrics.response_time.values.avg.toFixed(2)} ms
  🚀 p(90) Response Time: ${data.metrics.http_req_duration.values['p(90)'].toFixed(2)} ms
  =======================================
    `,
  };
}
