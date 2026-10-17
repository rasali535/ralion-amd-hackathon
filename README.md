# Ralion Adaptive — AMD Developer Hackathon ACT III

**One Business. Infinite Possibilities.**

An isolated hackathon edition of **Ralion OS**, developed by **Ras Ali Labs (Pty) Ltd (Botswana)** for the **AMD Developer Hackathon ACT III** under the theme **Create a New Kind of Experience**.

Ralion Adaptive explores how a single business goal transforms into multiple, audience-specific marketing experiences through intelligent AMD model routing, coordinated AI assistance, strategic segmentation, creative direction, and human-reviewed campaign drafts.

---

## 1. Live Deployment & Hackathon Access

- **Production Hosted Application:** [https://ralionos.vercel.app](https://ralionos.vercel.app/)
- **One-Click Anonymous Judge Access:** [https://ralionos.vercel.app/judge-access](https://ralionos.vercel.app/judge-access) (or `/ralion/judge-access`)
- **AMD AI Monitoring Centre:** [https://ralionos.vercel.app/ralion/amd-monitoring](https://ralionos.vercel.app/ralion/amd-monitoring)
- **Repository:** [https://github.com/rasali535/ralion-amd-hackathon](https://github.com/rasali535/ralion-amd-hackathon)
- **Dedicated Hackathon Supabase:** `uosaqcgfvmxzwpxekoov.supabase.co` (Region: `eu-central-1`)
- **Demo Workspace UUID:** `c0000000-0000-0000-0000-000000000001`
- **Demo Organization UUID:** `b0000000-0000-0000-0000-000000000001`

---

## 2. What We Are Demonstrating

Our fictional Botswana safari company, **Kalahari & Okavango Wilderness Expeditions**, has a single commercial goal: expand booking inquiries across distinct global traveler segments without generic or repetitive marketing messages.

| Dimension | Campaign A: Okavango Untamed | Campaign B: Botswana Frontier |
| :--- | :--- | :--- |
| **Target Audience** | International Luxury & Eco-Conscious Travelers | Adventure-Oriented & Budget-Conscious Travelers |
| **Value Proposition** | Ultra-exclusive private concession sanctuaries, conservation, bespoke fly-in safari luxury | Accessible overland exploration, mobile wilderness camps, authentic mokoro delta trails |
| **Brand Tone** | Understated, contemplative, bespoke, prestigious | Energetic, experiential, rugged, participatory |
| **Model Routing Strategy** | **Quality-First / Deep Context** (e.g. Qwen3.8-Flash-Next / DeepSeek-V3) | **Speed-First / High Throughput** (e.g. Llama-3-8B-Instruct / DeepSeek-V4-Flash) |

*All campaign metrics, customer profiles, budgets, and engagement numbers are synthetic fixtures designed specifically for judging evaluation, not actual customer data.*

---

## 3. Core Architecture: Adaptive Model Routing Engine

Ralion Adaptive features an autonomous **Adaptive Model Routing Engine** (`packages/ai/src/adaptiveModelRouter.service.ts`) integrated directly into the AMD Token Factory pipeline. Users do not need to manually configure or understand AI models—the system classifies each request and dynamically pairs it with the optimal AMD model:

1. **Deterministic Request Classification:** Evaluates enquiry intent, complexity (`LOW`, `MEDIUM`, `HIGH`), and output requirements (e.g. `SOCIAL_MEDIA_CAPTION`, `COMPARATIVE_REASONING`, `COMPLEX_PLANNING`, `CAMPAIGN_OPTIMIZATION`).
2. **Strategy Selection:**
   - **`SPEED` (High Throughput / Low Latency):** Routes short copy, social captions, and quick edits to lightweight models (`meta-llama/Meta-Llama-3-8B-Instruct`).
   - **`QUALITY` (Deep Context / Complex Reasoning):** Routes strategic marketing plans, multi-audience comparisons, and competitive analysis to high-capacity reasoning models (`Qwen3.8-Flash-Next`, `deepseek-ai/DeepSeek-V3`).
   - **`COST` (Budget-Preserving):** Minimizes token consumption when evaluating large document fragments.
   - **`BALANCED`:** Standard equilibrium balancing response speed and contextual richness (`DeepSeek-V4-Flash-0731`).
3. **Dynamic Catalog Discovery:** Queries `GET /models` from AMD Token Factory to ensure routing selections map strictly to models currently available in AMD's live cluster.
4. **Transparent Rationale & Attribution:** Every inference response attaches routing metadata (`model`, `strategy`, `complexity`, `rationale`, `traceId`, `latencyMs`, `usage`).
5. **Operator Manual Override:** Operators can explicitly select a specific model or strategy from the UI, with full provenance retained in telemetry ledgers.

---

## 4. Genuine AMD Inference & Token Factory Integration

Ralion Adaptive interfaces with the AMD Token Factory via server-only services:

- **Base URL:** `https://developer.amd.com.cn/radeon/api/v1`
- **Supported Operations:**
  - `GET /models` — Live catalog discovery.
  - `POST /chat/completions` — Genuine chat completion dispatch.
  - `GET /usage` — Token consumption ledger.
- **Server-Only Security:** `RADEON_API_KEY` is strictly confined to server-side execution (`packages/ai/src/amdTokenFactory.service.ts`) and is never leaked via `NEXT_PUBLIC_` variables or client bundles.
- **Truth in Provenance:**
  - **Live Inference:** When `RADEON_API_KEY` is present on the server, requests execute against the AMD cluster, returning `isRealAmdInference: true`, `isFixture: false`, true latency measurements, and provider token counts.
  - **Demonstration Fixtures:** When running locally without an AMD API key, the service returns clearly labeled offline fixtures (`isRealAmdInference: false`, `isFixture: true`) and explicitly states `TEST_FIXTURE` in response headers.
- **Quota & Cost Guardrails:** Shared quota limits of **8 requests per guest per day** and **200 requests globally per day** are enforced by Supabase database procedures (`reserve_hackathon_inference`) with distributed memory fallback, preventing accidental denial-of-service or unexpected compute costs.

---

## 5. Judge Experience Walkthrough

Judges can complete a full evaluation journey in under 5 minutes:

1. **Enter Demonstration:** Navigate to [`https://ralionos.vercel.app/judge-access`](https://ralionos.vercel.app/judge-access) and click **Enter Demo**. An anonymous Supabase session is created, granting `viewer` role access to workspace `c0000000-0000-0000-0000-000000000001`.
2. **Dashboard Command Centre:** View Kalahari & Okavango Wilderness Expeditions' synthetic executive KPIs, audience breakdown, and campaign summaries.
3. **Mari AI Strategy Consultation:** Navigate to **Mari AI** (`/ralion/mari-ai`). Inquire about safari strategy (e.g. *"Analyze how we should position our Okavango Untamed luxury camp against our budget Botswana Frontier mobile safari"*). Inspect the AMD-generated response and the routing pill displaying the active model and rationale.
4. **Growth Strategy Studio:** Navigate to **Growth** (`/ralion/growth`). Compare the two generated safari campaigns side-by-side to observe distinct tone, target audiences, and messaging strategies.
5. **Creative Studio & Social Review:** Inspect generated social posts, imagery direction, and channel distribution drafts. Note that publishing capabilities are safely read-only for demo guests.
6. **AMD AI Monitoring Centre:** Navigate to **AMD Monitoring** (`/ralion/amd-monitoring`). Inspect live AMD Token Factory connection status, active model catalog, recent trace IDs, latency graphs, and token telemetry logs.

---

## 6. Repository Structure & Workspace Layout

```text
ralion-amd-hackathon/
├── apps/
│   └── ralion/                 # Next.js 15 App Router web application
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/ # Main application pages (dashboard, mari-ai, growth, amd-monitoring)
│       │   │   ├── api/         # Secure Next.js API routes (mari/chat, ai/amd/token-factory, reports/overview)
│       │   │   └── layout.tsx   # Top-level layout and hydration guards
│       │   └── components/      # UI components & tour guides
│       └── next.config.js       # BasePath configuration and URL redirect guards
├── packages/
│   ├── ai/                      # AMD Token Factory adapter, Adaptive Model Router & telemetry
│   ├── auth/                    # Client/server authentication, guest permission guards & context
│   ├── core/                    # Isolation validators & production guardrails
│   ├── database/                # Supabase database client utilities
│   └── ui/                      # Ralion UI design system (TailwindCSS/vanilla UI components)
├── supabase/
│   └── migrations/              # Minimal standalone hackathon migrations & synthetic seed
├── scripts/                     # 8 Automated validation & verification suites
└── package.json                 # Monorepo workspaces configuration
```

---

## 7. Local Reproduction & Verification

### Prerequisites
- **Node.js:** `v20.x` or `v22.x`
- **npm:** `v10.x` or later

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/rasali535/ralion-amd-hackathon.git
cd ralion-amd-hackathon

# Install workspace dependencies
npm ci

# Configure environment template
cp .env.example .env.local

# Run the local Next.js development server (default port 6509)
npm run dev
```

### Full Verification Test Suite
Run the 8 independent verification scripts to validate all architectural invariants:

```bash
# 1. TypeScript compilation check (0 errors)
npm run typecheck

# 2. ESLint code standard verification (0 errors)
npm run lint

# 3. Next.js production build verification
npm run build

# 4. Run all automated tests
npm test

# 5. Verify Adaptive Model Routing Engine
npm run test:amd-routing

# 6. Verify AMD Token Factory connectivity & model catalog
npm run test:amd-connectivity

# 7. Verify AMD Monitoring Centre telemetry ledger
npm run test:monitoring

# 8. Verify Database isolation & strict tenant boundaries
npm run test:isolation
```

---

## 8. Intellectual Property & MIT Licensing

This repository is submitted to the **AMD Developer Hackathon ACT III** under the standard **MIT License**.

- **Copyright:** Copyright (c) 2026 Ras Ali Labs (Pty) Ltd.
- **Approved Open-Source Scope:** The MIT license applies to the Ralion Adaptive hackathon submission, including:
  - The Adaptive Model Routing Engine (`packages/ai/src/adaptiveModelRouter.service.ts`)
  - The AMD Token Factory adapter, telemetry ledger, and ROCm utilities (`packages/ai/src/amdTokenFactory.service.ts`)
  - The Hackathon UI components, dashboard, guided safari exploration tour, and monitoring pages (`apps/ralion/src/*`)
  - The Hackathon database schema and synthetic safari seed migrations (`supabase/migrations/*`)
  - All test, validation, and verification suites (`scripts/*`)
- **Proprietary Commercial Reservation:** Commercial payment tokenization vaults, live social network connector credentials, enterprise vertical OS editions (Healthcare, Logistics, Government), and the proprietary Universal Cognitive Core (`mariUniversalCore.ts`) belong exclusively to **Ras Ali Labs (Pty) Ltd** and remain preserved in the separate commercial repository (`rasali535/alinew`).

---

**Built with pride in Botswana. Empowering intelligent marketing experiences worldwide.**  
*Developed by Ras Ali Labs (Pty) Ltd for the AMD Developer Hackathon ACT III.*
