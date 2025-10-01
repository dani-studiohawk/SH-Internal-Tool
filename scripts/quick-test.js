// Quick API test
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/clients',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ API Response:', JSON.parse(data));
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

req.end();