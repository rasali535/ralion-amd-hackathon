/**
 * Ralion OS — AMD Developer Hackathon ACT III
 * Adaptive Model Routing Engine Verification Suite
 *
 * Verifies:
 * 1. Deterministic linguistic classification across Scenarios A, B, C, D
 * 2. Task complexity mapping (LOW, MEDIUM, HIGH) and strategy resolution (SPEED, BALANCED, QUALITY)
 * 3. Dynamic candidate model filtering against live AMD catalog
 * 4. Transparent decision explanation and capability scoring
 * 5. Manual override vs autonomous adaptive routing
 * 6. Resilient execution and trace ledger attribution
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Preload server-only mock
require('./preload-server-only.cjs');

async function testAdaptiveModelRouting() {
  console.log('\n======================================================================');
  console.log('  🧭  RALION OS — ADAPTIVE MODEL ROUTING ENGINE VERIFICATION');
  console.log('======================================================================\n');

  const root = path.resolve(__dirname, '..');
  const routerPath = path.join(root, 'packages/ai/src/adaptiveModelRouter.service.ts');
  const serverPath = path.join(root, 'packages/ai/src/server.ts');
  const monitoringRoutePath = path.join(root, 'apps/ralion/src/app/api/ai/amd/monitoring/route.ts');
  const mariChatRoutePath = path.join(root, 'apps/ralion/src/app/api/mari/chat/route.ts');

  // --- Step 1: Architectural Invariants ---
  console.log('[1/5] Verifying architecture invariants and service exports...');
  assert.ok(fs.existsSync(routerPath), 'adaptiveModelRouter.service.ts must exist');

  const serverCode = fs.readFileSync(serverPath, 'utf8');
  assert.ok(
    serverCode.includes("export * from './adaptiveModelRouter.service'"),
    'server.ts must export AdaptiveModelRouter'
  );

  const monitoringCode = fs.readFileSync(monitoringRoutePath, 'utf8');
  assert.ok(
    monitoringCode.includes('AdaptiveModelRouter.decideRoute'),
    'Monitoring route must integrate AdaptiveModelRouter.decideRoute'
  );

  const mariChatCode = fs.readFileSync(mariChatRoutePath, 'utf8');
  assert.ok(
    mariChatCode.includes('AdaptiveModelRouter.executeWithAdaptiveRouting'),
    'Mari chat route must integrate AdaptiveModelRouter.executeWithAdaptiveRouting'
  );

  console.log('      ✓ Service exports and API route integrations verified');

  // --- Step 2: Linguistic Classification & Complexity Mapping ---
  console.log('\n[2/5] Testing deterministic classification across Botswana Safari scenarios...');
  const { AdaptiveModelRouter } = require('../packages/ai/src/adaptiveModelRouter.service.ts');

  // Scenario A: Social Media Caption (Quick, Low Complexity)
  const scenarioA = 'Write a concise Instagram caption highlighting a leopard sighting at dusk in the Okavango Delta.';
  const classA = AdaptiveModelRouter.classifyEnquiry(scenarioA);
  console.log(`      Scenario A -> Classification: ${classA.classification}, Complexity: ${classA.complexity}`);
  assert.strictEqual(classA.classification, 'SOCIAL_MEDIA_CAPTION', 'Scenario A must classify as SOCIAL_MEDIA_CAPTION');
  assert.strictEqual(classA.complexity, 'LOW', 'Scenario A must be LOW complexity');

  // Scenario B: Comparative Audience Analysis (High Complexity, Quality/Reasoning)
  const scenarioB = 'Compare the booking behavior, price sensitivity, and seasonal lead times between European high-net-worth safari travellers and North American adventure backpackers in Botswana.';
  const classB = AdaptiveModelRouter.classifyEnquiry(scenarioB);
  console.log(`      Scenario B -> Classification: ${classB.classification}, Complexity: ${classB.complexity}`);
  assert.strictEqual(classB.classification, 'COMPARATIVE_REASONING', 'Scenario B must classify as COMPARATIVE_REASONING');
  assert.ok(classB.complexity === 'MEDIUM' || classB.complexity === 'HIGH', 'Scenario B must be MEDIUM or HIGH complexity');

  // Scenario C: Multi-channel Strategic Campaign (High Complexity, Planning)
  const scenarioC = 'Formulate a multi-channel Q3 marketing strategy to launch the luxury private concession sanctuary, including budget allocation, tone of voice, influencer partnerships, and conversion funnels.';
  const classC = AdaptiveModelRouter.classifyEnquiry(scenarioC);
  console.log(`      Scenario C -> Classification: ${classC.classification}, Complexity: ${classC.complexity}`);
  assert.ok(
    classC.classification === 'COMPLEX_PLANNING' || classC.classification === 'MARKETING_STRATEGY',
    'Scenario C must classify as COMPLEX_PLANNING or MARKETING_STRATEGY'
  );
  assert.strictEqual(classC.complexity, 'HIGH', 'Scenario C must be HIGH complexity');

  // Scenario D: Budget Optimization (High/Medium Complexity, Optimization/Analysis)
  const scenarioD = 'We have a $15,000 monthly ad spend split 60/40 between Meta and Google Ads. Customer acquisition cost on Meta is $420 with 8% conversion, while Google Ads CAC is $610 with 4% conversion. Optimize the allocation to maximize luxury safari leads.';
  const classD = AdaptiveModelRouter.classifyEnquiry(scenarioD);
  console.log(`      Scenario D -> Classification: ${classD.classification}, Complexity: ${classD.complexity}`);
  assert.ok(
    classD.classification === 'CAMPAIGN_OPTIMIZATION' || classD.classification === 'BUSINESS_ANALYSIS',
    'Scenario D must classify as CAMPAIGN_OPTIMIZATION or BUSINESS_ANALYSIS'
  );

  console.log('      ✓ All four test scenarios classified accurately with deterministic rules');

  // --- Step 3: Adaptive Route Decision & Strategy Resolution ---
  console.log('\n[3/5] Evaluating autonomous routing decisions & transparent rationale...');
  const testWorkspaceId = 'c0000000-0000-0000-0000-000000000001';

  const decisionA = await AdaptiveModelRouter.decideRoute({
    prompt: scenarioA,
    module: 'growth',
    workspaceId: testWorkspaceId,
  });

  assert.strictEqual(decisionA.isManualOverride, false, 'Decision A must not be a manual override');
  assert.strictEqual(decisionA.strategy, 'SPEED', 'Scenario A must resolve to SPEED strategy');
  assert.ok(decisionA.selectedModel, 'A valid AMD model must be selected');
  assert.ok(decisionA.candidateModels.length > 0, 'Candidate models list must not be empty');
  assert.ok(decisionA.routingReason.includes('SPEED') || decisionA.routingReason.includes('speed') || decisionA.routingReason.includes('Selected'), 'Routing reason must explain rationale');
  console.log(`      ✓ Scenario A Route: ${decisionA.selectedModel} (${decisionA.strategy}) — "${decisionA.routingReason}"`);

  const decisionB = await AdaptiveModelRouter.decideRoute({
    prompt: scenarioB,
    module: 'mari',
    workspaceId: testWorkspaceId,
  });

  assert.strictEqual(decisionB.isManualOverride, false, 'Decision B must not be a manual override');
  assert.strictEqual(decisionB.strategy, 'QUALITY', 'Scenario B must resolve to QUALITY strategy');
  assert.ok(decisionB.selectedModel, 'A valid AMD model must be selected');
  console.log(`      ✓ Scenario B Route: ${decisionB.selectedModel} (${decisionB.strategy}) — "${decisionB.routingReason}"`);

  // --- Step 4: Manual Override Testing ---
  console.log('\n[4/5] Testing operator manual model override fidelity...');
  const overrideModel = decisionA.candidateModels[0];
  const overrideDecision = await AdaptiveModelRouter.decideRoute({
    prompt: scenarioA,
    module: 'monitoring_test',
    workspaceId: testWorkspaceId,
    preferredModel: overrideModel,
  });

  assert.strictEqual(overrideDecision.isManualOverride, true, 'isManualOverride must be true when preferredModel is supplied');
  assert.strictEqual(overrideDecision.selectedModel, overrideModel, 'selectedModel must strictly match preferredModel');
  assert.ok(overrideDecision.routingReason.includes('Manual operator override'), 'Routing reason must declare manual override');
  console.log(`      ✓ Manual override to "${overrideModel}" respected with transparent operator attribution`);

  // --- Step 5: Execution via Adaptive Routing & Telemetry ---
  console.log('\n[5/5] Executing inference through Adaptive Model Router...');
  const executionResult = await AdaptiveModelRouter.executeWithAdaptiveRouting({
    prompt: 'Provide a 1-sentence luxury safari soundbite for Botswana dawn.',
    module: 'mari',
    workspaceId: testWorkspaceId,
  });

  assert.ok(executionResult.choices?.[0]?.message?.content, 'Execution result must contain generated content');
  assert.ok(executionResult.routingDecision, 'Execution result must include routingDecision metadata');
  assert.ok(executionResult.traceId.startsWith('amd_trc_mari_'), 'Execution trace ID must reflect module "mari"');
  assert.ok(executionResult.usage.total_tokens > 0, 'Token usage must be tracked');
  console.log(`      ✓ Execution succeeded: Model ${executionResult.model}, Trace ID ${executionResult.traceId}`);
  console.log(`      ✓ Routing metadata attached: Strategy ${executionResult.routingDecision.strategy}, Classification ${executionResult.routingDecision.classification}`);

  console.log('\n======================================================================');
  console.log('  🏆 ALL ADAPTIVE MODEL ROUTING ENGINE TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================================\n');
}

testAdaptiveModelRouting().catch((err) => {
  console.error('\n❌ ADAPTIVE MODEL ROUTING VERIFICATION FAILED:', err);
  process.exit(1);
});
