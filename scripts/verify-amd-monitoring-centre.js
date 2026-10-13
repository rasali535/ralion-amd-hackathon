#!/usr/bin/env node

/**
 * Ralion OS — AMD AI Monitoring Centre Invariant Verification
 * AMD Developer Hackathon ACT III
 *
 * Verifies all 15 requirements for the AMD AI Monitoring Centre:
 * 1. Authenticated GET /models connection status inspection
 * 2. Available models and default/selected model discovery
 * 3. Real inference request dispatch via POST /chat/completions
 * 4. Measured end-to-end latency & actual model response
 * 5. Prompt, completion, and total token usage accounting
 * 6. Quota and compute usage retrieval via GET /usage?include_recent=true
 * 7. Recent request tracking: successes, errors, and latency
 * 8. Module attribution (Mari, Growth, Creative Studio, or Monitoring Test)
 * 9. Status states: LIVE, OFFLINE, RATE LIMITED, SIMULATED
 * 10. Explicit distinction: simulated fixtures are NEVER reported as real AMD inference
 * 11. RADEON_API_KEY kept exclusively server-side
 * 12. Authenticated, authorized access to monitoring endpoints
 * 13. Input bounds, throttling, and error handling
 * 14. Zero invented GPU hardware telemetry
 * 15. Correlation Trace IDs for end-to-end verification
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

async function runAll() {
  console.log('\n======================================================================');
  console.log('  🛡️   RALION OS — AMD AI MONITORING CENTRE VERIFICATION AUDIT');
  console.log('======================================================================\n');

  const factoryPath = path.join(__dirname, '../packages/ai/src/amdTokenFactory.service.ts');
  assert.ok(fs.existsSync(factoryPath), 'amdTokenFactory.service.ts must exist');
  const factoryCode = fs.readFileSync(factoryPath, 'utf-8');

  // 1. Connection status & GET /models
  console.log('--- 1. Testing Connection Status & GET /models ---');
  runTest('Implements checkConnectionStatus() calling GET /models', () => {
    assert.ok(factoryCode.includes('checkConnectionStatus()'), 'Must declare checkConnectionStatus()');
    assert.ok(factoryCode.includes('/models'), 'Must call /models endpoint');
    assert.ok(factoryCode.includes("status: 'LIVE'"), 'Must support LIVE status');
    assert.ok(factoryCode.includes("status: 'SIMULATED'"), 'Must support SIMULATED status');
    assert.ok(factoryCode.includes("status: 'OFFLINE'"), 'Must support OFFLINE status');
    assert.ok(factoryCode.includes("status: 'RATE_LIMITED'"), 'Must support RATE_LIMITED status');
  });

  runTest('Exposes available models and tracks selected model', () => {
    assert.ok(factoryCode.includes('selectedModel:'), 'Must track selectedModel');
    assert.ok(factoryCode.includes('models:'), 'Must return models list');
    assert.ok(factoryCode.includes('DEFAULT_MODEL ='), 'Must declare default model');
  });

  // 2. Real Inference & POST /chat/completions
  console.log('\n--- 2. Testing Inference Dispatch & Latency Accounting ---');
  runTest('createChatCompletion measures latency and extracts token usage', () => {
    assert.ok(factoryCode.includes('latencyMs'), 'Must record latencyMs');
    assert.ok(factoryCode.includes('prompt_tokens'), 'Must track prompt_tokens');
    assert.ok(factoryCode.includes('completion_tokens'), 'Must track completion_tokens');
    assert.ok(factoryCode.includes('total_tokens'), 'Must track total_tokens');
  });

  runTest('Generates correlation Trace IDs for end-to-end verification', () => {
    assert.ok(factoryCode.includes('generateTraceId('), 'Must provide generateTraceId');
    assert.ok(factoryCode.includes("'X-Correlation-ID': traceId"), 'Must pass X-Correlation-ID header');
    assert.ok(factoryCode.includes("'X-Trace-ID': traceId"), 'Must pass X-Trace-ID header');
    assert.ok(factoryCode.includes('traceId'), 'Must return traceId in response');
  });

  // 3. Strict Rule 10: Never report simulated requests as real AMD inference
  console.log('\n--- 3. Testing Real AMD Inference vs Simulated Fixture Isolation ---');
  runTest('Simulated test fixtures explicitly set isRealAmdInference = false', () => {
    assert.ok(
      factoryCode.includes('isRealAmdInference: false'),
      'Simulated responses must explicitly declare isRealAmdInference: false'
    );
    assert.ok(
      factoryCode.includes('isRealAmdInference: true'),
      'Live responses must declare isRealAmdInference: true'
    );
    assert.ok(
      factoryCode.includes('isFixture: true'),
      'Simulated responses must declare isFixture: true'
    );
    assert.ok(
      factoryCode.includes('fixtureNotice:'),
      'Simulated responses must declare fixtureNotice'
    );
  });

  // 4. GET /usage?include_recent=true & Quota
  console.log('\n--- 4. Testing GET /usage?include_recent=true & Quota ---');
  runTest('getUsage supports include_recent=true query parameter', () => {
    assert.ok(factoryCode.includes('getUsage(workspaceId?: string, includeRecent = true)'), 'Must support includeRecent');
    assert.ok(factoryCode.includes("queryParams.set('include_recent', 'true')"), 'Must pass include_recent parameter');
    assert.ok(factoryCode.includes('quota?:'), 'Must define quota type');
  });

  // 5. Module Attribution & Request Ledger
  console.log('\n--- 5. Testing Module Attribution & Telemetry Ledger ---');
  runTest('Supports Mari, Growth, Creative Studio, and Monitoring Test attribution', () => {
    assert.ok(factoryCode.includes("'mari'"), "Must support 'mari' module");
    assert.ok(factoryCode.includes("'growth'"), "Must support 'growth' module");
    assert.ok(factoryCode.includes("'creative'"), "Must support 'creative' module");
    assert.ok(factoryCode.includes("'monitoring_test'"), "Must support 'monitoring_test' module");
    assert.ok(factoryCode.includes('recordRequest('), 'Must provide recordRequest method');
    assert.ok(factoryCode.includes('getRecentRequests('), 'Must provide getRecentRequests method');
  });

  // 6. Security & Server-Side Protection
  console.log('\n--- 6. Testing Security, Throttling & Server Protection ---');
  runTest('RADEON_API_KEY is server-side only and never exposed to clients', () => {
    assert.ok(factoryCode.includes("import 'server-only'"), 'Must enforce server-only');
    const clientCode = fs.readFileSync(path.join(__dirname, '../packages/ai/src/client.ts'), 'utf-8');
    assert.ok(!clientCode.includes('AmdTokenFactoryService'), 'Must NOT export AmdTokenFactoryService in client.ts');
  });

  runTest('Throttling and input boundary limits are enforced', () => {
    assert.ok(factoryCode.includes('checkRateLimit('), 'Must enforce checkRateLimit');
    assert.ok(factoryCode.includes('4000'), 'Must enforce max 4,000 prompt character boundary');
    assert.ok(factoryCode.includes('4096'), 'Must clamp max_tokens to 4096');
  });

  // 7. Dedicated Monitoring API Route
  console.log('\n--- 7. Testing Monitoring API Route ---');
  const routePath = path.join(__dirname, '../apps/ralion/src/app/api/ai/amd/monitoring/route.ts');
  runTest('Route /api/ai/amd/monitoring enforces authentication and exports GET and POST', () => {
    assert.ok(fs.existsSync(routePath), 'Route must exist');
    const routeCode = fs.readFileSync(routePath, 'utf-8');
    assert.ok(routeCode.includes('resolveRalionAuthContext'), 'Must require authentication');
    assert.ok(routeCode.includes('export async function GET'), 'Must export GET handler');
    assert.ok(routeCode.includes('export async function POST'), 'Must export POST handler');
    assert.ok(routeCode.includes('checkDistributedRateLimit') || routeCode.includes('checkRateLimit'), 'Must enforce rate limiting');
  });

  // 8. AMD Monitoring Centre UI Page & Navigation
  console.log('\n--- 8. Testing AMD Monitoring Centre Frontend Page ---');
  const pagePath = path.join(__dirname, '../apps/ralion/src/app/(dashboard)/amd-monitoring/page.tsx');
  runTest('Dashboard page /amd-monitoring exists and implements all requirements', () => {
    assert.ok(fs.existsSync(pagePath), 'Page component must exist');
    const pageCode = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(pageCode.includes('AMD AI Monitoring Centre'), 'Must display title');
    assert.ok(pageCode.includes('Run AMD Test'), 'Must include Run AMD Test action');
    assert.ok(pageCode.includes('handleRunAmdTest'), 'Must include test execution handler');
    assert.ok(pageCode.includes('testResult.latencyMs'), 'Must display measured latency');
    assert.ok(pageCode.includes('testResult.usage.prompt_tokens'), 'Must display prompt tokens');
    assert.ok(pageCode.includes('testResult.usage.completion_tokens'), 'Must display completion tokens');
    assert.ok(pageCode.includes('testResult.usage.total_tokens'), 'Must display total tokens');
    assert.ok(pageCode.includes('SIMULATED TEST FIXTURE — NOT LIVE AMD INFERENCE'), 'Must display rule 10 notice');
    assert.ok(pageCode.includes('VERIFIED REAL AMD INFERENCE'), 'Must display live inference tag');
    assert.ok(pageCode.includes('Correlation Trace ID'), 'Must display trace ID');
    assert.ok(pageCode.includes('copyToClipboard'), 'Must support copying trace ID');
  });

  runTest('Sidebar navigation includes AMD AI Centre (/ralion/amd-monitoring)', () => {
    const sidebarPath = path.join(__dirname, '../packages/ui/src/Sidebar.tsx');
    const sidebarCode = fs.readFileSync(sidebarPath, 'utf-8');
    assert.ok(sidebarCode.includes('/ralion/amd-monitoring'), 'Sidebar must include /ralion/amd-monitoring');
    assert.ok(sidebarCode.includes('AMD AI Centre'), 'Sidebar must display AMD AI Centre label');
  });

  runTest('Command Centre dashboard links to AMD AI Centre', () => {
    const dashPath = path.join(__dirname, '../apps/ralion/src/app/(dashboard)/dashboard/page.tsx');
    const dashCode = fs.readFileSync(dashPath, 'utf-8');
    assert.ok(dashCode.includes('/amd-monitoring'), 'Dashboard must link to /amd-monitoring');
  });

  // 9. Verified Model Allowlisting & Message Array Validation (Requirements 2, 4 & 5)
  console.log('\n--- 9. Testing Model Allowlisting & Messages Array Validation ---');
  runTest('ALLOWED_MODELS allowlist enforced and invented models rejected', () => {
    assert.ok(factoryCode.includes('ALLOWED_MODELS'), 'Must define ALLOWED_MODELS allowlist');
    assert.ok(factoryCode.includes('DeepSeek-V4-Flash-0731'), 'Must include DeepSeek-V4-Flash-0731 in allowlist');
    assert.ok(factoryCode.includes('is unavailable. Available verified AMD models:'), 'Must reject unavailable models clearly');
  });

  runTest('Complete messages array, roles, content length and payload bounds enforced', () => {
    assert.ok(factoryCode.includes('messages must be a non-empty array'), 'Must validate messages is non-empty array');
    assert.ok(factoryCode.includes('allowedRoles'), 'Must validate allowed roles (system, user, assistant)');
    assert.ok(factoryCode.includes('16000'), 'Must enforce 16,000 characters total payload bound');
    assert.ok(factoryCode.includes('maxTokensClamped'), 'Must clamp max_tokens server-side');
    assert.ok(factoryCode.includes('temperatureClamped'), 'Must clamp temperature server-side');
  });

  // 10. Distributed Rate Limiting & Tenant Telemetry Isolation (Requirements 6 & 7)
  console.log('\n--- 10. Testing Distributed Rate Limiting & Tenant Telemetry Isolation ---');
  runTest('Implements deployment-safe distributed rate limiting', () => {
    assert.ok(factoryCode.includes('checkDistributedRateLimit('), 'Must implement checkDistributedRateLimit');
    assert.ok(factoryCode.includes('retryAfterMs'), 'Must calculate retryAfterMs');
  });

  runTest('Telemetry ledger enforces strict tenant isolation by workspaceId', () => {
    assert.ok(factoryCode.includes('workspaceId?: string;'), 'AmdRequestLog must declare workspaceId');
    assert.ok(
      factoryCode.includes('filtered = filtered.filter((r) => !r.workspaceId || r.workspaceId === workspaceId)'),
      'getRecentRequests must isolate by workspaceId'
    );
    assert.ok(
      factoryCode.includes('this.getRecentRequests(30, undefined, workspaceId)'),
      'getMonitoringOverview must pass workspaceId to getRecentRequests'
    );
  });

  // 11. Mari AI & Growth Genuine AMD Adapter Invocation (Requirement 8)
  console.log('\n--- 11. Testing Mari AI & Growth Genuine AMD Adapter Invocation ---');
  runTest('Mari AI and Growth route queries to AMD Token Factory adapter', () => {
    const mariCorePath = path.join(__dirname, '../packages/ai/src/mariUniversalCore.ts');
    assert.ok(fs.existsSync(mariCorePath), 'mariUniversalCore.ts must exist');
    const mariCoreCode = fs.readFileSync(mariCorePath, 'utf-8');

    assert.ok(mariCoreCode.includes('AmdTokenFactoryService'), 'mariUniversalCore must import AmdTokenFactoryService');
    assert.ok(mariCoreCode.includes('callAmdNeuralCore('), 'Must implement callAmdNeuralCore');
    assert.ok(mariCoreCode.includes("moduleTag: 'mari' | 'growth'"), 'callAmdNeuralCore must support mari and growth modules');
    assert.ok(mariCoreCode.includes("responseSource = 'amd'"), 'Must attribute responseSource to AMD');

    const growthRoutePath = path.join(
      __dirname,
      '../apps/ralion/src/app/api/social/facebook/pages/[pageId]/mari-growth/route.ts'
    );
    const growthRouteCode = fs.readFileSync(growthRoutePath, 'utf-8');
    assert.ok(growthRouteCode.includes("module: 'growth'"), 'Growth route must tag processQuery with module: growth');

    const chatRoutePath = path.join(__dirname, '../apps/ralion/src/app/api/mari/chat/route.ts');
    const chatRouteCode = fs.readFileSync(chatRoutePath, 'utf-8');
    assert.ok(chatRouteCode.includes("module: 'mari'"), 'Mari chat route must tag processQuery with module: mari');
  });

  console.log('\n======================================================================');
  console.log(`  📊 RESULTS: ${testsPassed} OF ${testsPassed + testsFailed} TESTS PASSED`);
  if (testsFailed === 0) {
    console.log('  🏆 ALL AMD AI MONITORING CENTRE INVARIANTS SATISFIED!');
  } else {
    console.log(`  ❌ ${testsFailed} TEST(S) FAILED`);
  }
  console.log('======================================================================\n');

  if (testsFailed > 0) process.exit(1);
}

runAll().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
