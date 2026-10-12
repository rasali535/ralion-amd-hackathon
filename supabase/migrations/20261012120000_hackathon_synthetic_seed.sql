-- ==============================================================================
-- RALION OS — AMD DEVELOPER HACKATHON ACT III
-- SYNTHETIC DEMO SEED & ISOLATED TENANT PROVISIONING
-- ==============================================================================
-- Seeds synthetic business profiles, demo accounts, campaigns, audience segments,
-- and storage buckets for isolated hackathon evaluation.
-- Does NOT connect to or contain any real customer or production data.
-- ==============================================================================

-- 1. Ensure Storage Buckets exist if storage schema is present
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

-- 2. Organizations & Workspaces
INSERT INTO public.organizations (id, name, slug, tier, created_at, updated_at)
VALUES (
  'demo-org-ralion-amd-2026',
  'AMD Developer Hackathon ACT III',
  'amd-hackathon-act-3',
  'ENTERPRISE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, tier = EXCLUDED.tier;

INSERT INTO public.workspaces (id, organization_id, name, slug, owner_id, created_at, updated_at)
VALUES (
  'demo-workspace-ralion-amd-2026',
  'demo-org-ralion-amd-2026',
  'AMD ROCm AI Lab',
  'amd-rocm-lab',
  'demo-user-ralion-amd-2026',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, organization_id = EXCLUDED.organization_id;

-- 3. Profiles (Users)
INSERT INTO public.profiles (id, full_name, email, role, avatar_url, created_at, updated_at)
VALUES
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

-- 4. Workspace Memberships
INSERT INTO public.workspace_members (id, workspace_id, user_id, role, created_at)
VALUES
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

-- 5. Synthetic Business Profiles
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

-- 6. Synthetic Marketing Campaigns & Audience Segments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketing_campaigns') THEN
    INSERT INTO public.marketing_campaigns (id, workspace_id, title, target_platform, status, budget, start_date, end_date, created_at)
    VALUES
      (
        'demo-camp-mi300x-2026',
        'demo-workspace-ralion-amd-2026',
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
        'demo-workspace-ralion-amd-2026',
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
        'demo-workspace-ralion-amd-2026',
        'Holiday Creative AI Showcase',
        'instagram',
        'DRAFT',
        5000,
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '45 days',
        NOW()
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 7. Tenant Credit Wallet Allocation (1,000,000 synthetic compute credits)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_credit_wallets') THEN
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
    VALUES (
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
  END IF;
END $$;
