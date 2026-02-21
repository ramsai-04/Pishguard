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
`VITE_FIREBASE_API_KEY=...`
`VITE_FIREBASE_AUTH_DOMAIN=...`
`VITE_FIREBASE_PROJECT_ID=...`
`VITE_FIREBASE_APP_ID=...`

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
- Firebase Admin credentials (for Firebase login verification):
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (use `\n` for line breaks)

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
- `POST /auth/firebase`
- `GET /auth/me` (Bearer token)
- `POST /scan` (Bearer token)
- `POST /feedback` (Bearer token)

## ML Model

- Train an XGBoost model artifact with `npm --prefix backend run train:model`.
- Backend loads the pre-trained artifact at startup from `PHISHING_MODEL_PATH`.
- Runtime `/scan` uses inference only (no model training during requests).
