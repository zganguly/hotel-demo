# API conventions

- Base path: `/api/v1`
- Authenticate + authorize on the server
- Validate with Zod
- Call domain services (not repositories from handlers)
- Response envelope:

```ts
{ ok: true, data: T, meta?: object }
{ ok: false, error: { code, message, details? } }
```

## Standard error codes

`UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION`, `NOT_FOUND`, `CONFLICT`, `REQUIRES_APPROVAL`, `RATE_LIMITED`, `INTERNAL`

## Implemented routes (foundation)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| GET | `/api/ready` | Readiness |
| ALL | `/api/auth/[...all]` | Better Auth |
| GET | `/api/v1/availability` | Stay availability search |
| POST | `/api/internal/cron` | Protected job dispatcher |
