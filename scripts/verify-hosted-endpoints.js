/**
 * Ralion OS — AMD Developer Hackathon ACT III
 * Automated Hosted Endpoints Verification Suite
 *
 * Verifies that all judge-facing pages and API endpoints on the hosted
 * production Vercel deployment (https://ralionos.vercel.app) are responsive,
 * properly routed, and enforce authentication.
 */

const https = require('https');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function verifyHostedEndpoints() {
  console.log('======================================================================');
  console.log('  🌐  RALION OS — HOSTED PRODUCTION DEPLOYMENT SMOKE TEST');
  console.log('======================================================================\n');

  const checks = [
    { name: 'Root URL Redirect', url: 'https://ralionos.vercel.app/', expectedStatus: [200, 307, 308] },
    { name: 'Main Landing (/ralion)', url: 'https://ralionos.vercel.app/ralion', expectedStatus: [200] },
    { name: 'Direct Judge Access Redirect', url: 'https://ralionos.vercel.app/judge-access', expectedStatus: [200, 307, 308] },
    { name: 'Judge Access Page (/ralion/judge-access)', url: 'https://ralionos.vercel.app/ralion/judge-access', expectedStatus: [200] },
    { name: 'Dashboard View (/ralion/dashboard)', url: 'https://ralionos.vercel.app/ralion/dashboard', expectedStatus: [200] },
    { name: 'Mari AI Interface (/ralion/mari-ai)', url: 'https://ralionos.vercel.app/ralion/mari-ai', expectedStatus: [200] },
    { name: 'Growth Studio (/ralion/growth)', url: 'https://ralionos.vercel.app/ralion/growth', expectedStatus: [200] },
    { name: 'AMD Monitoring Centre (/ralion/amd-monitoring)', url: 'https://ralionos.vercel.app/ralion/amd-monitoring', expectedStatus: [200] },
    { name: 'Protected Reports Route Auth Guard', url: 'https://ralionos.vercel.app/ralion/api/reports/overview', expectedStatus: [401] },
    { name: 'Protected AMD Monitoring API Auth Guard', url: 'https://ralionos.vercel.app/ralion/api/ai/amd/monitoring', method: 'POST', body: JSON.stringify({ action: 'status' }), headers: { 'Content-Type': 'application/json' }, expectedStatus: [401] }
  ];

  let passed = 0;
  for (const check of checks) {
    try {
      const res = await request(check.url, { method: check.method || 'GET', headers: check.headers, body: check.body });
      if (check.expectedStatus.includes(res.status)) {
        console.log(`  ✅ [PASS] ${check.name} (${res.status})`);
        passed++;
      } else {
        console.error(`  ❌ [FAIL] ${check.name}: Expected ${check.expectedStatus.join('/')}, got ${res.status}`);
      }
    } catch (err) {
      console.error(`  ❌ [FAIL] ${check.name}: ${err.message}`);
    }
  }

  console.log(`\nResults: ${passed} of ${checks.length} hosted checks passed.`);
  if (passed !== checks.length) {
    process.exit(1);
  }
}

verifyHostedEndpoints().catch((err) => {
  console.error('Fatal error during hosted endpoint verification:', err);
  process.exit(1);
});
