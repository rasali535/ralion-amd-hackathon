-- ==============================================================================
-- RALION OS — AMD DEVELOPER HACKATHON ACT III
-- MIGRATION 2: SYNTHETIC DEMONSTRATION SEED & ISOLATED TENANT PROVISIONING
-- ==============================================================================
-- Target Supabase Project: ralion-amd-hackathon (uosaqcgfvmxzwpxekoov)
-- Region: eu-central-1
-- Execution Order: 2 of 2 (Executes AFTER schema migration 20261012100000)
-- ==============================================================================

-- 1. Storage Buckets (If storage schema is present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('logos', 'logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml']),
      ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
      ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'text/plain', 'text/markdown']),
      ('images', 'images', true, 20971520, ARRAY['image/png', 'image/jpeg', 'image/webp']),
      ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm']),
      ('marketing', 'marketing', true, 20971520, ARRAY['image/png', 'image/jpeg', 'image/webp']),
      ('generated_content', 'generated_content', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/mp4'])
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
  END IF;
END $$;

-- 2. Supabase Auth Compatible Synthetic Users (auth.users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES
      (
        '00000000-0000-0000-0000-000000000000',
        'a0000000-0000-0000-0000-000000000001',
        'authenticated',
        'authenticated',
        'demo@ralion.ai',
        crypt('AmdHackathon2026!', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"],"role":"PLATFORM_ADMIN"}'::jsonb,
        '{"full_name":"AMD Hackathon Developer"}'::jsonb,
        NOW(),
        NOW()
      ),
      (
        '00000000-0000-0000-0000-000000000000',
        'a0000000-0000-0000-0000-000000000002',
        'authenticated',
        'authenticated',
        'developer@amd-hackathon.local',
        crypt('AmdHackathon2026!', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"],"role":"ADMINISTRATOR"}'::jsonb,
        '{"full_name":"ROCm Systems Engineer"}'::jsonb,
        NOW(),
        NOW()
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 3. Synthetic Organizations
INSERT INTO public.organizations (id, name, slug, tier, created_at, updated_at)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'AMD Developer Hackathon ACT III',
    'amd-hackathon-act-3',
    'ENTERPRISE',
    NOW(),
    NOW()
  ),
  (
    'demo-org-ralion-amd-2026',
    'AMD Developer Hackathon ACT III',
    'amd-hackathon-act-3-alias',
    'ENTERPRISE',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, tier = EXCLUDED.tier;

-- 4. Synthetic Workspaces
INSERT INTO public.workspaces (id, organization_id, name, slug, owner_id, created_at, updated_at)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'AMD ROCm AI Lab',
    'amd-rocm-lab',
    'a0000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
  ),
  (
    'demo-workspace-ralion-amd-2026',
    'demo-org-ralion-amd-2026',
    'AMD ROCm AI Lab',
    'amd-rocm-lab-alias',
    'demo-user-ralion-amd-2026',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, organization_id = EXCLUDED.organization_id;

-- 5. Profiles (Matching Auth & Legacy String Identifiers)
INSERT INTO public.profiles (id, full_name, email, role, avatar_url, created_at, updated_at)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'AMD Hackathon Developer',
    'demo@ralion.ai',
    'PLATFORM_ADMIN',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80',
    NOW(),
    NOW()
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'ROCm Systems Engineer',
    'developer@amd-hackathon.local',
    'ADMINISTRATOR',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&q=80',
    NOW(),
    NOW()
  ),
  (
    'demo-user-ralion-amd-2026',
    'AMD Hackathon Developer',
    'demo@ralion.ai',
    'PLATFORM_ADMIN',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80',
    NOW(),
    NOW()
  ),
  (
    'developer-user-rocm-2026',
    'ROCm Systems Engineer',
    'developer@amd-hackathon.local',
    'ADMINISTRATOR',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&q=80',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

-- 6. Workspace Memberships
INSERT INTO public.workspace_members (id, workspace_id, user_id, role, created_at)
VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'owner',
    NOW()
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'admin',
    NOW()
  ),
  (
    'demo-mem-ralion-amd-2026',
    'demo-workspace-ralion-amd-2026',
    'demo-user-ralion-amd-2026',
    'owner',
    NOW()
  ),
  (
    'demo-mem-rocm-engineer-2026',
    'demo-workspace-ralion-amd-2026',
    'developer-user-rocm-2026',
    'admin',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Synthetic Business Profiles
INSERT INTO public.business_profiles (
  id,
  workspace_id,
  business_name,
  industry,
  mission,
  vision,
  brand_voice,
  brand_colors,
  target_audience,
  competitors,
  business_goals,
  updated_at
)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Apex Dynamics ROCm Systems',
    'AI Compute & Accelerator Infrastructure',
    'Accelerating enterprise machine learning through open-source ROCm hardware and software ecosystems.',
    'Democratizing AI training and inference on open AMD Instinct GPU architectures.',
    'Technical, Authoritative, Bold, Solution-Driven',
    ARRAY['#ED1C24', '#111827', '#F3F4F6', '#000000'],
    'Machine Learning Engineers, Data Scientists, and Infrastructure Architects',
    ARRAY['Nvidia AI Enterprise', 'Intel Habana Gaudi', 'AWS Trainium'],
    ARRAY['Achieve 150+ tokens/sec on MI300X clusters', 'Expand open model serving support', 'Deliver automated visual QA pipelines'],
    NOW()
  ),
  (
    'demo-biz-profile-apex-2026',
    'demo-workspace-ralion-amd-2026',
    'Apex Dynamics ROCm Systems',
    'AI Compute & Accelerator Infrastructure',
    'Accelerating enterprise machine learning through open-source ROCm hardware and software ecosystems.',
    'Democratizing AI training and inference on open AMD Instinct GPU architectures.',
    'Technical, Authoritative, Bold, Solution-Driven',
    ARRAY['#ED1C24', '#111827', '#F3F4F6', '#000000'],
    'Machine Learning Engineers, Data Scientists, and Infrastructure Architects',
    ARRAY['Nvidia AI Enterprise', 'Intel Habana Gaudi', 'AWS Trainium'],
    ARRAY['Achieve 150+ tokens/sec on MI300X clusters', 'Expand open model serving support', 'Deliver automated visual QA pipelines'],
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  mission = EXCLUDED.mission,
  updated_at = NOW();

-- 8. Synthetic Marketing Campaigns
INSERT INTO public.marketing_campaigns (id, workspace_id, title, target_platform, status, budget, start_date, end_date, created_at)
VALUES
  (
    'demo-camp-mi300x-2026',
    'c0000000-0000-0000-0000-000000000001',
    'AMD Instinct MI300X Global Launch',
    'linkedin',
    'ACTIVE',
    15000,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW()
  ),
  (
    'demo-camp-rocm-sprint-2026',
    'c0000000-0000-0000-0000-000000000001',
    'ROCm Open Ecosystem Developer Sprint',
    'x',
    'SCHEDULED',
    8500,
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '20 days',
    NOW()
  ),
  (
    'demo-camp-creative-ai-2026',
    'c0000000-0000-0000-0000-000000000001',
    'Holiday Creative AI Showcase',
    'instagram',
    'DRAFT',
    5000,
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '45 days',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 9. Synthetic Tenant Credit Wallets (1,000,000 synthetic compute credits)
INSERT INTO public.tenant_credit_wallets (
  organization_id,
  tier,
  plan_credits,
  bonus_credits,
  total_balance,
  monthly_quota,
  lifetime_granted,
  lifetime_consumed,
  last_renewed_at,
  updated_at
)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'ENTERPRISE',
    1000000,
    50000,
    1050000,
    1000000,
    1050000,
    12450,
    NOW(),
    NOW()
  ),
  (
    'demo-org-ralion-amd-2026',
    'ENTERPRISE',
    1000000,
    50000,
    1050000,
    1000000,
    1050000,
    12450,
    NOW(),
    NOW()
  )
ON CONFLICT (organization_id) DO UPDATE SET
  total_balance = EXCLUDED.total_balance,
  updated_at = NOW();
