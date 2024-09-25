// auth/user

import http from 'k6/http';
import {check, fail} from 'k6';
import execution from "k6/execution";


export function login(body) {
    const loginResponse = http.post(__ENV.IDENTITY_URL ? `${__ENV.IDENTITY_URL}/auth/user` : 'http://localhost:3100/identity/v0/auth/user', JSON.stringify(body), {
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
      fail(`Failed to login ${body.email}`);
    };

    return loginResponse;
}

export function getAccessToken() {
  let email 
  let password 

  if(__ENV.DIFFERENCE_IDENTITY){
    email = `cms-${(execution.vu.idInInstance%((Number(__ENV.ACTUAL_IDENTITY)) || 5)) + 1}@load-testing.com`
    password = __ENV.IDENTITY_PASSWORD  || 'Vico12345'
  }else{
    email = 'cms-1@load-testing.com'
    password = 'Vico12345'
  }
  
  const loginRequest = {
    email,
    password,
    captcha: 'test'
  }

  const loginResponse = login(loginRequest);

  const loginBodyResponse = loginResponse.json();

  return loginBodyResponse.result.accessToken;
}

export function requestLinkUpload(file){
  // Retrieve access token
  const accessToken = getAccessToken();

  // let file
  // if(__ENV.DIFFERENCE_FILE){
  //   file = `cms-load_test-calon_nasabah-${(execution.vu.idInInstance%((Number(__ENV.ACTUAL_IDENTITY) - 1) || 19)) + 1}.xlsx`
  // }else{
  //   file = 'cms-load_test-calon_nasabah.xlsx'
  // }

  // API endpoint URL to be accessed
  const url = __ENV.IDENTITY_URL ? `${__ENV.IDENTITY_URL}/nasabah-prospect/generateUrlFile/${file}` : `http://localhost:3100/identity/v0/nasabah-prospect/generateUrlFile/${file}`;

  // Request headers with Authorization Bearer token
  const params = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // Send GET request
  const linkResponse = http.get(url, params);

  const checkLink = check(linkResponse, {
    'request link status must 200': (response) => response.status === 200
  });

  if (!checkLink) {
    fail(`Failed to get link upload file ${file}`);
  };

  return {
    linkResponse,
    accessToken
  };
}

