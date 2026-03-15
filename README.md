# PhishGuard Monorepo

PhishGuard is a full-stack phishing URL detection system.

- `frontend/`: Vite + React + Firebase Auth client
- `backend/`: Express + Prisma + PostgreSQL + ML scoring API

## Complete Documentation

For full beginner-friendly documentation (architecture, setup, env vars, API, ML pipeline, and troubleshooting), read:

- `docs/BEGINNER_GUIDE.md`

## Quickstart

1. Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

2. Create env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Configure required values in both `.env` files.

4. Prepare database:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
```

5. Start apps:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

## Core Endpoints

- `GET /health`
- `POST /auth/firebase`
- `GET /auth/me` (Bearer token)
- `POST /scan` (Bearer token)
- `GET /scan/history` (Bearer token)
- `DELETE /scan/history` (Bearer token)
- `POST /feedback` (Bearer token)

## ML Notes

- Train model: `npm --prefix backend run train:model`
- Runtime scans use inference only (no training during requests)
- Model artifacts are loaded from paths configured in backend `.env`
