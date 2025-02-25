import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAccessToken } from '../helpers/customer.js';
import { paramsRaw } from '../helpers/params_raw.js';

export const options = {
  stages: [
    { duration: '1s', target: 100 },  // Ramp-up to 20 VUs
    { duration: '3s', target: 300 },  // Stay at 20 VUs for 2 iterations
    { duration: '6s', target: 1000 },  // Stay at 20 VUs for 2 iterations
  ],
  thresholds: {
    // 1. Rate of failed HTTP requests should be less than 0.1%
    http_req_failed: ['rate<0.001'],  

    // 2. 90% of the HTTP request durations should be less than 2000ms
    http_req_duration: ['p(90)<2000'],

    // 3. The slowest request for receiving should be completed within 17000ms
    http_req_receiving: ['max<17000'],
  },
};

export default function () {
  // Retrieve access token
  const accessToken = getAccessToken();
  // Request headers with Authorization Bearer token
  const params = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };

  // API endpoint URL to be accessed
  const url = __ENV.CUSTOMER_URL ? `${__ENV.CUSTOMER_URL}/redeem` : 'http://localhost:3700/customer/v0/redeem';

 // Define the body with the pin
  const payload = JSON.stringify({
    pin: '123456',
  });

  // Send POST request with body
  const res = http.post(url, payload, {
    ...paramsRaw,
    ...params
  });
  
  const checkRes = check(res, {
    'response status must 200 or 400': (response) => response.status === 201 || response.status === 400,
    'response message must create or transaction': (response) => response.json().message === 'Created' || response.json().message === 'There is no transaction now.' || response.json().message === 'Not enough points available to redeem.' || response.json().message === 'Not enough stock available to redeem Load Test Publish'
  });

  if (!checkRes) {
    fail(`Checkout Failed`);
  };

  // Simulate a 1-second delay between requests
  sleep(2);
}
