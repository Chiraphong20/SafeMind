/**
 * debug-oapp.cjs
 * 1) Login
 * 2) GET /oapp/hn/HN-RED-01 (check if oapp exists already)
 * 3) Try minimal POST to /oapp
 * 4) Try progressively more complex POST until 500 is found
 */

const http = require('http');
const HOST = '210.246.215.95', PORT = 8000;

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: HOST, port: PORT, path, method,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      }
    };
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, b: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, b: d }); } });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function login() {
  return new Promise((resolve, reject) => {
    const body = 'username=admin99&password=admin99';
    const opts = { hostname: HOST, port: PORT, path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } };
    const req = http.request(opts, res => { let d=''; res.on('data', c=>d+=c); res.on('end', () => { const j = JSON.parse(d); resolve(j.access_token); }); });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function main() {
  console.log('🔑 Login...');
  const token = await login();
  console.log('OK\n');

  // Test 1: GET existing oapp by HN
  const g = await api('GET', '/oapp/hn/HN-RED-01', null, token);
  console.log(`GET /oapp/hn/HN-RED-01 → HTTP ${g.s}`);
  console.log(JSON.stringify(g.b).slice(0, 300), '\n');

  // Test 2: Absolute minimum POST
  const p1 = await api('POST', '/oapp', { oapp_id: 800001, hn: 'HN-RED-01', vn: '20260106001001', vstdate: '2026-01-06', nextdate: '2026-04-07' }, token);
  console.log(`POST minimal → HTTP ${p1.s}`, JSON.stringify(p1.b).slice(0, 300));

  // Test 3: Try with doctor field removed (in case FK violation on doctor table)
  const p2 = await api('POST', '/oapp', { oapp_id: 800002, hn: 'HN-RED-01', vn: '20260106001002', vstdate: '2026-01-06', nextdate: '2026-04-07', clinic: '001', depcode: '001' }, token);
  console.log(`POST +clinic → HTTP ${p2.s}`, JSON.stringify(p2.b).slice(0, 300));

  // Test 4: Try oapp_id_guid format check (maybe UUID required)
  const p3 = await api('POST', '/oapp', {
    oapp_id: 800003, hn: 'HN-RED-01', vn: '20260106001003',
    vstdate: '2026-01-06', nextdate: '2026-04-07', clinic: '001',
    oapp_id_guid: '12345678-1234-1234-1234-123456789abc'
  }, token);
  console.log(`POST +uuid guid → HTTP ${p3.s}`, JSON.stringify(p3.b).slice(0, 300));
}

main().catch(console.error);
