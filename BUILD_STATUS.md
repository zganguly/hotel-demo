# Build Status

## Current phase

Phase 1 foundation complete through scaffolded modules; deepening domain workflows continues.

## Completed features

- Cursor rules (`.cursor/rules/*.mdc`)
- "Midnight Tower" brand mark + wordmark (`src/components/brand/logo.tsx`), SVG favicon (`src/app/icon.svg`), Apple touch icon; wired into landing, login, sidebar
- Spec split into 30 parts under `spec-parts/` (executed and removed as completed)
- Next.js 16 + TypeScript + Tailwind 4 scaffold
- Midnight Hospitality tokens, Manrope / Cormorant Garamond
- Marketing landing with "Midnight Booking" Three.js scene (hotel tower, twinkling room windows, booking pulses) + Anime.js hero (reduced-motion safe)
- Login with centered form over full-screen "Night Check-in" scene (key card, reception bell, lit hotel facade) + Anime.js form entrance; both 3D scenes are aspect-responsive for mobile
- Left navigation (272/80), app shell, top bar, page header, status badges
- Domain libs: money, hotel dates, authorize, logging, API envelope
- Mongo models: properties, userAccess, rooms/types/inventory, reservations/holds/assignments, guests, folios, jobs/outbox/audit/approvals
- Availability search service + `/api/v1/availability`
- Better Auth route (`/api/auth/[...all]`) with Mongo or memory adapter; login uses real `signIn.email`, middleware protects `/app/*`, sign-out clears session (fixes login redirect loop)
- Health/ready + protected cron dispatcher
- Rich demo seed: ~90 guests/property, ~300+ reservations spanning past 20 days + next 30 days, folios + ledger lines
- New reservation: stylish multi-room picker + required government ID upload; persists guest, rooms, folio, and ID file metadata
- Reservation details page with money receipt (folio charges, payments, balance, print)
- Full analytics dashboard: hero KPI band (occupancy, ADR, RevPAR, collections), operational count blocks, occupancy trend chart (±14 days), charges-vs-payments chart, booking status donut, source mix, room-type occupancy chart, mini month calendar with arrival heat, recent payments, and next-arrivals table (Recharts, live Mongo aggregates)
- AI Analysis owner briefing page (static)
- Vitest domain tests + Playwright smoke/a11y config
- All former "Module scaffold is ready" placeholder pages replaced with live/demo operational screens: housekeeping, maintenance, guest requests, room status, rates & inventory, night audit, stock & purchasing, reports, groups, administration overview, and the new-reservation form (working client form with validation, no scaffold text remains anywhere under `src/app/(app)/app/[propertySlug]/`)
- Previously-missing nested nav routes now exist and render real content: reservations/waitlist, front-desk/room-queue, requests/lost-and-found, rates/packages, rates/channels, guests/companies, guests/agents, billing/cashier, billing/ar, admin/staff, admin/property, admin/users, admin/taxes, admin/integrations, admin/audit, admin/tools
- These screens mix live Mongo-backed data (reservations, rooms, folios, room types/inventory, UserAccess, audit events, job/outbox queues) with clearly-labeled deterministic demo data where no domain model exists yet (stock items, lost & found, packages, companies, agents, staff roster, tax rules, integrations, cashier tender split)
- AWS ECS Fargate deployment path: `output: "standalone"`, multi-stage `Dockerfile`, ECR/task-def templates under `deploy/aws/`, runbook `docs/architecture/aws-ecs-deployment.md`, GitHub Actions `.github/workflows/deploy-ecs.yml`

## In-progress features

- Full transactional booking/check-in/checkout/night-audit services (new-reservation form is UI-only; no POST endpoint yet)
- Rate calendar, restrictions, and channel sync
- Rich data tables and tape chart interactions
- Production Better Auth invitation + 2FA enforcement wiring to UserAccess

## Known limitations

- Login currently demos redirect without full session→UserAccess binding UI
- Seed requires `MONGODB_URI`
- Several operational pages (stock, lost & found, packages, channels, companies, agents, staff, taxes, integrations, cashier tender split) render deterministic demo content because no backing domain model/collection exists yet — these are clearly demo, not scaffold placeholders
- E2E suite requires local server and has not been CI-hardened yet

## Required environment variables

See `.env.example` — notably `MONGODB_URI`, `BETTER_AUTH_SECRET`, `CRON_SECRET`, payment/email/storage keys for production.

## Latest test/build result

- Unit tests: passing (`npm test` — 6/6)
- TypeScript: clean (`npx tsc --noEmit` and via `next build`)
- Production build: **passing** (Next.js 16.2.11) — 2026-07-24
- Manually smoke-tested all 27 replaced/new property routes against the running dev server (200 OK, no scaffold text, no rendered error boundaries)
