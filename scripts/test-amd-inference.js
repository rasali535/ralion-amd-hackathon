#!/usr/bin/env node

/**
 * Ralion OS — AMD ROCm / vLLM Inference Service Verification
 * AMD Developer Hackathon ACT III
 *
 * Verifies that the AMD ROCm inference adapter:
 * 1. Exports properly from packages/ai/src/amdInference.service.ts
 * 2. Provides valid health check and hardware discovery
 * 3. Dispatches inference requests with accurate metrics (TTFT, tokens/sec, hardware provenance)
 * 4. Gracefully executes in local/simulated fallback mode when GPU cluster is offline
 */

const assert = require('assert');
const path = require('path');

async function run() {
  console.log('\n--- VERIFYING AMD ROCm / vLLM INFERENCE SERVICE ---');

  // Dynamically import compiled or source TypeScript service
  const { AmdInferenceService } = require('../packages/ai/src/amdInference.service.ts');
  assert(AmdInferenceService, 'AmdInferenceService must be exported');

  // Test 1: Health check & hardware inspection
  console.log('1. Checking AMD ROCm cluster health & hardware discovery...');
  const health = await AmdInferenceService.checkHealth();
  assert(health, 'Health status object must be returned');
  assert(['online', 'simulated'].includes(health.status), `Health status must be online or simulated, got ${health.status}`);
  assert(health.device && health.device.includes('AMD'), `Device must identify as AMD hardware, got ${health.device}`);
  assert(Array.isArray(health.availableModels) && health.availableModels.length > 0, 'Available models must be listed');
  console.log(`   [PASS] Health: ${health.status.toUpperCase()} | Device: ${health.device} | Active model: ${health.activeModel}`);

  // Test 2: Inference execution & metrics telemetry
  console.log('2. Testing inference generation & latency/throughput telemetry...');
  const result = await AmdInferenceService.generate({
    prompt: 'Provide a strategic marketing plan for high-performance AMD hardware computing.',
    temperature: 0.7,
    maxTokens: 512,
  });

  assert(result, 'Inference result must be returned');
  assert(typeof result.text === 'string' && result.text.length > 20, 'Generated text must be non-empty');
  assert(result.metrics, 'Hardware metrics telemetry must be attached');
  assert(result.metrics.ttftMs >= 0, 'Time to first token (TTFT) must be non-negative');
  assert(result.metrics.tokensPerSecond > 0, 'Throughput (tokens/sec) must be greater than zero');
  assert(result.metrics.gpuDevice.includes('AMD'), 'GPU device must report AMD architecture');
  assert(result.metrics.provenance.includes('AMD'), 'Output provenance must reference AMD acceleration');

  console.log(`   [PASS] Generated ${result.metrics.completionTokens} tokens in ${result.metrics.totalLatencyMs}ms (${result.metrics.tokensPerSecond} tok/s)`);
  console.log(`   [PASS] Provenance: "${result.metrics.provenance}"`);

  // Test 3: System query handling
  console.log('3. Testing status and hardware diagnostic query handling...');
  const statusResult = await AmdInferenceService.generate({
    prompt: 'Report AMD hardware telemetry and model status',
  });
  assert(statusResult.text.includes('AMD'), 'Diagnostic response must mention AMD hardware');
  console.log('   [PASS] Diagnostic query properly handled by AMD adapter');

  console.log('\n✅ ALL AMD ROCm INFERENCE VERIFICATIONS PASSED SUCCESSFULLY.\n');
}

run().catch((err) => {
  console.error('\n❌ AMD ROCm INFERENCE VERIFICATION FAILED:', err);
  process.exit(1);
});
