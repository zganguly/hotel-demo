# AWS ECS (Fargate) deployment

Primary production target for Hotel PMS. Hostinger remains documented as an alternate path in `hostinger-deployment.md`.

## Topology

```
Internet → ALB (HTTPS) → ECS Fargate service (Next.js :3000)
                              ↓
                     MongoDB Atlas (private or public IP allowlist)
                              ↓
              S3 (uploads) · Secrets Manager · CloudWatch Logs
EventBridge Scheduler → ALB /internal/cron (CRON_SECRET header)
```

| Piece | Choice |
| --- | --- |
| Compute | ECS on **Fargate** (no EC2 to manage) |
| Image | ECR `hotel-pms` |
| Runtime | Node 22 Alpine, Next.js `output: "standalone"` |
| Port | `3000` |
| LB | Application Load Balancer + ACM certificate |
| Secrets | AWS Secrets Manager → task `secrets` |
| DB | MongoDB Atlas (same region as ECS when possible) |
| Uploads | S3 via `OBJECT_STORAGE_*` (never container filesystem) |
| Cron | EventBridge → `POST /api/internal/cron` with `CRON_SECRET` |
| Logs | CloudWatch `/ecs/hotel-pms` |

Suggested starter size: **0.5 vCPU / 1 GB** (raise to 1 vCPU / 2 GB under load).

## Prerequisites

1. AWS account + IAM permission for ECR, ECS, ELB, Secrets Manager, CloudWatch, IAM.
2. VPC with **2+ public subnets** (ALB) and **2+ private subnets** (tasks) recommended.
3. MongoDB Atlas cluster; allow ECS NAT / task egress IPs (or Atlas PrivateLink).
4. Domain + Route 53 (or external DNS) for ACM validation.
5. GitHub OIDC role for CI (or long-lived deploy user — OIDC preferred).

## One-time AWS setup

### 1. ECR

```bash
aws ecr create-repository --repository-name hotel-pms --image-scanning-configuration scanOnPush=true
```

### 2. Secrets

Store at least:

- `hotel-pms/mongodb-uri`
- `hotel-pms/better-auth-secret`
- `hotel-pms/encryption-key`
- `hotel-pms/cron-secret`
- `hotel-pms/internal-webhook-secret`

Also set non-secret env on the task or service:

- `APP_URL` / `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` = public HTTPS origin
- `MONGODB_DB_NAME`
- Object storage / payment / email keys when those providers go live

### 3. IAM

- **ecsTaskExecutionRole** — pull from ECR, write logs, read Secrets Manager.
- **hotelPmsTaskRole** — least privilege for S3 upload bucket (and SES/SNS later).

### 4. Cluster + ALB

1. Create ECS cluster `hotel-pms`.
2. Create ALB + target group (HTTP health check path `/api/health`, port 3000).
3. Listener 443 → target group (ACM cert).
4. Security groups: ALB 443 from internet; tasks 3000 only from ALB SG.

### 5. Task definition + service

1. Copy `deploy/aws/ecs-task-definition.json`.
2. Replace `ACCOUNT_ID`, `REGION`, secret ARNs, role ARNs, image URI.
3. Register task definition.
4. Create Fargate service (desired count ≥ 2 for HA), attach to ALB target group, private subnets + egress.

### 6. Cron

Create an EventBridge Scheduler (or rule) every minute (or as needed):

```http
POST https://YOUR_DOMAIN/api/internal/cron
x-cron-secret: <CRON_SECRET>
```

Header must match `src/app/api/internal/cron/route.ts` (`x-cron-secret`).

## Build and run locally (parity)

```bash
docker build -t hotel-pms:local --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 .
docker run --rm -p 3000:3000 \
  -e MONGODB_URI \
  -e MONGODB_DB_NAME \
  -e BETTER_AUTH_SECRET \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -e APP_URL=http://localhost:3000 \
  hotel-pms:local
curl -s http://localhost:3000/api/health
```

## CI / CD

Workflow: `.github/workflows/deploy-ecs.yml`

1. On push to `main` (or `workflow_dispatch`): typecheck / lint / test / build image.
2. Push to ECR with git SHA tag + `latest`.
3. Render task definition with new image.
4. `aws ecs update-service --force-new-deployment`.
5. Wait for service stability; fail the job if rollout fails.

Required GitHub secrets / vars:

| Name | Purpose |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | OIDC role ARN |
| `AWS_REGION` | e.g. `ap-south-1` |
| `ECR_REPOSITORY` | `hotel-pms` |
| `ECS_CLUSTER` | `hotel-pms` |
| `ECS_SERVICE` | `hotel-pms` |
| `ECS_TASK_DEFINITION` | family name `hotel-pms` |

## ECS-safe rules

- Immutable task revisions — never mutate a running container for code.
- Uploads → **S3 only** (`OBJECT_STORAGE_*`).
- Sessions / durable state → **MongoDB**, not in-memory.
- No single in-process timer for critical work — use EventBridge + leased Mongo jobs.
- Prefer polling / SSE over WebSocket-only.
- Protect cron with `CRON_SECRET` + replay protection.
- Redact secrets from CloudWatch (never log Mongo URI, auth secrets, card data).

## Post-deploy checklist

- [ ] `GET /api/health` → `{ "status": "ok", "timestamp": "..." }`
- [ ] `GET /api/ready` → DB connected
- [ ] Login as Admin and Hotel Manager
- [ ] New reservation + ID upload (S3 path)
- [ ] Dashboard loads analytics
- [ ] Cron lease runs without 401
- [ ] CloudWatch shows no crash loops
- [ ] Previous task revision kept for rollback

## Rollback

```bash
aws ecs describe-task-definition --task-definition hotel-pms
# Register previous revision or update service to prior image tag
aws ecs update-service --cluster hotel-pms --service hotel-pms \
  --task-definition hotel-pms:PREVIOUS_REVISION --force-new-deployment
```

Atlas data rollback is separate from app rollback — restore from Atlas backup only with an explicit operator decision.

## Cost notes (ballpark)

Fargate 0.5 vCPU / 1 GB × 2 tasks + ALB + NAT + CloudWatch + ECR + Secrets Manager is typically the dominant fixed cost; Atlas is billed separately. Use Fargate Spot for non-prod.
