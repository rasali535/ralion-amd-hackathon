# Ralion OS — AMD Hackathon Edition

An isolated competition development project by **Ras Ali Labs**, for AMD Developer Hackathon ACT III.

## Scope

This repository will contain **only the Ralion OS application** and the minimum backend, shared packages, scripts, and configuration needed to run it.

Source reference: [rasali535/alinew](https://github.com/rasali535/alinew). The original repository and production deployment must remain unchanged.

**Included (subject to dependency audit):**
- `apps/ralion` (Next.js dashboard, Mari, Growth, Social and Creative Studio)
- Required `packages/` workspaces (AI, authentication, core, database, integrations, modules, UI)
- Required `server/` code and development/build tooling
- New AMD ROCm/vLLM inference integration and an isolated demonstration environment

**Excluded:**
- `apps/website` (Ras Ali Labs marketing website)
- Unrelated apps, desktop distribution, company portfolio, production infrastructure, live billing and Meta publishing
- Real customer information, tokens, credentials and production environment configurations

## Isolation and safety

1. Do not point the demo at production Supabase, Meta, billing, email, storage or API services.
2. Use synthetic data, separate credentials and mock integrations by default.
3. Never commit `.env` files, generated build files, private keys, customer exports, or production deployment secrets.
4. Keep all deployment workflows disabled until reviewed.
5. Before importing source, check licensing, dependencies, and existing hardcoded production URLs or IDs.
6. Do not migrate the source repository's Git history into this public repository.
7. Do not modify or create pull requests against `rasali535/alinew` during hackathon development.

## Planned hackathon development

- AMD GPU-hosted model inference using ROCm and vLLM
- Mari: campaign reasoning and content strategy
- Growth: audience-specific alternatives and evaluation
- Social: prepared publication drafts with human approval, not live publishing
- Demo metrics: inference latency, cost, quality and output provenance

## Current status

**Foundation only.** The original Ralion application has **not** yet been migrated. Import the audited application snapshot only after the safety review. See the repository's migration issue for the implementation checklist.
