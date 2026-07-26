# Hotel PMS

Midnight Hospitality — Next.js 16 hotel property management system.

## Stack

- Next.js 16 App Router + TypeScript
- MongoDB Atlas + Mongoose
- Better Auth
- Tailwind CSS 4 + Lucide
- Three.js / React Three Fiber + Anime.js 4
- Vitest + Playwright

## Quick start

```bash
cp .env.example .env.local
# set MONGODB_URI and secrets
npm install
npm run dev
```

Demo seed (non-production):

```bash
DEMO_SEED_PASSWORD='ChangeMe-Demo-Only!' npm run seed
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production build/start |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit/integration |
| `npm run test:e2e` | Playwright |
| `npm run seed` | Deterministic demo data |

## Spec execution

The master specification was split into `spec-parts/` and executed sequentially. Completed parts are deleted after implementation. Keep `BUILD_STATUS.md` and `DECISIONS.md` current.

## Accounts

Only `ADMIN` and `MANAGER`. Demo users are documented in the seed script (`*.aureliastay.example`).
