-- ==============================================================================
-- RALION OS — AMD DEVELOPER HACKATHON ACT III
-- LOCAL DEVELOPMENT SEED FILE (supabase/seed.sql)
-- ==============================================================================
-- Target Supabase Project: ralion-amd-hackathon (uosaqcgfvmxzwpxekoov)
-- Region: eu-central-1
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

-- 2. Supabase Auth User Provisioning
-- SECURITY ENFORCEMENT: Direct credential insertion into auth.users is removed to eliminate credential exposure in SQL seeds.
-- Demonstration and administrative users are provisioned exclusively through supported Supabase Auth mechanisms
-- (e.g., scripts/provision-demo-users.js using supabase.auth.admin.createUser).

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
    'Kalahari & Okavango Expeditions Lab',
    'okavango-expeditions-lab',
    'a0000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
  ),
  (
    'demo-workspace-ralion-amd-2026',
    'demo-org-ralion-amd-2026',
    'Kalahari & Okavango Expeditions Lab',
    'okavango-expeditions-lab-alias',
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

-- 7. Synthetic Business Profiles: Fictional Botswana Safari Company
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
    'Kalahari & Okavango Wilderness Expeditions',
    'Eco-Tourism & Wildlife Conservation Expeditions',
    'To deliver transformative African wildlife experiences across the Okavango Delta, Moremi Game Reserve, and Makgadikgadi Pans while directly funding habitat preservation and community wildlife stewardship.',
    'To set the gold standard for regenerative, low-impact safari travel in Southern Africa, connecting global travellers with Botswana''s pristine untamed wilderness.',
    'Evocative, Inspiring, Conservation-Led, Authentic, Grounded',
    ARRAY['#C49A45', '#1B3B2B', '#E6D7B9', '#8C4B27'],
    'Two distinct traveller profiles: (1) Luxury Wilderness Travellers seeking private delta concessions, bespoke photographic safaris, and 5-star conservation lodges; (2) Budget-Conscious Adventure Travellers seeking participatory mobile camping expeditions, guided mokoro dugout canoe trails, and small-group overlanding.',
    ARRAY['Wilderness Safaris', 'andBeyond Botswana', 'Belmond Safaris', 'Desert & Delta Safaris'],
    ARRAY['Increase direct international bookings for Okavango Delta fly-in safaris by 40%', 'Launch community-guided mobile eco-camps for adventure travellers', 'Maintain 100% solar and carbon-neutral lodge operations'],
    NOW()
  ),
  (
    'demo-biz-profile-apex-2026',
    'demo-workspace-ralion-amd-2026',
    'Kalahari & Okavango Wilderness Expeditions',
    'Eco-Tourism & Wildlife Conservation Expeditions',
    'To deliver transformative African wildlife experiences across the Okavango Delta, Moremi Game Reserve, and Makgadikgadi Pans while directly funding habitat preservation and community wildlife stewardship.',
    'To set the gold standard for regenerative, low-impact safari travel in Southern Africa, connecting global travellers with Botswana''s pristine untamed wilderness.',
    'Evocative, Inspiring, Conservation-Led, Authentic, Grounded',
    ARRAY['#C49A45', '#1B3B2B', '#E6D7B9', '#8C4B27'],
    'Two distinct traveller profiles: (1) Luxury Wilderness Travellers seeking private delta concessions, bespoke photographic safaris, and 5-star conservation lodges; (2) Budget-Conscious Adventure Travellers seeking participatory mobile camping expeditions, guided mokoro dugout canoe trails, and small-group overlanding.',
    ARRAY['Wilderness Safaris', 'andBeyond Botswana', 'Belmond Safaris', 'Desert & Delta Safaris'],
    ARRAY['Increase direct international bookings for Okavango Delta fly-in safaris by 40%', 'Launch community-guided mobile eco-camps for adventure travellers', 'Maintain 100% solar and carbon-neutral lodge operations'],
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  industry = EXCLUDED.industry,
  mission = EXCLUDED.mission,
  vision = EXCLUDED.vision,
  brand_voice = EXCLUDED.brand_voice,
  brand_colors = EXCLUDED.brand_colors,
  target_audience = EXCLUDED.target_audience,
  competitors = EXCLUDED.competitors,
  business_goals = EXCLUDED.business_goals,
  updated_at = NOW();

-- 8. Synthetic Marketing Campaigns (Distinct Objectives, Messaging & Creative Directions)
INSERT INTO public.marketing_campaigns (
  id,
  workspace_id,
  title,
  target_platform,
  status,
  budget,
  description,
  metadata,
  start_date,
  end_date,
  created_at
)
VALUES
  (
    'demo-camp-luxury-safari-2026',
    'c0000000-0000-0000-0000-000000000001',
    'Okavango Untamed — Private Concession Sanctuary',
    'instagram',
    'ACTIVE',
    35000.00,
    'Luxury audience acquisition targeting high-net-worth travellers and honeymooners for bespoke fly-in private delta lodges.',
    '{
      "target_segment": "luxury_travellers",
      "objective": "Drive qualified high-value inquiries for bespoke fly-in luxury tented camp itineraries in private delta concessions.",
      "messaging": "Exclusive seclusion in the heart of the Okavango Delta. Wake to the call of the fish eagle in your private open-air suite, followed by private game tracking and sunset mokoro excursions. Rare, refined, and entirely untouched.",
      "creative_direction": "Golden-hour aerial photography of water channels, intimate candlelit boma dinners, elegant tented suite wooden decks over water lily lagoons, high-contrast wildlife portraits (leopard resting on ebony branch)."
    }'::jsonb,
    NOW(),
    NOW() + INTERVAL '45 days',
    NOW()
  ),
  (
    'demo-camp-adventure-safari-2026',
    'c0000000-0000-0000-0000-000000000001',
    'Botswana Frontier — Mobile Expedition & Mokoro Trails',
    'x',
    'ACTIVE',
    12000.00,
    'Adventure audience acquisition targeting overlanders, backpackers, and small-group wildlife explorers.',
    '{
      "target_segment": "budget_adventure_travellers",
      "objective": "Drive seasonal bookings for participatory mobile guided camping safaris across Chobe and Moremi.",
      "messaging": "Real Africa, unplugged and unfiltered. Sleep beneath a canopy of stars in Makgadikgadi and navigate pristine delta channels with local BaYei guides. Maximum wildlife, zero luxury tax.",
      "creative_direction": "Raw, dynamic action shots of Land Cruiser river crossings, campfire storytelling under the Milky Way, guides poling traditional mokoros through papyrus reedways, herd of elephants crossing the Chobe riverfront."
    }'::jsonb,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  budget = EXCLUDED.budget,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- 8b. Strategic AI Memory for Audience Segments
INSERT INTO public.ai_memory (
  id,
  workspace_id,
  category,
  content,
  confidence,
  metadata,
  created_at
)
VALUES
  (
    'mem-audience-luxury-2026',
    'c0000000-0000-0000-0000-000000000001',
    'AUDIENCE_SEGMENT_LUXURY',
    'Luxury Wilderness Travellers Segment Profile: High-net-worth travellers, affluent couples, and honeymooners. High willingness to pay ($8,000–$15,000/person). Values complete seclusion, private guides, aerial transfers, fine dining in the bush, and low-density private concessions. Preferred touchpoints: curated Instagram carousels, bespoke concierge itineraries, and direct conservation impact reporting.',
    1.0,
    '{"segment":"luxury_travellers","avg_booking_usd":11500,"primary_channel":"instagram"}'::jsonb,
    NOW()
  ),
  (
    'mem-audience-adventure-2026',
    'c0000000-0000-0000-0000-000000000001',
    'AUDIENCE_SEGMENT_ADVENTURE',
    'Budget-Conscious Adventure Travellers Segment Profile: Independent overlanders, self-drive enthusiasts, student researchers, and wildlife photographers. Budget sensitive ($850–$2,200/person). Values authentic participatory camping, guide expertise, walking trails, and traditional mokoro canoe wilderness access. Preferred touchpoints: community travel forums, YouTube expedition logs, and high-energy social video.',
    1.0,
    '{"segment":"budget_adventure_travellers","avg_booking_usd":1450,"primary_channel":"x"}'::jsonb,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata;

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
