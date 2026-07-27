# Hostinger-compatible deployment (alternate)

> **Primary production target is AWS ECS Fargate.** See [`aws-ecs-deployment.md`](./aws-ecs-deployment.md).

## Plan

Use Hostinger Business Web Hosting or Cloud Startup+ with Node.js Web App support (Node 22) only when ECS is not used.

## Deploy

- GitHub → Hostinger auto-detect Next.js
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm run start`
- No static export, no custom Node server
- Production env vars in hPanel
- Deploy from protected production branch
- Smoke-test `/api/health` after every deploy

## Hostinger-safe rules

- Immutable deployments
- Uploads → object storage only
- Sessions/state → MongoDB (not memory)
- No single in-process timer for critical work
- Prefer polling / SSE over WebSocket-only
- Protect cron routes with `CRON_SECRET` + replay protection

## Cron pattern

Hostinger cron (UTC) hits a protected endpoint → validate secret → lease due jobs from MongoDB → run idempotent handlers → complete / retry / dead-letter.
