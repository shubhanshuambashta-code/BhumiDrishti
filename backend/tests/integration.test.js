const http = require('http');
const path = require('path');

process.env.DATA_PATH = path.resolve(__dirname, '..', '..', 'data');

const express = require('express');
const cors = require('cors');
const routes = require('../src/routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const endpoints = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/projects' },
  { method: 'GET', path: '/api/statistics' },
  { method: 'GET', path: '/api/parcels?limit=5' },
  { method: 'GET', path: '/api/map-data?project_id=NH44' },
  { method: 'GET', path: '/api/decisions' },
  { method: 'POST', path: '/api/risk/calculate', body: { legal_risk: 8, ownership_risk: 7, compensation_risk: 9, environmental_risk: 4, social_risk: 5, delay_risk: 6 } },
  { method: 'POST', path: '/api/ml/predict', body: { legal_risk: 8, ownership_risk: 7, compensation_risk: 9, environmental_risk: 4, social_risk: 5, delay_risk: 6 } },
  { method: 'GET', path: '/api/ml/model-info' }
];

const server = app.listen(3003, async () => {
  console.log('--- BhumiDrishti Live Integration Tests ---');
  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const payload = ep.body ? JSON.stringify(ep.body) : null;
      const res = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3003,
          path: ep.path,
          method: ep.method,
          headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}
        }, (r) => {
          let data = '';
          r.on('data', chunk => data += chunk);
          r.on('end', () => resolve({ status: r.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
      });

      if (res.status === 200) {
        console.log(`  ✓ [${res.status}] ${ep.method} ${ep.path}`);
        passed++;
      } else {
        console.error(`  ✗ [${res.status}] ${ep.method} ${ep.path}: Unexpected status code`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✗ ${ep.method} ${ep.path}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  server.close(() => process.exit(failed > 0 ? 1 : 0));
});
