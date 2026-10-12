-- ==============================================================================
-- RALION OS — AMD DEVELOPER HACKATHON ACT III
-- SYNTHETIC SEED DATA FOR STANDALONE HACKATHON EVALUATION
-- ==============================================================================

-- 1. Organizations & Workspaces
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

-- 2. Profiles (Users)
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

-- 3. Workspace Memberships
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

-- 4. Synthetic Business Profile
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
