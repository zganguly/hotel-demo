# Architectural Decisions

Decisions below follow `hotel-management-system-cursor-build-specification.md`. Do not silently change them.

## ADR-001 — Spec as source of truth

- **Decision:** The build specification (and its `spec-parts/` execution slices) is the product and engineering source of truth.
- **Date:** 2026-07-24

## ADR-002 — Working method

- **Decision:** Build in phases; keep the app runnable after every phase; maintain BUILD_STATUS.md and DECISIONS.md; use deterministic fictional demo data only; never expose secrets or real guest data.
- **Date:** 2026-07-24

## ADR-003 — Product scope

- **Decision:** Ship a production-usable single-property PMS first; keep schema/permissions multi-property-ready; demo seeds two properties. Account types are only ADMIN and MANAGER. Defer full GL, payroll, restaurant ERP, banquet CRM, every-OTA native integrations, and unsupervised AI pricing.
- **Date:** 2026-07-24

## ADR-004 — Modular Next.js monolith

- **Decision:** Single Next.js 16 App Router app (marketing, auth, dashboard, `/api/v1`, booking, internal cron). MongoDB Atlas + Mongoose. No custom Express server. Server Components by default; Client Components only for interactive widgets.
- **Date:** 2026-07-24

## ADR-005 — Technology stack

- **Decision:** Next.js 16 + React (required version) + TypeScript strict + Tailwind CSS 4 + shadcn/ui + Lucide + RHF + Zod + TanStack Query/Table + Recharts + Mongoose + Better Auth + date-fns/tz + Anime.js 4 + Three.js / R3F / Drei + Pino. Avoid multiple UI kits, second animation libs for same purpose, Redux, custom Express, local Hostinger filesystem uploads. State: URL params, TanStack Query, local React/Zustand prefs only, RHF, MongoDB for durable state.
- **Date:** 2026-07-24

## ADR-006 — AuthZ model

- **Decision:** Only ADMIN and MANAGER. Application authorization lives in `userAccess` separate from Better Auth user records. Central `authorize()` returns allowed | denied | requires_approval. Permission strings are explicit module.action names.
- **Date:** 2026-07-24

## ADR-007 — Inventory and money

- **Decision:** Stay nights are `[arrival, departure)`. Inventory is room-type/day documents with transactional holds. Physical room-nights use unique partial indexes on ACTIVE assignments. Money is integer minor units with currency.
- **Date:** 2026-07-24

## ADR-008 — Background work

- **Decision:** Protected cron hits `/api/internal/cron` with `CRON_SECRET`; MongoDB jobs are leased idempotently. On AWS ECS, EventBridge Scheduler triggers the endpoint; Hostinger cron remains the alternate. Outbox pattern for external effects. No permanent second Node worker required.
- **Date:** 2026-07-24
- **Updated:** 2026-07-26 — ECS EventBridge as primary scheduler when deploying to AWS.

## ADR-009 — First production scope

- **Decision:** Launch core PMS workflows before channel/POS/purchasing/advanced RM expansions. See `docs/product/first-production-scope.md`.
- **Date:** 2026-07-24

## ADR-010 — AWS ECS Fargate deployment

- **Decision:** Primary production runtime is **AWS ECS on Fargate** behind an ALB, images in ECR, secrets in Secrets Manager, logs in CloudWatch, uploads in S3, data in MongoDB Atlas. Next.js uses `output: "standalone"` with a multi-stage Docker image (Node 22). Hostinger Node Web Apps remain an alternate documented path.
- **Date:** 2026-07-26
