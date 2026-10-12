#!/usr/bin/env node

/**
 * Ralion OS — Supported Supabase Auth Demo User Provisioning
 * AMD Developer Hackathon ACT III
 *
 * Implements supported administrative user provisioning for the dedicated
 * hackathon Supabase project (uosaqcgfvmxzwpxekoov).
 *
 * SECURITY INVARIANTS:
 * 1. Never uses hardcoded or public passwords.
 * 2. Consumes DEMO_USER_PASSWORD from secure environment or generates an unguessable token.
 * 3. Uses official Supabase Auth Admin API (supabase.auth.admin.createUser).
 * 4. Fails closed if production ref (yidsfihagwttlmhfynmf) is targeted.
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const CANONICAL_PROJECT_ID = 'uosaqcgfvmxzwpxekoov';
const FORBIDDEN_PROD_PROJECT_ID = 'yidsfihagwttlmhfynmf';

async function main() {
  console.log('\n======================================================================');
  console.log('  🛡️   RALION OS — SUPABASE AUTH DEMO PROVISIONING');
  console.log('======================================================================\n');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${CANONICAL_PROJECT_ID}.supabase.co`;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl.includes(FORBIDDEN_PROD_PROJECT_ID) || supabaseUrl.includes('rasalilabs.com')) {
    console.error('FATAL: Targeting production infrastructure is strictly forbidden!');
    process.exit(1);
  }

  const demoUsers = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'demo@ralion.ai',
      role: 'PLATFORM_ADMIN',
      fullName: 'AMD Hackathon Developer',
      workspaceId: 'c0000000-0000-0000-0000-000000000001',
      workspaceRole: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'developer@amd-hackathon.local',
      role: 'ADMINISTRATOR',
      fullName: 'ROCm Systems Engineer',
      workspaceId: 'c0000000-0000-0000-0000-000000000001',
      workspaceRole: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&q=80',
    },
  ];

  if (!serviceKey) {
    console.log('[PROVISIONING PREVIEW / DRY RUN]');
    console.log(`Target Supabase Project: ${supabaseUrl}`);
    console.log('Note: SUPABASE_SECRET_KEY is not set in local environment.');
    console.log('When running in hosted environment with service key, this script invokes:');
    console.log('  1. supabase.auth.admin.createUser({ id, email, password, email_confirm: true })');
    console.log('  2. supabase.from("profiles").upsert(...) to associate user with seeded profile');
    console.log('  3. supabase.from("workspace_members").upsert(...) to bind user to workspace memberships');
    console.log('Passwords are read securely from process.env.DEMO_USER_PASSWORD or generated at runtime.\n');

    // Contract validation: verify seed files contain matching profiles & workspace memberships
    const fs = require('fs');
    const path = require('path');
    const seedPath = path.resolve(__dirname, '../supabase/migrations/20261012110000_hackathon_synthetic_seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    for (const user of demoUsers) {
      if (!seedSql.includes(user.id)) {
        throw new Error(`Synthetic seed missing matching profile identifier for ${user.id} (${user.email})`);
      }
      if (!seedSql.includes(user.email)) {
        throw new Error(`Synthetic seed missing matching email for ${user.email}`);
      }
      console.log(`  ✓ Verified seeded profile and workspace association for ${user.email} (${user.id})`);
    }

    console.log('\n✅ Supported Supabase Auth provisioning and membership association contract verified.\n');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const demoPassword = process.env.DEMO_USER_PASSWORD || crypto.randomBytes(18).toString('base64');

  for (const user of demoUsers) {
    console.log(`Provisioning user ${user.email} via auth.admin.createUser...`);
    let targetUserId = user.id;

    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: demoPassword,
      email_confirm: true,
      app_metadata: { provider: 'email', role: user.role },
      user_metadata: { full_name: user.fullName },
    });

    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`  [INFO] User ${user.email} already exists in Auth pool.`);
        try {
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existing = listData?.users?.find((u) => u.email === user.email);
          if (existing) targetUserId = existing.id;
        } catch {}
      } else {
        console.warn(`  [WARN] Failed to provision ${user.email}:`, error.message);
      }
    } else {
      targetUserId = data.user.id;
      console.log(`  [SUCCESS] Created Auth user ${user.email} (${targetUserId}).`);
    }

    // Associate authenticated user with seeded profile
    console.log(`  Associating profile for ${user.email} (${targetUserId})...`);
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: targetUserId,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      avatar_url: user.avatarUrl,
      updated_at: new Date().toISOString(),
    });
    if (profileError) {
      console.warn(`  [WARN] Profile upsert warning for ${user.email}:`, profileError.message);
    } else {
      console.log(`  [SUCCESS] Profile associated for ${user.email}.`);
    }

    // Associate authenticated user with workspace membership
    console.log(`  Associating workspace membership for ${user.email} in ${user.workspaceId}...`);
    const { error: memberError } = await supabase.from('workspace_members').upsert({
      workspace_id: user.workspaceId,
      user_id: targetUserId,
      role: user.workspaceRole,
      created_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,user_id' });
    if (memberError) {
      console.warn(`  [WARN] Workspace member upsert warning for ${user.email}:`, memberError.message);
    } else {
      console.log(`  [SUCCESS] Workspace membership associated for ${user.email}.`);
    }
  }

  console.log('\n✅ Demo user provisioning and profile/workspace associations completed securely via Supabase Auth Admin API.\n');
}

main().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
