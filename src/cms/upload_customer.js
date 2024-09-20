import http from 'k6/http';
import { sleep, check, fail } from 'k6';
import { requestLinkUpload } from '../helpers/cms.js';

// Define an array of file names and pre-load their content
const files = ['cms-load_test-calon_nasabah.xlsx'];  // Add more file names
const fileContents = files.map((file) => open(`./files/${file}`, 'b'));  // Load file content in binary mode

export const options = {
  stages: [
    { duration: '1s', target: 1 },  // Ramp-up to 1 VU
  ],
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(90)<2000'],
    http_req_receiving: ['max<17000'],
  },
};

// The function that defines VU logic
export default function () {
  // Choose a random file from the list
  const randomIndex = Math.floor(Math.random() * files.length);
  const randomFile = files[randomIndex];
  const fileContent = fileContents[randomIndex];  // Get the preloaded content of the file
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
  console.log('postResponse: ', postResponse)
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
