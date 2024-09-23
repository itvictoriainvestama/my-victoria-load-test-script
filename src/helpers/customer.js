import http from 'k6/http';
import {check, fail} from 'k6';
import execution from "k6/execution";


export function login(body) {
    const loginResponse = http.post(__ENV.CUSTOMER_URL ? `${__ENV.CUSTOMER_URL}/auth/login` : 'http://localhost:3700/customer/v0/auth/login', JSON.stringify(body), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
    });
    const checkLogin = check(loginResponse, {
        'login response status must 201': (response) => response.status === 201,
        'login response token must exists': (response) => !!response.json().result.accessToken,
    });

    if (!checkLogin) {
      fail(`Failed to login ${body.email_or_phone}`);
    };

    return loginResponse;
}

export function getAccessToken() {
  let email 
  let password 

  if(__ENV.DIFFERENCE_CUSTOMER){
    email = `customer-${(execution.vu.idInInstance%((Number(__ENV.ACTUAL_CUSTOMER)) || 20)) + 1}@load-testing.com`
    password = __ENV.CUSTOMER_PASSWORD  || 'LoadTesting123'
  }else{
    email = 'customer-1@load-testing.com'
    password = 'LoadTesting123'
  }
  
  const loginRequest = {
    'email_or_phone': email,
    password,
    captcha: 'test'
  }

  const loginResponse = login(loginRequest);

  const loginBodyResponse = loginResponse.json();

  return loginBodyResponse.result.accessToken;
}

