import http from 'k6/http';
import { sleep } from 'k6';
import { getAccessToken } from '../helpers/customer.js';
import { paramsRaw } from '../helpers/params_raw.js';

export const options = {
  stages: [
    { duration: '1s', target: 500 }, 
    { duration: '6s', target: 1000 },
    { duration: '7s', target: 1200 }, 
    { duration: '10s', target: 1500 }, 
    { duration: '15s', target: 2000 },
    { duration: '25s', target: 3000 },
    { duration: '35s', target: 5000 },
    { duration: '18s', target: 3000 },
    { duration: '12s', target: 2000 },
    { duration: '10s', target: 1000 },
    { duration: '10s', target: 800 },
    { duration: '8s', target: 500 },
    { duration: '8s', target: 200 },
    { duration: '5s', target: 100 },
    { duration: '1s', target: 0 },
  ],
  thresholds: {
    // 1. Rate of failed HTTP requests should be less than 0.1%
    http_req_failed: ['rate<0.001'],  

    // 2. 90% of the HTTP request durations should be less than 2000ms
    http_req_duration: ['p(90)<2000'],

    // 3. The slowest request for receiving should be completed within 17000ms
    http_req_receiving: ['max<17000']
  },
};

export default function () {
  // Retrieve access token
  const accessToken = getAccessToken();

  // API endpoint URL to be accessed
  const url = __ENV.CUSTOMER_URL ? `${__ENV.CUSTOMER_URL}/auth/getProfile` : 'http://localhost:3700/customer/v0/auth/getProfile';

  // Request headers with Authorization Bearer token
  const params = {
    ...paramsRaw,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // Send GET request
  const res = http.get(url, params);


  // Simulate a 2-second delay between requests
  sleep(2);
}
