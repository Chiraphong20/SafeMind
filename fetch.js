const https = require('http');

const options = {
  hostname: '210.246.215.95',
  port: 8000,
  path: '/oapp?skip=0&limit=5',
  method: 'GET',
  headers: {
    'accept': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjk5IiwiaWF0IjoxNzc0MzQ0MTE5LCJleHAiOjE3NzQzNDU5MTl9.mdAy9dZMdmGbvmxFc___Y3P_lVSL8U_3z5T-20It9GI'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
