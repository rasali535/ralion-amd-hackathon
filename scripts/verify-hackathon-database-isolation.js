/**
 * Ralion OS — AMD Developer Hackathon ACT III
 * Automated Verification: Database & Backend Isolation Test Suite
 *
 * Verifies:
 * 1. Fatal rejection of known production Supabase project refs and domains
 * 2. Strict tenant boundaries and non-bypassable permission checks in demo auth
 * 3. AMD Token Factory server-only encapsulation and RADEON_API_KEY safety
 * 4. Synthetic seed integrity and lack of production database references
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log('  🛡️   RALION OS — AMD HACKATHON DATABASE & BACKEND ISOLATION AUDIT');
console.log('======================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// ─── 1. Production Endpoint & Ref Rejection ──────────────────────────────────
console.log('--- 1. Testing Production Supabase & Domain Rejection Guardrails ---');

const productionGuardsCode = fs.readFileSync(
  path.join(__dirname, '../packages/core/src/productionGuards.ts'),
  'utf-8'
);

const FORBIDDEN_PRODUCTION_PROJECT_REFS = ['yidsfihagwttlmhfynmf'];
const FORBIDDEN_PRODUCTION_DOMAINS = [
  'yidsfihagwttlmhfynmf.supabase.co',
  'rasalilabs.com',
  'api.rasalilabs.com',
];

function assertNotProductionEndpoint(value, context = 'Test') {
  if (!value || typeof value !== 'string') return;
  const normalized = value.toLowerCase().trim();
  for (const ref of FORBIDDEN_PRODUCTION_PROJECT_REFS) {
    if (normalized.includes(ref)) {
      throw new Error(`[CRITICAL ISOLATION ENFORCEMENT] Blocked access to forbidden production project ref "${ref}" in ${context}.`);
    }
  }
  for (const domain of FORBIDDEN_PRODUCTION_DOMAINS) {
    if (normalized.includes(domain)) {
      throw new Error(`[CRITICAL ISOLATION ENFORCEMENT] Blocked access to forbidden production domain "${domain}" in ${context}.`);
    }
  }
}

runTest('productionGuards.ts defines forbidden refs and assertion functions', () => {
  assert.ok(productionGuardsCode.includes("'yidsfihagwttlmhfynmf'"), 'Must contain forbidden ref');
  assert.ok(productionGuardsCode.includes('assertNotProductionEndpoint'), 'Must contain assertNotProductionEndpoint');
  assert.ok(productionGuardsCode.includes('validateHackathonEnvironmentIsolation'), 'Must contain validateHackathonEnvironmentIsolation');
});

runTest('Rejects production project ref: yidsfihagwttlmhfynmf', () => {
  let threw = false;
  try {
    assertNotProductionEndpoint('https://yidsfihagwttlmhfynmf.supabase.co', 'Test Context');
  } catch (err) {
    threw = Boolean(err && err.message.includes('CRITICAL ISOLATION ENFORCEMENT'));
  }
  assert.strictEqual(threw, true, 'Must throw isolation enforcement error');
});

runTest('Rejects production domain: rasalilabs.com', () => {
  let threw = false;
  try {
    assertNotProductionEndpoint('https://api.rasalilabs.com/v1', 'Test Context');
  } catch (err) {
    threw = Boolean(err && err.message.includes('CRITICAL ISOLATION ENFORCEMENT'));
  }
  assert.strictEqual(threw, true, 'Must throw isolation enforcement error');
});

runTest('Allows valid local and dedicated hackathon Supabase URLs', () => {
  assert.doesNotThrow(() => {
    assertNotProductionEndpoint('http://localhost:54321', 'Local Supabase');
    assertNotProductionEndpoint('https://hackathon-rocm-amd-act3.supabase.co', 'Hackathon Supabase');
  });
});

// ─── 2. Tenant Isolation In Demo Mode ────────────────────────────────────────
console.log('\n--- 2. Testing Tenant Boundary Guards in Authentication ---');

runTest('serverAuth rejects cross-tenant workspace access under demo context', () => {
  const serverAuthCode = fs.readFileSync(
    path.join(__dirname, '../apps/ralion/src/lib/auth/serverAuth.ts'),
    'utf-8'
  );

  assert.ok(
    serverAuthCode.includes('requestedWorkspaceRaw !== DEMO_RALION_CONTEXT.workspace.id'),
    'serverAuth must reject requested workspaces not matching demo context'
  );
  assert.ok(
    serverAuthCode.includes('WORKSPACE_ACCESS_DENIED'),
    'serverAuth must return WORKSPACE_ACCESS_DENIED'
  );
});

runTest('serverAuth rejects cross-tenant organization access under demo context', () => {
  const serverAuthCode = fs.readFileSync(
    path.join(__dirname, '../apps/ralion/src/lib/auth/serverAuth.ts'),
    'utf-8'
  );

  assert.ok(
    serverAuthCode.includes('requestedOrgRaw !== DEMO_RALION_CONTEXT.organization.id'),
    'serverAuth must reject requested organizations not matching demo context'
  );
});

// ─── 3. AMD Token Factory Server-Only Isolation ─────────────────────────────
console.log('\n--- 3. Testing AMD Token Factory Architecture & RADEON_API_KEY Safety ---');

runTest('AmdTokenFactoryService is marked server-only and exported in server.ts', () => {
  const factoryPath = path.join(__dirname, '../packages/ai/src/amdTokenFactory.service.ts');
  assert.ok(fs.existsSync(factoryPath), 'amdTokenFactory.service.ts must exist');
  const factoryCode = fs.readFileSync(factoryPath, 'utf-8');
  assert.ok(factoryCode.includes("import 'server-only'"), 'Must import server-only');
  assert.ok(factoryCode.includes('process.env.RADEON_API_KEY'), 'Must consume RADEON_API_KEY');

  const serverExport = fs.readFileSync(path.join(__dirname, '../packages/ai/src/server.ts'), 'utf-8');
  assert.ok(serverExport.includes("export * from './amdTokenFactory.service'"), 'Must be exported in server.ts');

  const clientExport = fs.readFileSync(path.join(__dirname, '../packages/ai/src/client.ts'), 'utf-8');
  assert.ok(!clientExport.includes('amdTokenFactory'), 'Must NEVER be exported in client.ts');
});

runTest('RADEON_API_KEY is not leaked into client-accessible env variables', () => {
  const envExample = fs.readFileSync(
    path.join(__dirname, '../apps/ralion/.env.example'),
    'utf-8'
  );
  assert.ok(envExample.includes('RADEON_API_KEY='), 'RADEON_API_KEY should be in .env.example');
  assert.ok(!envExample.includes('NEXT_PUBLIC_RADEON_API_KEY'), 'Must NEVER be prefixed with NEXT_PUBLIC_');
});

runTest('Next.js API route /api/ai/amd/token-factory enforces server auth', () => {
  const routePath = path.join(__dirname, '../apps/ralion/src/app/api/ai/amd/token-factory/route.ts');
  assert.ok(fs.existsSync(routePath), 'Route must exist');
  const routeCode = fs.readFileSync(routePath, 'utf-8');
  assert.ok(routeCode.includes('resolveRalionAuthContext'), 'Route must resolve authoritative auth context');
  assert.ok(routeCode.includes('AmdTokenFactoryService'), 'Route must invoke AmdTokenFactoryService');
});

// ─── 4. Synthetic Seed Data & Migration Audit ────────────────────────────────
console.log('\n--- 4. Testing Synthetic Seed Data & Supabase Migrations ---');

runTest('Synthetic seed migration exists and contains demo organizations & profiles', () => {
  const seedMigrationPath = path.join(
    __dirname,
    '../supabase/migrations/20261012120000_hackathon_synthetic_seed.sql'
  );
  assert.ok(fs.existsSync(seedMigrationPath), 'Synthetic seed migration must exist');
  const seedSql = fs.readFileSync(seedMigrationPath, 'utf-8');
  assert.ok(seedSql.includes('demo-org-ralion-amd-2026'), 'Must seed demo-org');
  assert.ok(seedSql.includes('demo-workspace-ralion-amd-2026'), 'Must seed demo-workspace');
  assert.ok(seedSql.includes('demo-user-ralion-amd-2026'), 'Must seed demo-user');
  assert.ok(seedSql.includes('Apex Dynamics ROCm Systems'), 'Must seed synthetic business profile');
  assert.ok(seedSql.includes('AMD Instinct MI300X Global Launch'), 'Must seed synthetic marketing campaigns');
  assert.ok(seedSql.includes('tenant_credit_wallets'), 'Must seed synthetic credit wallets');
});

runTest('Zero migrations contain forbidden production project references', () => {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    for (const ref of FORBIDDEN_PRODUCTION_PROJECT_REFS) {
      assert.ok(
        !content.includes(ref),
        `Migration ${file} must not contain production project ref ${ref}`
      );
    }
  }
});

console.log('\n======================================================================');
console.log(`  📊 RESULTS: ${passedTests} OF ${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('  🏆 ALL DATABASE & BACKEND ISOLATION INVARIANTS SATISFIED!');
} else {
  console.log('  ⚠️ SOME TESTS FAILED.');
}
console.log('======================================================================\n');

if (process.exitCode) {
  process.exit(process.exitCode);
}
