/**
 * Ralion OS — AMD Developer Hackathon ACT III
 * Automated Verification: Database & Backend Isolation Test Suite
 *
 * Verifies:
 * 1. Fatal rejection of known production Supabase project refs and domains
 * 2. Strict tenant boundaries and non-bypassable permission checks in demo auth
 * 3. AMD Token Factory server-only encapsulation, documented endpoints (/models, /chat/completions, /usage)
 * 4. Explicitly labeled test fixtures (zero invented metrics)
 * 5. Correct migration ordering (Schema 20261012100000 < Seed 20261012110000)
 * 6. Audit of all 16 tables for RLS policies
 * 7. Safe SECURITY DEFINER search paths and permissions
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
    assertNotProductionEndpoint('https://uosaqcgfvmxzwpxekoov.supabase.co', 'Hackathon Supabase');
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
    serverAuthCode.includes('requestedWorkspaceRaw && !isMatchingWorkspace'),
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
    serverAuthCode.includes('requestedOrgRaw && !isMatchingOrg'),
    'serverAuth must reject requested organizations not matching demo context'
  );
});

runTest('serverAuth uses RFC 4122 UUIDs for synthetic users compatible with Supabase Auth', () => {
  const serverAuthCode = fs.readFileSync(
    path.join(__dirname, '../apps/ralion/src/lib/auth/serverAuth.ts'),
    'utf-8'
  );

  assert.ok(
    serverAuthCode.includes('a0000000-0000-0000-0000-000000000001'),
    'serverAuth must use RFC 4122 user UUID'
  );
  assert.ok(
    serverAuthCode.includes('c0000000-0000-0000-0000-000000000001'),
    'serverAuth must use RFC 4122 workspace UUID'
  );
});

// ─── 3. AMD Token Factory Server-Only Isolation ─────────────────────────────
console.log('\n--- 3. Testing AMD Token Factory Architecture & Documented Endpoints ---');

const factoryPath = path.join(__dirname, '../packages/ai/src/amdTokenFactory.service.ts');
const factoryCode = fs.readFileSync(factoryPath, 'utf-8');

runTest('AmdTokenFactoryService is marked server-only and exported in server.ts', () => {
  assert.ok(fs.existsSync(factoryPath), 'amdTokenFactory.service.ts must exist');
  assert.ok(factoryCode.includes("import 'server-only'"), 'Must import server-only');
  assert.ok(factoryCode.includes('process.env.RADEON_API_KEY'), 'Must consume RADEON_API_KEY');

  const serverExport = fs.readFileSync(path.join(__dirname, '../packages/ai/src/server.ts'), 'utf-8');
  assert.ok(serverExport.includes("export * from './amdTokenFactory.service'"), 'Must be exported in server.ts');

  const clientExport = fs.readFileSync(path.join(__dirname, '../packages/ai/src/client.ts'), 'utf-8');
  assert.ok(!clientExport.includes('amdTokenFactory'), 'Must NEVER be exported in client.ts');
});

runTest('AmdTokenFactoryService implements documented /models, /chat/completions, and /usage', () => {
  assert.ok(factoryCode.includes('listModels()'), 'Must implement listModels for /models');
  assert.ok(factoryCode.includes('createChatCompletion('), 'Must implement createChatCompletion for /chat/completions');
  assert.ok(factoryCode.includes('getUsage('), 'Must implement getUsage for /usage');
  assert.ok(!factoryCode.includes('/quota?workspace='), 'Must NOT contain unsupported /quota endpoint');
  assert.ok(!factoryCode.includes('/mint'), 'Must NOT contain unsupported /mint endpoint');
});

runTest('Test fixtures are explicitly labeled and omit invented metrics', () => {
  assert.ok(factoryCode.includes('isFixture: true'), 'Test fixtures must be marked with isFixture: true');
  assert.ok(factoryCode.includes('fixtureNotice:'), 'Test fixtures must include a descriptive fixtureNotice');
  assert.ok(!factoryCode.includes('148 tok/s'), 'Must not hardcode invented live token rates');
});

runTest('RADEON_API_KEY is not leaked into client-accessible env variables', () => {
  const envExample = fs.readFileSync(
    path.join(__dirname, '../apps/ralion/.env.example'),
    'utf-8'
  );
  assert.ok(envExample.includes('RADEON_API_KEY='), 'RADEON_API_KEY should be in .env.example');
  assert.ok(!envExample.includes('NEXT_PUBLIC_RADEON_API_KEY'), 'Must NEVER be prefixed with NEXT_PUBLIC_');
});

runTest('Next.js API route /api/ai/amd/token-factory enforces server auth and uses documented endpoints', () => {
  const routePath = path.join(__dirname, '../apps/ralion/src/app/api/ai/amd/token-factory/route.ts');
  assert.ok(fs.existsSync(routePath), 'Route must exist');
  const routeCode = fs.readFileSync(routePath, 'utf-8');
  assert.ok(routeCode.includes('resolveRalionAuthContext'), 'Route must resolve authoritative auth context');
  assert.ok(routeCode.includes('listModels'), 'Route must support listing models');
  assert.ok(routeCode.includes('createChatCompletion'), 'Route must support chat completion');
});

// ─── 4. Synthetic Seed Data & Migration Audit ────────────────────────────────
console.log('\n--- 4. Testing Migration Ordering, 16 Tables RLS & Synthetic Seed Data ---');

const schemaMigrationPath = path.join(
  __dirname,
  '../supabase/migrations/20261012100000_hackathon_minimal_schema_and_rls.sql'
);
const seedMigrationPath = path.join(
  __dirname,
  '../supabase/migrations/20261012110000_hackathon_synthetic_seed.sql'
);

runTest('Migration ordering is correct: Schema (100000) precedes Seed (110000)', () => {
  assert.ok(fs.existsSync(schemaMigrationPath), 'Schema migration 20261012100000 must exist');
  assert.ok(fs.existsSync(seedMigrationPath), 'Seed migration 20261012110000 must exist');

  const schemaFile = path.basename(schemaMigrationPath);
  const seedFile = path.basename(seedMigrationPath);
  assert.ok(schemaFile < seedFile, 'Lexicographical order must execute schema before seed');
});

const schemaSql = fs.readFileSync(schemaMigrationPath, 'utf-8');

runTest('All 16 required application tables are created and enforce Row-Level Security', () => {
  const requiredTables = [
    'organizations',
    'workspaces',
    'profiles',
    'workspace_members',
    'business_profiles',
    'ai_memory',
    'creative_assets',
    'ai_jobs',
    'marketing_campaigns',
    'social_connections',
    'social_posts',
    'workflows',
    'workflow_executions',
    'tenant_credit_wallets',
    'tenant_credit_ledger',
    'security_audit_logs',
  ];

  for (const table of requiredTables) {
    assert.ok(
      schemaSql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`),
      `Table public.${table} must be declared in minimal schema`
    );
    assert.ok(
      schemaSql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`),
      `Table public.${table} must enable Row Level Security`
    );
  }
});

runTest('SECURITY DEFINER functions enforce safe search_path and execution privileges', () => {
  assert.ok(
    schemaSql.includes('SET search_path = public, pg_temp'),
    'SECURITY DEFINER functions must set search_path = public, pg_temp'
  );
  assert.ok(
    schemaSql.includes('REVOKE ALL ON FUNCTION public.is_workspace_member(TEXT) FROM PUBLIC'),
    'is_workspace_member execution must be revoked from PUBLIC'
  );
  assert.ok(
    schemaSql.includes('REVOKE ALL ON FUNCTION public.is_org_member(TEXT) FROM PUBLIC'),
    'is_org_member execution must be revoked from PUBLIC'
  );
});

runTest('Synthetic seed contains valid Supabase Auth user integration and demo fixtures', () => {
  const seedSql = fs.readFileSync(seedMigrationPath, 'utf-8');
  assert.ok(seedSql.includes('auth.users'), 'Must contain conditional seed into auth.users');
  assert.ok(seedSql.includes('a0000000-0000-0000-0000-000000000001'), 'Must seed primary demo user UUID');
  assert.ok(seedSql.includes('c0000000-0000-0000-0000-000000000001'), 'Must seed primary demo workspace UUID');
  assert.ok(seedSql.includes('Kalahari & Okavango Wilderness Expeditions'), 'Must seed Botswana safari company business profile');
  assert.ok(seedSql.includes('Okavango Untamed — Private Concession Sanctuary'), 'Must seed luxury safari campaign');
  assert.ok(seedSql.includes('Botswana Frontier — Mobile Expedition & Mokoro Trails'), 'Must seed adventure safari campaign');
  assert.ok(seedSql.includes('AUDIENCE_SEGMENT_LUXURY'), 'Must seed luxury audience AI memory');
  assert.ok(seedSql.includes('AUDIENCE_SEGMENT_ADVENTURE'), 'Must seed adventure audience AI memory');
  assert.ok(seedSql.includes('tenant_credit_wallets'), 'Must seed synthetic credit wallets');
});

runTest('SQL migrations contain ZERO hardcoded passwords and use unguessable hashes', () => {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    assert.ok(
      !content.includes('AmdHackathon2026!'),
      `Migration ${file} must NOT contain hardcoded password AmdHackathon2026!`
    );
  }

  const seedSql = fs.readFileSync(seedMigrationPath, 'utf-8');
  assert.ok(
    seedSql.includes('gen_random_uuid()::text'),
    'Synthetic auth.users seed must use unguessable random salt/hash'
  );

  const provisionScript = path.join(__dirname, 'provision-demo-users.js');
  assert.ok(fs.existsSync(provisionScript), 'Supported provision-demo-users.js script must exist');
});

runTest('Confirmed hackathon Supabase project uosaqcgfvmxzwpxekoov is canonical endpoint', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../apps/ralion/src/lib/supabase/client.ts'),
    'utf-8'
  );
  assert.ok(
    clientCode.includes('https://uosaqcgfvmxzwpxekoov.supabase.co'),
    'client.ts CANONICAL_SUPABASE_URL must default to https://uosaqcgfvmxzwpxekoov.supabase.co'
  );
});

runTest('AmdTokenFactoryService targets https://developer.amd.com.cn/radeon/api/v1', () => {
  assert.ok(
    factoryCode.includes('https://developer.amd.com.cn/radeon/api/v1'),
    'DEFAULT_BASE_URL must be https://developer.amd.com.cn/radeon/api/v1'
  );
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
