# Hostinger-compatible deployment (alternate)

> **Primary production target is AWS ECS Fargate.** See [`aws-ecs-deployment.md`](./aws-ecs-deployment.md).

## Plan

Use Hostinger Business Web Hosting or Cloud Startup+ with Node.js Web App support (Node 22) only when ECS is not used.

## Deploy

- GitHub → Hostinger auto-detect Next.js
- **Branch:** `main` (must include Tailwind packages in `dependencies`)
- **Node version:** `22.x`
- **Root directory:** `./`
- **Package manager:** `npm`
- **Build command:** `npm run build:hostinger`  
  (runs `npm install --include=dev && next build` so Hostinger production installs still get PostCSS/Tailwind)
- **Start:** `npm run start`
- **Output directory:** leave blank or `.next` (not a static export)
- App URL / env: `https://nxt-tst.duckdns.org`
- Production env vars in hPanel from `.env`
- Smoke-test `/api/health` after every deploy

## Common build failure

`Cannot find module '@tailwindcss/postcss'` means Hostinger built an old `main` where Tailwind lived in `devDependencies`. Keep `@tailwindcss/postcss`, `tailwindcss`, and `typescript` under `dependencies`.

## Hostinger-safe rules

- Immutable deployments
- Uploads → object storage only
- Sessions/state → MongoDB (not memory)
- No single in-process timer for critical work
- Prefer polling / SSE over WebSocket-only
- Protect cron routes with `CRON_SECRET` + replay protection

## Cron pattern

Hostinger cron (UTC) hits a protected endpoint → validate secret → lease due jobs from MongoDB → run idempotent handlers → complete / retry / dead-letter.
