#!/usr/bin/env node

/**
 * Ralion OS — AMD Inference Connectivity & Verification Test
 * AMD Developer Hackathon ACT III
 *
 * Verifies:
 * 1. AMD Token Factory connectivity and model resolution via GET /models
 * 2. Real inference request dispatch via POST /chat/completions
 * 3. Response verification (structure, choices, content)
 * 4. Latency measurement (end-to-end response time)
 * 5. Token accounting (prompt_tokens, completion_tokens, total_tokens)
 * 6. Explicit classification of LIVE vs FIXTURE vs FAILED status
 * 7. Invariant: Fixture responses NEVER count as successful live AMD inference
 */

const assert = require('assert');
const path = require('path');

// Mock server-only for CLI verification script execution
require.cache[require.resolve('server-only')] = { exports: {} };

const { AmdTokenFactoryService } = require('../packages/ai/src/amdTokenFactory.service.ts');

async function main() {
  console.log('\n======================================================================');
  console.log('  ⚡ RALION OS — AMD INFERENCE CONNECTIVITY & STATUS TEST');
  console.log('======================================================================\n');

  const apiKey = process.env.RADEON_API_KEY;
  const baseUrl = process.env.AMD_TOKEN_FACTORY_URL || 'https://developer.amd.com.cn/radeon/api/v1';

  console.log(`Endpoint:   ${baseUrl}`);
  console.log(`API Key:    ${apiKey ? 'Configured (Server-Side Secret)' : 'Not set (Demonstration Fixture Mode)'}`);

  // Step 1: Health & Connection Inspection (GET /models)
  console.log('\n[1/3] Checking AMD Token Factory Models & Connection...');
  const connectionHealth = await AmdTokenFactoryService.checkConnectionStatus();
  console.log(`      Connection Status: ${connectionHealth.status}`);
  console.log(`      Active Model:      ${connectionHealth.selectedModel}`);
  console.log(`      Available Models:  ${connectionHealth.models.join(', ')}`);
  console.log(`      Probe Latency:     ${connectionHealth.latencyMs}ms`);

  // Step 2: Inference Dispatch (POST /chat/completions)
  console.log('\n[2/3] Dispatching Inference Test Request...');
  const testPrompt = 'Briefly outline the executive value of AMD ROCm accelerated infrastructure for automated enterprise marketing workflows.';
  
  let result;
  let executionStatus = 'FAILED';

  try {
    result = await AmdTokenFactoryService.createChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are the AMD AI engine powering Ralion OS marketing intelligence.',
        },
        {
          role: 'user',
          content: testPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 256,
      module: 'monitoring_test',
    });

    if (result.isRealAmdInference === true && result.status === 'LIVE') {
      executionStatus = 'LIVE';
    } else if (result.isFixture === true || result.status === 'SIMULATED') {
      executionStatus = 'FIXTURE';
    } else {
      executionStatus = 'FAILED';
    }
  } catch (err) {
    console.error(`\n❌ Inference request failed with error: ${err.message}`);
    executionStatus = 'FAILED';
    throw err;
  }

  // Step 3: Response Verification & Token Metrics
  console.log('\n[3/3] Verifying Response Structure & Telemetry Metrics...');
  assert.ok(result, 'Inference response must exist');
  assert.ok(result.id, 'Response must include an ID');
  assert.ok(Array.isArray(result.choices) && result.choices.length > 0, 'Response choices must be a non-empty array');
  
  const choice = result.choices[0];
  assert.ok(choice.message && typeof choice.message.content === 'string', 'Choice must contain message text');
  assert.ok(choice.message.content.length > 10, 'Message content must not be empty');

  // Verify Latency & Tokens
  assert.ok(typeof result.latencyMs === 'number' && result.latencyMs >= 0, 'Measured latencyMs must be non-negative');
  assert.ok(result.usage, 'Token usage accounting object must be present');
  assert.ok(typeof result.usage.prompt_tokens === 'number', 'prompt_tokens must be numeric');
  assert.ok(typeof result.usage.completion_tokens === 'number', 'completion_tokens must be numeric');
  assert.ok(typeof result.usage.total_tokens === 'number', 'total_tokens must be numeric');
  assert.strictEqual(
    result.usage.total_tokens,
    result.usage.prompt_tokens + result.usage.completion_tokens,
    'total_tokens must equal prompt_tokens + completion_tokens'
  );

  // Strict Rule 4: Fixture responses NEVER count as successful live AMD inference
  if (executionStatus === 'FIXTURE') {
    assert.strictEqual(
      result.isRealAmdInference,
      false,
      'CRITICAL INVARIANT: Fixture responses must NEVER set isRealAmdInference to true'
    );
    assert.strictEqual(
      result.isFixture,
      true,
      'Fixture responses must be explicitly flagged with isFixture: true'
    );
    assert.ok(result.fixtureNotice, 'Fixture responses must include explicit fixtureNotice');
  } else if (executionStatus === 'LIVE') {
    assert.strictEqual(
      result.isRealAmdInference,
      true,
      'Live responses must set isRealAmdInference to true'
    );
    assert.strictEqual(
      result.isFixture,
      false,
      'Live responses must not be flagged as fixture'
    );
  }

  console.log('\n======================================================================');
  console.log('  📊 AMD INFERENCE TELEMETRY REPORT');
  console.log('======================================================================');
  console.log(`  Explicit Status:   [ ${executionStatus} ]`);
  console.log(`  Model ID:          ${result.model}`);
  console.log(`  Latency:           ${result.latencyMs}ms`);
  console.log(`  Prompt Tokens:     ${result.usage.prompt_tokens}`);
  console.log(`  Completion Tokens: ${result.usage.completion_tokens}`);
  console.log(`  Total Tokens:      ${result.usage.total_tokens}`);
  console.log(`  Trace ID:          ${result.traceId}`);
  console.log(`  Real AMD Live:     ${result.isRealAmdInference ? 'YES' : 'NO'}`);
  console.log(`  Fixture Notice:    ${result.fixtureNotice || 'None (Live inference verified)'}`);
  console.log('----------------------------------------------------------------------');
  console.log(`  Response Content Preview:`);
  console.log(`  "${choice.message.content.slice(0, 150).replace(/\n/g, ' ')}..."`);
  console.log('======================================================================\n');

  if (executionStatus === 'LIVE') {
    console.log('✅ LIVE AMD INFERENCE CONNECTIVITY TEST PASSED.\n');
  } else if (executionStatus === 'FIXTURE') {
    console.log('ℹ️  AMD CONNECTIVITY EXECUTED IN DEMONSTRATION FIXTURE MODE.');
    console.log('   (Fixture response correctly disqualified from counting as live AMD inference)\n');
  }

  return { executionStatus, result };
}

main().catch((err) => {
  console.error('\n❌ AMD INFERENCE CONNECTIVITY TEST FAILED:', err);
  process.exit(1);
});
