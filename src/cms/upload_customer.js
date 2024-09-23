import http from 'k6/http';
import { sleep, check, fail } from 'k6';
import { requestLinkUpload } from '../helpers/cms.js';
import execution from "k6/execution";

// Define an array of file names and pre-load their content
const files = [
  `MOCK_DATA_${__ENV.TOTAL_DATA_NASABAH || 200}_1.xlsx`,
  `MOCK_DATA_${__ENV.TOTAL_DATA_NASABAH || 200}_2.xlsx`,
  `MOCK_DATA_${__ENV.TOTAL_DATA_NASABAH || 200}_3.xlsx`,
  `MOCK_DATA_${__ENV.TOTAL_DATA_NASABAH || 200}_4.xlsx`,
  `MOCK_DATA_${__ENV.TOTAL_DATA_NASABAH || 200}_5.xlsx`,
];  // Add more file names
const fileContents = files.map((file) => open(`./files/${file}`, 'b'));  // Load file content in binary mode

export const options = {
  stages: [
    { duration: '2s', target: 5 },  // Ramp-up to 1 VU
    { duration: '2s', target: 5 },  // Ramp-up to 1 VU
  ],
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(90)<2000'],
    http_req_receiving: ['max<17000'],
  },
};

// The function that defines VU logic
export default function () {
  // // Choose a random file from the list
  // const randomIndex = Math.floor(Math.random() * files.length);
  // const randomFile = files[randomIndex];
  // const fileContent = fileContents[randomIndex];  // Get the preloaded content of the file

  //static file open
  console.log('cekcekcek: ', execution.vu.idInInstance)
  const randomFile = files[`${(execution.vu.idInInstance%((Number(__ENV.ACTUAL_IDENTITY)) || 5))}`]
  const fileContent = fileContents[`${(execution.vu.idInInstance%((Number(__ENV.ACTUAL_IDENTITY)) || 5))}`]
  // console.log('randomFile: ', randomFile);

  // Request presigned URL for file upload
  const { linkResponse, accessToken } = requestLinkUpload(randomFile);
  const linkBodyResponse = linkResponse.json();
  const url = linkBodyResponse.result.url;

  // Perform the file upload to the presigned URL using PUT method
  const uploadParams = {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // MIME type for .xlsx files
    },
  };

  const uploadResponse = http.put(url, fileContent, uploadParams);

  // Check if the file upload was successful
  const checkUpload = check(uploadResponse, {
    'file upload response status must be 200 or 204': (res) => res.status === 200 || res.status === 204,
  });

  if (!checkUpload) {
    fail(`Failed to upload file ${randomFile}`);
  }

  // Extract `generated_name` from the presigned URL
  const urlWithoutParams = url.split('?')[0];  // Remove query parameters
  const generatedName = urlWithoutParams.substring(urlWithoutParams.lastIndexOf('/') + 1);  // Extract the last part of the URL

  // Define the request body for the POST request
  console.log('randomFilerandomFile: ', randomFile)
  const requestBody = {
    original_name: randomFile,
    generated_name: `file/${generatedName}`,
  };

  // POST the file metadata to the server
  const postUrl = __ENV.IDENTITY_URL ? `${__ENV.IDENTITY_URL}/nasabah-prospect/insertUrlFile` : 'http://localhost:3100/identity/v0/nasabah-prospect/insertUrlFile';

  const postResponse = http.post(postUrl, JSON.stringify(requestBody), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  console.log('postResponse2: ', postResponse.json())
  // Check if the POST request was successful
  const checkPost = check(postResponse, {
    'POST response status must be 201': (res) => res.status === 201,
  });

  if (!checkPost) {
    fail(`Failed to insert file metadata for ${randomFile}`);
  }

  // Simulate a 1-second delay between requests
  sleep(1);
}
