# Legal Express

Full-stack legal document generation platform. Clients submit a multi-step form, a background worker generates a PDF or HTML document from a Handlebars template via Puppeteer, and the result is delivered in real-time.

## Architecture

```
apps/
  frontend/   React 18 + Vite + TypeScript + Tailwind CSS
  backend/    Express 5 + TypeScript + Prisma (PostgreSQL) + BullMQ (Redis)
packages/
  shared/     TypeScript types shared between frontend and backend
infrastructure/
  docker/     Multi-stage Dockerfiles (backend, frontend/nginx)
  k8s/        Kubernetes manifests
  compose.yml Docker Compose for local development
database/
  schema.sql  PostgreSQL DDL
  queries.sql Sample queries
  redis-queue.md BullMQ pseudocode
.github/
  workflows/  CI/CD pipeline (test → build → deploy)
```

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, TypeScript 5, Tailwind CSS 4 |
| Backend | Express 5, TypeScript 5, Prisma 7, Zod 4 |
| Queue | BullMQ + Redis 7 |
| Database | PostgreSQL 16 |
| PDF Generation | Puppeteer + Handlebars |
| Auth | JWT (HS256) |
| Container | Docker (multi-stage), Nginx |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |

---

## Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **Docker** + **Docker Compose** (for local services)

---

## Quick Start (Docker)

This is the recommended path. Docker Compose starts PostgreSQL, Redis, backend, and frontend together.

```bash
# 1. Clone the repo
git clone <repo-url>
cd legal-express

# 2. Create backend environment file
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env and fill in required values (see Environment Variables below)

# 3. Start services
npm run docker:up

# 4. Run database migrations (first time only)
npm run db:migrate

# 5. Seed the database (creates admin user)
npm run db:seed

# 6. Open the app
open http://localhost:5173
```

Default admin credentials (set in `.env`): `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

## Local Development (without Docker)

Requires PostgreSQL 16 and Redis 7 running locally.

```bash
# 1. Install dependencies
npm install

# 2. Create and configure backend .env
cp apps/backend/.env.example apps/backend/.env

# 3. Run migrations
npm run db:migrate

# 4. Seed admin user
npm run db:seed

# 5. Start frontend + backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health check: http://localhost:3000/health

---

## Environment Variables

Create `apps/backend/.env` with the following variables:

```env
# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database (required)
DATABASE_URL=postgresql://postgres:password@localhost:5432/legal_express

# Redis (required for job queue)
REDIS_URL=redis://localhost:6379

# Auth (required — must be at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# Admin seed user (required)
ADMIN_EMAIL=admin@legalexpress.com
ADMIN_PASSWORD=changeme123

# Frontend origin (for CORS)
FRONTEND_URL=http://localhost:5173

# File storage
PDF_STORAGE_DIR=./generated

# Webhook signature validation (optional, min 32 chars)
WEBHOOK_SECRET=your-webhook-secret-min-32-chars-long
```

---

## Running Tests

### Unit & Integration Tests

```bash
# All packages
npm test

# Frontend only (component + hook tests)
npm run test -w apps/frontend

# Backend only (unit + integration tests)
npm run test -w apps/backend

# With coverage
npm run test -w apps/frontend -- --coverage
npm run test -w apps/backend -- --coverage
```

### E2E Tests (Playwright)

E2E tests require the full stack to be running (use Docker Compose).

```bash
# 1. Start services
npm run docker:up

# 2. Run migrations and seed
npm run db:migrate && npm run db:seed

# 3. Install Playwright browsers (first time only)
npx playwright install chromium

# 4. Run E2E tests
npm run test:e2e
```

The Playwright report is saved to `apps/frontend/playwright-report/`.

### TypeCheck & Lint

```bash
npm run typecheck
npm run lint
npm run format
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `POST` | `/api/auth/logout` | Bearer | Logout |
| `POST` | `/api/generate-doc` | Bearer | Queue document generation |
| `GET` | `/api/documents` | Bearer | List documents (paginated) |
| `GET` | `/api/documents/:id` | Bearer | Get document details |
| `DELETE` | `/api/documents/:id` | Bearer | Delete document |
| `POST` | `/api/documents/:id/regenerate` | Bearer | Re-queue generation |
| `GET` | `/api/events` | Token | SSE stream for status updates |
| `GET` | `/api/invoices` | Bearer | List invoices |
| `POST` | `/api/webhook/payment` | — | Receive payment webhook |

### Example: Generate a document

```bash
curl -X POST http://localhost:3000/api/generate-doc \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "legal-doc-request",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "formData": {
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "documentType": "CONTRACT",
      "outputFormat": "pdf"
    },
    "outputFormat": "pdf"
  }'
```

### Example: Payment webhook

```bash
curl -X POST http://localhost:3000/api/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "paymentStatus": "paid",
    "amount": 150.00,
    "currency": "USD",
    "transactionId": "txn_abc123",
    "timestamp": "2026-03-20T00:00:00Z"
  }'
```

---

## Backup & Recovery

### Database (PostgreSQL)

**Daily backup with `pg_dump`:**

```bash
# Manual backup
pg_dump $DATABASE_URL -Fc -f backup-$(date +%Y%m%d).dump

# Restore from backup
pg_restore -d $DATABASE_URL --clean backup-20260320.dump
```

**Kubernetes CronJob** (runs nightly at 02:00 UTC):

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: legal-express
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump $DATABASE_URL -Fc | \
              gzip > /backup/legal-express-$(date +%Y%m%d).dump.gz
            envFrom:
            - secretRef:
                name: legal-express-secrets
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

**Retention policy:** 30 daily dumps, 12 monthly dumps, 5 yearly dumps. Automated cleanup removes older files.

**Recovery time objective (RTO):** < 1 hour. **Recovery point objective (RPO):** < 24 hours.

---

### Redis (BullMQ queue)

Redis is configured with **AOF (Append-Only File)** persistence in `compose.yml` (`--appendonly yes`). This ensures jobs are not lost on restart.

For Kubernetes, mount a `PersistentVolumeClaim` for the Redis data directory:

```yaml
volumes:
- name: redis-data
  persistentVolumeClaim:
    claimName: redis-pvc
```

In the event of a Redis failure, BullMQ jobs in `active` state will be automatically retried on worker restart (configurable via `maxAttempts` in `pdf.worker.ts`).

---

### Generated Files (PDFs/HTML)

In development, generated files are stored in `apps/backend/generated/` (Docker volume `backend_generated`).

**For production**, replace the local directory with an S3-compatible store:

1. Add `AWS_BUCKET` and `AWS_REGION` to secrets
2. Upload files via `@aws-sdk/client-s3` after generation
3. Return a signed S3 URL instead of a local path

Until S3 is configured, back up the `backend_generated` volume alongside the database dump.

---

## Secrets Management

### Development

Secrets live in `apps/backend/.env` (gitignored). Never commit `.env` files.

### Kubernetes (Production)

Secrets are stored in `infrastructure/k8s/secret.yml` as base64-encoded values:

```bash
# Encode a secret
echo -n "my-jwt-secret-value" | base64

# Apply secrets to cluster
kubectl apply -f infrastructure/k8s/secret.yml -n legal-express
```

The `secret.yml` template in this repo contains placeholder values. **Replace them before deploying.** In a production cluster, use an external secrets manager:

- **AWS**: AWS Secrets Manager + External Secrets Operator
- **GCP**: Google Secret Manager + Workload Identity
- **HashiCorp Vault**: Vault Agent injector

Rotate secrets by updating the k8s Secret and triggering a rolling deployment:

```bash
kubectl rollout restart deployment/legal-express-backend -n legal-express
```

---

## Docker

```bash
# Build backend image
docker build -f infrastructure/docker/Dockerfile.backend --target runner -t legal-express-backend .

# Build frontend image
docker build -f infrastructure/docker/Dockerfile.frontend --target runner -t legal-express-frontend .

# Start all services locally
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

---

## Kubernetes

```bash
# Apply all manifests
kubectl apply -f infrastructure/k8s/namespace.yml
kubectl apply -f infrastructure/k8s/configmap.yml
kubectl apply -f infrastructure/k8s/secret.yml
kubectl apply -f infrastructure/k8s/deployment.yaml
kubectl apply -f infrastructure/k8s/service.yml

# Check rollout status
kubectl rollout status deployment/legal-express-backend -n legal-express
kubectl rollout status deployment/legal-express-frontend -n legal-express

# View pods
kubectl get pods -n legal-express
```
