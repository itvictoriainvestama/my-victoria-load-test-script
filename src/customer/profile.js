import http from 'k6/http';
import { sleep } from 'k6';
import { getAccessToken } from '../helpers/customer.js';

export const options = {
  stages: [
    { duration: '1s', target: 200 },  // Ramp-up to 20 VUs
    { duration: '1s', target: 200 },  // Stay at 20 VUs for 2 iterations
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

  // API endpoint URL to be accessed
  const url = __ENV.CUSTOMER_URL ? `${__ENV.CUSTOMER_URL}/auth/getProfile` : 'http://localhost:3700/customer/v0/auth/getProfile';

  // Request headers with Authorization Bearer token
  const params = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // Send GET request
  const res = http.get(url, params);


  // Simulate a 1-second delay between requests
  sleep(1);
}
