-- ==============================================================================
-- RALION OS — AMD DEVELOPER HACKATHON ACT III
-- MIGRATION 1: MINIMAL HACKATHON CORE SCHEMA & ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Target Supabase Project: ralion-amd-hackathon (uosaqcgfvmxzwpxekoov)
-- Region: eu-central-1
-- Execution Order: 1 of 2 (Schema must execute BEFORE seed data)
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TENANT ISOLATION CORE (Organizations, Workspaces, Profiles, Members)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'COMMUNITY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspaces (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  industry TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_workspace_slug UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VIEWER',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

-- ==============================================================================
-- 3. BUSINESS CONTEXT & MARI AI MEMORY (Strategic RAG)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  registration_number TEXT,
  industry TEXT,
  country TEXT,
  address TEXT,
  mission TEXT,
  vision TEXT,
  brand_voice TEXT,
  brand_colors TEXT[] DEFAULT ARRAY[]::TEXT[],
  target_audience TEXT,
  languages TEXT[] DEFAULT ARRAY['English']::TEXT[],
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::JSONB,
  competitors TEXT[] DEFAULT ARRAY[]::TEXT[],
  business_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_workspace_business_profile UNIQUE (workspace_id)
);

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. CREATIVE STUDIO & ASSET VAULT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.creative_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'image', 'video', 'copy', 'audio'
  url TEXT NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  input_prompt TEXT NOT NULL,
  output_result TEXT,
  media_url TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. MARKETING CAMPAIGNS & SOCIAL LEDGER
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  budget NUMERIC(12, 2) DEFAULT 0.00,
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  username TEXT,
  profile_image_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'PAGE',
  connection_status TEXT NOT NULL DEFAULT 'CONNECTED',
  token_status TEXT NOT NULL DEFAULT 'TOKEN_VALID',
  capabilities JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT,
  body TEXT NOT NULL,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  platforms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'DRAFT',
  platform_results JSONB DEFAULT '{}'::JSONB,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. DEMO WORKFLOWS & EXECUTION LEDGER
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.workflows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  action JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  triggered_by TEXT,
  output JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. TENANT CREDIT WALLET & LEDGER (AMD ROCm Compute Accounting)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_credit_wallets (
  organization_id TEXT PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'ENTERPRISE',
  plan_credits BIGINT NOT NULL DEFAULT 1000000,
  bonus_credits BIGINT NOT NULL DEFAULT 50000,
  total_balance BIGINT NOT NULL DEFAULT 1050000,
  monthly_quota BIGINT NOT NULL DEFAULT 1000000,
  lifetime_granted BIGINT NOT NULL DEFAULT 1050000,
  lifetime_consumed BIGINT NOT NULL DEFAULT 0,
  last_renewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_credit_ledger (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id TEXT,
  amount BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  type TEXT NOT NULL,
  source_feature TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. SECURITY DEFINER HELPER FUNCTIONS (Safe search_path & restricted execution)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(org_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.workspace_members wm ON wm.workspace_id = w.id
    WHERE w.organization_id = org_id
      AND wm.user_id = auth.uid()::text
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(TEXT) TO authenticated, service_role, anon;

REVOKE ALL ON FUNCTION public.is_org_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(TEXT) TO authenticated, service_role, anon;

-- ==============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES ON ALL 16 TABLES
-- ==============================================================================

-- Enable RLS across all 16 application tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 1. Organizations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'org_member_select') THEN
    CREATE POLICY org_member_select ON public.organizations FOR SELECT USING (public.is_org_member(id));
  END IF;

  -- 2. Workspaces
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'ws_member_select') THEN
    CREATE POLICY ws_member_select ON public.workspaces FOR SELECT USING (public.is_workspace_member(id) OR owner_id = auth.uid()::text);
    CREATE POLICY ws_owner_update ON public.workspaces FOR UPDATE USING (owner_id = auth.uid()::text);
  END IF;

  -- 3. Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select') THEN
    CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (true);
    CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE USING (id = auth.uid()::text);
  END IF;

  -- 4. Workspace Members
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_members' AND policyname = 'wm_member_select') THEN
    CREATE POLICY wm_member_select ON public.workspace_members FOR SELECT USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 5. Business Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'bp_member_select') THEN
    CREATE POLICY bp_member_select ON public.business_profiles FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY bp_member_write ON public.business_profiles FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 6. AI Memory
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_memory' AND policyname = 'ai_mem_member_select') THEN
    CREATE POLICY ai_mem_member_select ON public.ai_memory FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY ai_mem_member_write ON public.ai_memory FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 7. Creative Assets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creative_assets' AND policyname = 'ca_member_select') THEN
    CREATE POLICY ca_member_select ON public.creative_assets FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY ca_member_write ON public.creative_assets FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 8. AI Jobs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_jobs' AND policyname = 'ai_jobs_member_select') THEN
    CREATE POLICY ai_jobs_member_select ON public.ai_jobs FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY ai_jobs_member_write ON public.ai_jobs FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 9. Marketing Campaigns
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketing_campaigns' AND policyname = 'mc_member_select') THEN
    CREATE POLICY mc_member_select ON public.marketing_campaigns FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY mc_member_write ON public.marketing_campaigns FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 10. Social Connections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_connections' AND policyname = 'sc_member_select') THEN
    CREATE POLICY sc_member_select ON public.social_connections FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY sc_member_write ON public.social_connections FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 11. Social Posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_posts' AND policyname = 'sp_member_select') THEN
    CREATE POLICY sp_member_select ON public.social_posts FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY sp_member_write ON public.social_posts FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 12. Workflows
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflows' AND policyname = 'wf_member_select') THEN
    CREATE POLICY wf_member_select ON public.workflows FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY wf_member_write ON public.workflows FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 13. Workflow Executions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workflow_executions' AND policyname = 'wfe_member_select') THEN
    CREATE POLICY wfe_member_select ON public.workflow_executions FOR SELECT USING (public.is_workspace_member(workspace_id));
    CREATE POLICY wfe_member_write ON public.workflow_executions FOR ALL USING (public.is_workspace_member(workspace_id));
  END IF;

  -- 14. Tenant Credit Wallets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_credit_wallets' AND policyname = 'cw_member_select') THEN
    CREATE POLICY cw_member_select ON public.tenant_credit_wallets FOR SELECT USING (public.is_org_member(organization_id));
  END IF;

  -- 15. Tenant Credit Ledger
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_credit_ledger' AND policyname = 'cl_member_select') THEN
    CREATE POLICY cl_member_select ON public.tenant_credit_ledger FOR SELECT USING (public.is_org_member(organization_id));
  END IF;

  -- 16. Security Audit Logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_logs' AND policyname = 'sal_member_select') THEN
    CREATE POLICY sal_member_select ON public.security_audit_logs FOR SELECT USING (
      workspace_id IS NULL OR public.is_workspace_member(workspace_id)
    );
  END IF;
END $$;
