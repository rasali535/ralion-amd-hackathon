-- Restrict anonymous Supabase guest identities from modifying demo content.
-- This is additive and must be applied before enabling guest dashboard access.
DO $$
DECLARE t TEXT; op TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations','workspaces','business_profiles','ai_memory','creative_assets','ai_jobs','marketing_campaigns','social_connections','social_posts','workflows','workflow_executions','profiles','workspace_members'] LOOP
    FOREACH op IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='guest_block_' || lower(op)) THEN
        EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR %s TO authenticated %s',
          'guest_block_' || lower(op), t, op,
          CASE WHEN op='INSERT' THEN 'WITH CHECK' ELSE 'USING' END || ' ((auth.jwt() ->> ''is_anonymous'') IS DISTINCT FROM ''true'')');
      END IF;
    END LOOP;
  END LOOP;
END $$;
