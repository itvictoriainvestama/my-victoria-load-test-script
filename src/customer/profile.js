import http from 'k6/http';
import { check } from 'k6';
import { paramsRaw } from '../helpers/params_raw.js';

let accessToken = '';

function login() {
  
  const url = 'https://api-sandbox.vlife.id/auth/client/get-token';

  const payload = JSON.stringify({
    name: 'Dummy', 
    secret: 'dummy123', 
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  if (check(res, { 'login successful': (r) => r.status === 200 })) {
    const jsonResponse = JSON.parse(res.body);
    accessToken = jsonResponse.accessToken; 
    console.log(`Access Token: ${accessToken}`);
  } else {
    console.error(`Login failed: ${res.status} ${res.body}`);
  }
}

export default function () {
  // Call the login function to retrieve the access token
  login();
}

// Export the access token for use in other files
export function getAccessToken() {
  if (!accessToken) {
    console.warn('Access token is not available. Please ensure login was successful.');
  }
  return accessToken;
}