# Technical Architecture

## Style

Modular Next.js monolith:

- Marketing website, auth, Admin/Manager dashboard, Route Handler APIs, public booking engine, protected internal cron endpoints in one app
- MongoDB Atlas for operational data
- External providers for payments, email/SMS, object storage, channel management, error monitoring

## Runtime

| Choice | Value |
| --- | --- |
| Node.js | 22.x |
| Framework | Next.js 16.x App Router |
| API | Route Handlers under `/api/v1` |
| Language | TypeScript `strict: true` |
| Package manager | npm |
| Build / start | `next build` / `next start` (no custom server) |
| Database | MongoDB Atlas replica set |
| ODM | Mongoose (+ native sessions for transactions) |

## Request flow

UI → Route Handler / Server Action → Auth + permission → Zod validation → Domain service → Repository → MongoDB Atlas  
Service → Outbox event → Cron dispatcher → Email / payment / channel

## Domain-layer mutation contract

1. Authenticate session  
2. Resolve active property  
3. Authorize account type, property scope, module permission, financial limit  
4. Parse/validate with Zod  
5. Load current state  
6. Enforce domain rules  
7. Atomic DB changes  
8. Audit + outbox in same transaction where appropriate  
9. Commit  
10. Enqueue non-critical external effects  
11. Return stable API response  
