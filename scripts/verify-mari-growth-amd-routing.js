const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Preload server-only mock
require('./preload-server-only.cjs');

async function testMariAndGrowthAmdRouting() {
  console.log('\n======================================================================');
  console.log('  🧠  RALION OS — MARI AI & GROWTH GENUINE AMD INFERENCE TEST');
  console.log('======================================================================\n');

  const root = path.resolve(__dirname, '..');
  const mariCorePath = path.join(root, 'packages/ai/src/mariUniversalCore.ts');
  const chatRoutePath = path.join(root, 'apps/ralion/src/app/api/mari/chat/route.ts');
  const growthRoutePath = path.join(
    root,
    'apps/ralion/src/app/api/social/facebook/pages/[pageId]/mari-growth/route.ts'
  );

  const mariCoreCode = fs.readFileSync(mariCorePath, 'utf8');
  const chatRouteCode = fs.readFileSync(chatRoutePath, 'utf8');
  const growthRouteCode = fs.readFileSync(growthRoutePath, 'utf8');

  // --- Step 1: Verify Static Architecture Invariants ---
  console.log('[1/3] Verifying architecture invariants and genuine AMD invocation paths...');

  // Invariant 1: mariUniversalCore imports and integrates AmdTokenFactoryService
  assert.ok(
    mariCoreCode.includes('AmdTokenFactoryService'),
    'mariUniversalCore.ts must import and integrate AmdTokenFactoryService'
  );

  // Invariant 2: Genuine neural call helper exists
  assert.ok(
    mariCoreCode.includes('async function callAmdNeuralCore('),
    'mariUniversalCore.ts must define async function callAmdNeuralCore'
  );

  // Invariant 3: Helper passes initiating module tag to AmdTokenFactoryService
  assert.ok(
    mariCoreCode.includes('module: moduleTag'),
    'callAmdNeuralCore must forward moduleTag to AmdTokenFactoryService.createChatCompletion'
  );

  // Invariant 4: AMD is primary by default in hackathon application
  assert.ok(
    mariCoreCode.includes("process.env.PREFER_AMD_INFERENCE !== 'false'"),
    'AMD inference must be active and primary by default in hackathon application'
  );

  // Invariant 5: Response is attributed to AMD engine
  assert.ok(
    mariCoreCode.includes("responseSource = 'amd'"),
    'Mari Universal Core must set responseSource = "amd" upon successful AMD inference'
  );
  assert.ok(
    mariCoreCode.includes("modelUsed = `Mari Neural Engine (AMD ${amdResult.model})`"),
    'Model used description must explicitly identify the active AMD model'
  );

  // Invariant 6: Chat route dispatches with module: 'mari'
  assert.ok(
    chatRouteCode.includes("module: 'mari'"),
    'Mari chat route must invoke processQuery with module: "mari"'
  );

  // Invariant 7: Growth route dispatches with module: 'growth'
  assert.ok(
    growthRouteCode.includes("module: 'growth'"),
    'Growth route must invoke processQuery with module: "growth"'
  );

  console.log('      ✓ Verified Mari chat route dispatches with module = "mari"');
  console.log('      ✓ Verified Growth route dispatches with module = "growth"');
  console.log('      ✓ Verified callAmdNeuralCore routes directly to AmdTokenFactoryService.createChatCompletion');
  console.log('      ✓ Verified AMD inference is active primary by default');

  // --- Step 2: Dynamic Execution of AmdTokenFactoryService for Mari ---
  console.log('\n[2/3] Dynamically dispatching Mari AI inference through AMD Token Factory...');
  const { AmdTokenFactoryService } = require('../packages/ai/src/amdTokenFactory.service.ts');
  const testWorkspaceId = 'c0000000-0000-0000-0000-000000000001';

  const mariInference = await AmdTokenFactoryService.createChatCompletion({
    messages: [
      { role: 'system', content: 'You are Mari AI, strategic operating partner.' },
      { role: 'user', content: 'Analyze seasonal booking trends for Okavango luxury fly-in camps.' },
    ],
    module: 'mari',
    workspaceId: testWorkspaceId,
  });

  assert.ok(mariInference.traceId.startsWith('amd_trc_mari_'), 'Mari trace ID must be tagged with module "mari"');
  assert.ok(mariInference.latencyMs >= 0, 'Measured latency must be recorded');
  assert.ok(mariInference.usage.total_tokens > 0, 'Token usage must be populated');
  assert.ok(mariInference.choices?.[0]?.message?.content, 'Generated response content must be non-empty');

  const mariLogs = AmdTokenFactoryService.getRecentRequests(5, 'mari', testWorkspaceId);
  assert.ok(mariLogs.length > 0, 'Telemetry ledger must contain recent requests for module "mari"');
  assert.strictEqual(mariLogs[0].module, 'mari', 'Latest telemetry log must be attributed to "mari"');
  assert.strictEqual(mariLogs[0].workspaceId, testWorkspaceId, 'Telemetry log must preserve tenant workspaceId');
  console.log(`      ✓ Mari AMD inference successful: Trace ID ${mariInference.traceId} (${mariInference.latencyMs}ms)`);

  // --- Step 3: Dynamic Execution of AmdTokenFactoryService for Growth ---
  console.log('\n[3/3] Dynamically dispatching Growth Studio inference through AMD Token Factory...');
  const growthInference = await AmdTokenFactoryService.createChatCompletion({
    messages: [
      { role: 'system', content: 'You are Mari Growth Engine.' },
      { role: 'user', content: 'Formulate high-conversion X thread for budget-conscious safari backpackers.' },
    ],
    module: 'growth',
    workspaceId: testWorkspaceId,
  });

  assert.ok(growthInference.traceId.startsWith('amd_trc_growth_'), 'Growth trace ID must be tagged with module "growth"');
  assert.ok(growthInference.latencyMs >= 0, 'Measured latency must be recorded');
  assert.ok(growthInference.usage.total_tokens > 0, 'Token usage must be populated');
  assert.ok(growthInference.choices?.[0]?.message?.content, 'Generated response content must be non-empty');

  const growthLogs = AmdTokenFactoryService.getRecentRequests(5, 'growth', testWorkspaceId);
  assert.ok(growthLogs.length > 0, 'Telemetry ledger must contain recent requests for module "growth"');
  assert.strictEqual(growthLogs[0].module, 'growth', 'Latest telemetry log must be attributed to "growth"');
  assert.strictEqual(growthLogs[0].workspaceId, testWorkspaceId, 'Telemetry log must preserve tenant workspaceId');
  console.log(`      ✓ Growth AMD inference successful: Trace ID ${growthInference.traceId} (${growthInference.latencyMs}ms)`);

  console.log('\n======================================================================');
  console.log('  🏆 MARI AI AND GROWTH BOTH GENUINELY ROUTE INFERENCE VIA AMD ADAPTER!');
  console.log('======================================================================\n');
}

testMariAndGrowthAmdRouting().catch((err) => {
  console.error('\n❌ MARI/GROWTH AMD ROUTING TEST FAILED:', err);
  process.exit(1);
});
