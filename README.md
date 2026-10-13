# Ralion Adaptive — AMD Developer Hackathon ACT III

**One Business. Infinite Possibilities.**

An isolated hackathon edition of **Ralion OS**, developed by **Ras Ali Labs (Botswana)** for the **AMD Developer Hackathon ACT III** under **Create a New Kind of Experience**.

Ralion Adaptive explores how one business objective becomes multiple audience-specific marketing experiences through coordinated AI assistance, strategic segmentation, creative direction, and human-reviewed campaign drafts.

> **Status (13 October 2026):** The Ralion application snapshot and AMD monitoring code are merged into this repository's `main` branch. The independent Supabase schema, seed data, demo Auth users and workspace memberships have been created and checked on the hosted project. **Vercel deployment, browser login, real AMD inference, and end-to-end Mari → Growth → Social tests remain to be verified.** Offline fixtures and passing unit tests are not proof of live AMD inference.

## What we're demonstrating

Our fictional Botswana business, **Kalahari & Okavango Wilderness Expeditions**, has one commercial goal: reach more travellers with messages tailored to their needs.

| Audience | Demonstration campaign | Approach |
| --- | --- | --- |
| Luxury travellers | **Okavango Untamed — Private Concession Sanctuary** | Exclusivity, conservation, tailored luxury safari experiences |
| Budget-conscious adventurers | **Botswana Frontier — Mobile Expedition & Mokoro Trails** | Accessible adventure, hands-on exploration, mobile wilderness experiences |

These are **synthetic demonstration brands, budgets, and campaigns**, not real client data or evidence of actual bookings.

## Experience and architecture

- **Mari AI:** Business context, campaign briefs, reasoning and strategic guidance.
- **Growth:** Audience-specific positioning, campaign recommendations and messaging.
- **Social:** Channel-oriented drafts and human review. Live posting to real accounts is outside the default hackathon demo.
- **Creative Studio:** Creative direction and content workflows.
- **AMD AI Monitoring Centre:** A dashboard at `/amd-monitoring` to inspect provider connectivity, available models, run test prompts, view response latency, token counts, trace IDs and LIVE/FAILED/SIMULATED state. Dashboard routing may include a `/ralion` prefix depending on hosting configuration.

**Inference path:** Ralion Next.js server → server-side AMD Token Factory adapter → AMD Radeon API → model response and traceable monitoring metadata. Mari and Growth adapter routing is implemented but needs hosted end-to-end verification.

### AMD Token Factory

Documented base URL: `https://developer.amd.com.cn/radeon/api/v1`

- `GET /models` — discover available models.
- `POST /chat/completions` — run model inference.
- `GET /usage?include_recent=true` — inspect provider usage.

`RADEON_API_KEY` is **server-only**. Use the live model catalog rather than assuming a specific model is always available. When no key is configured, the app may return **clearly labelled fixtures**; these must never be presented as successful live inference. Shared Token Factory APIs do not expose trustworthy per-request MI300X GPU telemetry, so **do not claim hardware temperature, VRAM, ROCm version or tokens/sec as observed facts** unless measured independently.

## Repository structure

```text
apps/
  ralion/         Next.js application and API routes
packages/
  ai/             Mari, AMD adapter and AI services
  auth/           Authentication
  core/           Core logic and production-isolation guards
  database/       Database access
  integrations/   Integration adapters
  modules/        Business modules
  ui/             Shared UI
supabase/
  migrations/     Hackathon-only schema and demo seed
scripts/          Verification and secure demo provisioning
```

The Ras Ali Labs corporate website (`apps/website`), unrelated desktop/admin apps and production infrastructure are **not** part of this isolated hackathon deployment. The original source repository, [`rasali535/alinew`](https://github.com/rasali535/alinew), remains separate and must not be modified by hackathon work.

## Run locally

**Prerequisites:** Node.js 20+, npm 10+, and access to the dedicated *hackathon* Supabase project.

```bash
git clone https://github.com/rasali535/ralion-amd-hackathon.git
cd ralion-amd-hackathon
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local`. Review the example file before using it: **its ROCm/vLLM hardware fields are example placeholders, not evidence of a connected local GPU**. Do not configure production endpoints or copy production secrets. The local Next.js dev script uses port **6509**.

### Environment configuration

Set environment variables in your **local private environment** or **Vercel project settings**, never in tracked files:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uosaqcgfvmxzwpxekoov.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project's public legacy anon key if required by the app |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project's public publishable key if required by the app |
| `SUPABASE_SECRET_KEY` | Dedicated project's **server-only** secret key, if required |
| `RADEON_API_KEY` | **Server-only** AMD Token Factory API key |
| `AMD_TOKEN_FACTORY_URL` | `https://developer.amd.com.cn/radeon/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Actual application URL for the target environment |
| `NEXT_PUBLIC_RALION_API_URL` | Actual API/application base URL, where required |
| `DEMO_MODE`, `NEXT_PUBLIC_DEMO_MODE` | Explicit mock/demo behavior; confirm settings before claiming LIVE AMD output |

The exact necessary variables depend on the deployed code paths. **Never expose** `SUPABASE_SECRET_KEY` or `RADEON_API_KEY` through `NEXT_PUBLIC_` variables, logs, browser requests or committed configuration. Rotate any key exposed accidentally.

## Supabase: dedicated hackathon project

- **Project:** `ralion-amd-hackathon`
- **Project ref:** `uosaqcgfvmxzwpxekoov`
- **Region:** `eu-central-1`
- **Services:** Existing Supabase Postgres, Auth and Storage; **do not create a second Vercel/Neon/Postgres database**.
- **Hosted status:** Two schema/seed migrations applied; 16 RLS-enabled application tables, seven storage buckets, fictional safari campaigns and demo user/workspace bindings verified.

The following migrations are **already applied to the hosted project** (under hosted migration records); **do not re-run the SQL without reviewing migration history**:

```text
supabase/migrations/20261012100000_hackathon_minimal_schema_and_rls.sql
supabase/migrations/20261012110000_hackathon_synthetic_seed.sql
```

Demo accounts are provisioned via the server-side Supabase Auth Admin API, not direct `auth.users` SQL insertion. The provisioner is `npm run auth:provision-demo`; use only dedicated hackathon credentials and avoid re-provisioning unless needed. Browser login and real cross-tenant session tests are still outstanding.

## Vercel deployment

1. Import **[`rasali535/ralion-amd-hackathon`](https://github.com/rasali535/ralion-amd-hackathon)** from GitHub and select **`main`**.
2. Choose **Next.js**, with application directory **`apps/ralion`**. Because this is an **npm-workspaces monorepo**, enable access to files outside the selected root if Vercel requests it, and ensure installs resolve the root workspace lockfile and `packages/*` dependencies. Alternatively configure the project from the monorepo root with the root `npm run build` script and correct output discovery.
3. Configure only the dedicated Supabase and AMD environment variables described above; use the real Vercel domain for app URLs. **Never link production Ralion or Ras Ali Labs credentials**.
4. Build/deploy and inspect Vercel logs for missing environment variables, workspace resolution issues, Next.js route errors and isolation guard failures.
5. Test sign-in, dashboard data, `/amd-monitoring`, model discovery, a **genuine** Token Factory `/chat/completions` response, and the two safari audience flows.

A successful Vercel build is not equivalent to verified authentication or AMD inference. Do not submit a deployment URL as working until the browser-based smoke test passes.

## Validation commands

```bash
npm run typecheck
npm run build
npm run test
npm run test:migrations
npm run test:isolation
npm run test:monitoring
npm run test:amd-connectivity
npm run test:amd-routing
npm run security:secrets
```

Some verification scripts rely on **fixtures or isolated local PostgreSQL**. Live verification requires configured hosted credentials and explicit confirmation of real responses.

## Safety, limitations and next steps

- The original production repo `rasali535/alinew` and its data are **out of scope**. Connection guardrails reject known production endpoints.
- Use **synthetic data only**. No production customer information, live Meta publishing or actual billing in the hackathon demo.
- The monitoring throttle currently uses process memory; it is **not a distributed limit across serverless instances**. Use a shared backing store before exposing costly inference endpoints broadly.
- Real AMD inference is **pending validation**; do not confuse test-fixture latency, token counts or ROCm simulation with hardware measurements.
- Next milestones: **Vercel deploy → real Supabase login → AMD model discovery/inference → Mari/Growth audience demo → final video and submission**.

---

**Built in Botswana. Designed for businesses everywhere.**

Developed by **Ras Ali Labs** for the AMD Developer Hackathon ACT III.
