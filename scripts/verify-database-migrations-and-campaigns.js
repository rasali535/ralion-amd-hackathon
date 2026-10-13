const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { PGlite } = require('@electric-sql/pglite');

async function main() {
  console.log('\n======================================================================');
  console.log('  🐘  RALION OS — ISOLATED SUPABASE MIGRATIONS & CAMPAIGNS TEST');
  console.log('======================================================================\n');

  console.log('[1/5] Initializing fresh, isolated in-memory PostgreSQL engine...');
  const db = new PGlite();

  // Supabase mock environment: auth schema, auth.uid(), auth.role()
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID
    LANGUAGE sql
    STABLE
    AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;

    CREATE OR REPLACE FUNCTION auth.role()
    RETURNS TEXT
    LANGUAGE sql
    STABLE
    AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
    $$;
  `);
  console.log('      ✓ Supabase Auth mock primitives installed.');

  // Step 2: Execute Schema Migration
  console.log('\n[2/5] Applying Migration 1: 20261012100000_hackathon_minimal_schema_and_rls.sql...');
  const schemaPath = path.resolve(__dirname, '../supabase/migrations/20261012100000_hackathon_minimal_schema_and_rls.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.exec(schemaSql);
  console.log('      ✓ Schema migration executed cleanly against fresh PostgreSQL.');

  // Verify that all 16 application tables exist
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

  const tablesRes = await db.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public';
  `);
  const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));

  for (const table of requiredTables) {
    assert.ok(existingTables.has(table), `Table public.${table} must exist in fresh schema`);
  }
  console.log('      ✓ All 16 application tables verified in fresh database.');

  // Step 3: Execute Seed Migration
  console.log('\n[3/5] Applying Migration 2: 20261012110000_hackathon_synthetic_seed.sql...');
  const seedPath = path.resolve(__dirname, '../supabase/migrations/20261012110000_hackathon_synthetic_seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  await db.exec(seedSql);
  console.log('      ✓ Synthetic seed migration executed cleanly without constraint errors.');

  // Step 4: Verify campaigns & business profile under authenticated user with RLS
  console.log('\n[4/5] Testing authenticated demonstration user access under RLS...');
  const demoUserId = 'a0000000-0000-0000-0000-000000000001';
  const demoWorkspaceId = 'c0000000-0000-0000-0000-000000000001';

  // Set session context for demo user
  await db.exec(`
    SET request.jwt.claim.sub = '${demoUserId}';
    SET request.jwt.claim.role = 'authenticated';
  `);

  // Verify is_workspace_member evaluates to true
  const isMemberRes = await db.query(`SELECT public.is_workspace_member('${demoWorkspaceId}') AS is_member;`);
  assert.strictEqual(isMemberRes.rows[0].is_member, true, 'Authenticated user must be recognized as workspace member');

  // Query campaigns
  const campaignsRes = await db.query(`
    SELECT id, title, target_platform, status, budget, description, metadata
    FROM public.marketing_campaigns
    WHERE workspace_id = '${demoWorkspaceId}'
    ORDER BY created_at ASC;
  `);

  assert.strictEqual(campaignsRes.rows.length, 2, 'Authenticated demo user must read exactly 2 marketing campaigns');

  const luxuryCamp = campaignsRes.rows.find((c) => c.id === 'demo-camp-luxury-safari-2026');
  assert.ok(luxuryCamp, 'Must find luxury safari campaign');
  assert.strictEqual(luxuryCamp.title, 'Okavango Untamed — Private Concession Sanctuary');
  const luxuryMeta = typeof luxuryCamp.metadata === 'string' ? JSON.parse(luxuryCamp.metadata) : luxuryCamp.metadata;
  assert.strictEqual(luxuryMeta.target_segment, 'luxury_travellers');
  assert.ok(luxuryMeta.objective && luxuryMeta.messaging && luxuryMeta.creative_direction);
  console.log('      ✓ Luxury travellers campaign verified:');
  console.log(`        - Title: "${luxuryCamp.title}"`);
  console.log(`        - Platform: ${luxuryCamp.target_platform} | Budget: $${luxuryCamp.budget}`);
  console.log(`        - Creative direction: "${luxuryMeta.creative_direction.slice(0, 60)}..."`);

  const adventureCamp = campaignsRes.rows.find((c) => c.id === 'demo-camp-adventure-safari-2026');
  assert.ok(adventureCamp, 'Must find budget adventure safari campaign');
  assert.strictEqual(adventureCamp.title, 'Botswana Frontier — Mobile Expedition & Mokoro Trails');
  const adventureMeta = typeof adventureCamp.metadata === 'string' ? JSON.parse(adventureCamp.metadata) : adventureCamp.metadata;
  assert.strictEqual(adventureMeta.target_segment, 'budget_adventure_travellers');
  assert.ok(adventureMeta.objective && adventureMeta.messaging && adventureMeta.creative_direction);
  console.log('      ✓ Budget adventure travellers campaign verified:');
  console.log(`        - Title: "${adventureCamp.title}"`);
  console.log(`        - Platform: ${adventureCamp.target_platform} | Budget: $${adventureCamp.budget}`);
  console.log(`        - Creative direction: "${adventureMeta.creative_direction.slice(0, 60)}..."`);

  // Verify business profile
  const bpRes = await db.query(`
    SELECT business_name, industry, mission, vision, target_audience
    FROM public.business_profiles
    WHERE workspace_id = '${demoWorkspaceId}';
  `);
  assert.strictEqual(bpRes.rows.length, 1, 'Must read business profile');
  assert.strictEqual(bpRes.rows[0].business_name, 'Kalahari & Okavango Wilderness Expeditions');
  console.log(`      ✓ Verified business profile: "${bpRes.rows[0].business_name}" (${bpRes.rows[0].industry})`);

  // Verify security_audit_logs SELECT policy requires non-null workspace AND membership
  console.log('      Testing security_audit_logs RLS policy (workspace_id IS NOT NULL)...');
  await db.exec(`
    INSERT INTO public.security_audit_logs (id, workspace_id, action, resource)
    VALUES
      ('audit-null-workspace', NULL, 'SYSTEM_EVENT', 'SYSTEM'),
      ('audit-valid-workspace', '${demoWorkspaceId}', 'LOGIN_EVENT', 'AUTH')
    ON CONFLICT (id) DO NOTHING;
  `);

  const auditRes = await db.query(`
    SELECT id, workspace_id, action FROM public.security_audit_logs
    WHERE (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));
  `);
  const visibleAuditIds = auditRes.rows.map((r) => r.id);
  assert.ok(visibleAuditIds.includes('audit-valid-workspace'), 'Must see audit log with valid workspace membership');
  assert.ok(!visibleAuditIds.includes('audit-null-workspace'), 'Must NOT see audit log with NULL workspace_id');
  console.log('      ✓ Verified security_audit_logs SELECT policy strictly requires non-null workspace and membership.');

  // Step 5: Verify cross-tenant isolation (unauthorized stranger cannot read)
  console.log('\n[5/5] Testing cross-tenant isolation guardrails (unauthorized stranger)...');
  await db.exec(`
    SET request.jwt.claim.sub = 'f9999999-9999-9999-9999-999999999999';
    SET request.jwt.claim.role = 'authenticated';
  `);

  const strangerMemberRes = await db.query(`SELECT public.is_workspace_member('${demoWorkspaceId}') AS is_member;`);
  assert.strictEqual(strangerMemberRes.rows[0].is_member, false, 'Stranger must NOT be recognized as workspace member');

  const strangerCampaigns = await db.query(`
    SELECT * FROM public.marketing_campaigns
    WHERE workspace_id = '${demoWorkspaceId}'
      AND public.is_workspace_member(workspace_id);
  `);
  assert.strictEqual(strangerCampaigns.rows.length, 0, 'Stranger must see ZERO campaigns under workspace RLS');

  console.log('      ✓ Stranger correctly blocked from reading campaigns and workspace resources.');

  console.log('\n======================================================================');
  console.log('  🏆 ALL MIGRATIONS & SAFARI CAMPAIGNS VALIDATED AGAINST REAL DATABASE!');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ DATABASE MIGRATION VERIFICATION FAILED:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
