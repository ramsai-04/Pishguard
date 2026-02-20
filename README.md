# PhishGuard Monorepo

This repository is split into:

- `frontend/` - Vite + React client
- `backend/` - Express + Prisma + PostgreSQL + URL phishing ML scoring

## 1. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

Set:

`VITE_API_BASE_URL=http://localhost:4000`

Run:

```bash
npm run dev
```

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env`:

- `DATABASE_URL` for PostgreSQL
- `JWT_SECRET` with a long random value

Generate Prisma client and migrate:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Run backend:

```bash
npm run dev
```

## API Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)
- `POST /scan` (Bearer token)

## ML Model

- Train an XGBoost model artifact with `npm --prefix backend run train:model`.
- Backend loads the pre-trained artifact at startup from `PHISHING_MODEL_PATH`.
- Runtime `/scan` uses inference only (no model training during requests).
