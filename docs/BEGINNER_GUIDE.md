# PhishGuard Beginner Guide

This guide explains the project end-to-end for someone new to this codebase.

## 1. What This Project Is

PhishGuard is a full-stack phishing URL detection app with:
- Frontend: React + Vite web app (`frontend/`)
- Backend: Express + Prisma API (`backend/`)
- Database: PostgreSQL (managed through Prisma)
- Authentication: Firebase Authentication (email/password + Google)
- Detection engine: XGBoost model + rule policy + domain reputation signals

Main user flow:
1. User signs in with Firebase from frontend.
2. Frontend gets Firebase ID token.
3. Frontend sends token to backend (`Authorization: Bearer <idToken>`).
4. Backend verifies token using Firebase Admin SDK.
5. User submits a URL to scan.
6. Backend computes features, runs XGBoost inference, applies policy/reputation adjustments, stores result, returns verdict.

## 2. Repository Structure

- `README.md`: quick overview and setup shortcuts
- `frontend/`: React client
- `backend/`: API server, ML scoring, Prisma schema/migrations
- `backend/prisma/schema.prisma`: database models
- `backend/src/ml/`: feature extraction, model scoring, rules, reputation checks
- `backend/src/ml/training/`: Python training/inference scripts and dataset assets

## 3. Tech Stack and Why It Is Used

### Frontend
- React + TypeScript: UI and state safety
- Vite: fast dev server/build tool
- Tailwind + shadcn/radix components: UI styling/components
- Firebase Web SDK: user login and ID token generation

### Backend
- Express: REST API
- Prisma: ORM + migrations for PostgreSQL
- Zod: request and env validation
- Firebase Admin SDK: server-side verification of Firebase tokens
- `express-rate-limit`, `helmet`, `cors`, `morgan`: security/logging/middleware

### ML and Reputation
- XGBoost (Python): phishing probability model
- Custom feature extractor (TypeScript): URL-derived numeric features
- Risk policy (TypeScript): deterministic risk adjustments
- Reputation module: DNS/TLS/domain-age/external feed checks

## 4. Prerequisites (Must Have)

Install before running project:
- Node.js 20+ (recommended)
- npm (comes with Node)
- Python 3.10+ (for model training/inference worker)
- pip (Python package manager)
- PostgreSQL database (local or cloud, e.g., Supabase)
- Firebase project (Auth enabled)

## 5. Environment Variables Explained

### Frontend (`frontend/.env`)

Start from `frontend/.env.example`.

- `VITE_API_BASE_URL`
Purpose: Base backend URL, e.g. `http://localhost:4000`
Used for: auth sync, history, feedback, default scan endpoint (`<base>/scan`)

- `VITE_FIREBASE_API_KEY`
Purpose: Firebase web config (client-safe key)

- `VITE_FIREBASE_AUTH_DOMAIN`
Purpose: Firebase auth domain

- `VITE_FIREBASE_PROJECT_ID`
Purpose: Firebase project id

- `VITE_FIREBASE_APP_ID`
Purpose: Firebase app id

### Backend (`backend/.env`)

Start from `backend/.env.example`.

Core runtime:
- `NODE_ENV`: `development`, `test`, or `production`
- `PORT`: backend listen port (default `4000`)
- `DATABASE_URL`: PostgreSQL connection string

Auth/security:
- `JWT_SECRET`: currently validated but not actively used for request auth (Firebase tokens are used)
- `JWT_EXPIRES_IN`: legacy JWT setting
- `RATE_LIMIT_WINDOW_MS`: limiter time window
- `RATE_LIMIT_AUTH_MAX`: max auth/feedback requests per window
- `RATE_LIMIT_SCAN_MAX`: max scan requests per window

Model and detection:
- `PHISHING_THRESHOLD`: phishing decision threshold (default `0.62`)
- `PHISHING_BLOCKLIST_THRESHOLD`: high-risk threshold for blocklist consideration
- `PHISHING_BLOCKLIST_MIN_DETECTIONS`: minimum detections/users before blocklist upsert
- `PHISHING_BLOCKLIST_TTL_HOURS`: blocked domain TTL before expiration
- `TRUSTED_DOMAINS`: comma-separated allowlist with safeguard behavior

Training/inference files:
- `PHISHING_DATASET_PATH`: source CSV for training
- `PHISHING_HARD_NEGATIVE_PATH`: known safe URLs to reduce false positives
- `PHISHING_MODEL_PATH`: saved XGBoost model path
- `PHISHING_MODEL_META_PATH`: calibration/metrics metadata path
- `PHISHING_LABEL_VALUE`: which label means phishing (`0` in current dataset)
- `PHISHING_TRAIN_MAX_ROWS`: row cap for quicker experiments (`0` = full)
- `PYTHON_BIN`: python executable command (`python`)

Reputation tuning:
- `REPUTATION_TIMEOUT_MS`: network timeout for reputation checks
- `REPUTATION_CACHE_TTL_MS`: cache duration for reputation results
- `REPUTATION_ENABLE_EXTERNAL`: enable Google Safe Browsing / PhishTank checks
- `GOOGLE_SAFE_BROWSING_API_KEY`: optional API key
- `PHISHTANK_API_KEY`: optional API key
- `PHISHTANK_ENDPOINT`: API URL
- `RDAP_LOOKUP_BASE_URL`: domain age lookup base URL

Firebase Admin (required for backend auth):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (with `\n` line breaks)

## 6. Setup (First-Time, Step by Step)

### 6.1 Install dependencies

From repository root:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 6.2 Create `.env` files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Then edit both `.env` files with your real values.

### 6.3 Initialize database

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
```

### 6.4 Start apps

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Frontend usually runs on `http://localhost:5173`.

## 7. API Reference

Base URL: `http://localhost:4000` (default)

Public:
- `GET /health`: service heartbeat
- `POST /auth/firebase`: sync Firebase user to local DB profile
- `POST /auth/register`: returns `410` (deprecated)
- `POST /auth/login`: returns `410` (deprecated)

Protected (Bearer Firebase ID token):
- `GET /auth/me`: current profile
- `POST /scan`: scan URL
- `GET /scan/history?limit=200`: user scan history
- `DELETE /scan/history`: clear user history
- `POST /feedback`: submit threat report

## 8. Authentication Flow (Important)

1. Frontend authenticates using Firebase client SDK.
2. Frontend gets ID token via `getIdToken()`.
3. Token sent as Bearer token to backend.
4. Backend verifies token with Firebase Admin.
5. Backend upserts user in PostgreSQL (`User` table).
6. Authorized routes rely on this verified token.

Important:
- Email/password registration requires email verification before login.
- `/auth/register` and `/auth/login` are intentionally disabled.

## 9. Scan Decision Pipeline (How Verdict Is Calculated)

Inside `POST /scan`:
1. Normalize URL (`https://` added if missing).
2. Extract domain and category.
3. Check domain blocklist table first.
4. Build URL features (length, digits, subdomains, HTTPS, obfuscation, etc.).
5. Run XGBoost probability inference via Python worker.
6. Apply risk policy rules (brand spoofing, risky TLDs, missing HTTPS, etc.).
7. Evaluate reputation (DNS/TLS/domain age/history/external feeds).
8. Combine final probability and compare with `PHISHING_THRESHOLD`.
9. Store scan in DB and possibly update `BlockedDomain` table.

Output fields:
- `isPhishing`
- `isBlocked`
- `score` (0-100)
- `explanation`
- `category`, `domain`, timestamps

## 10. ML Training and Inference

### 10.1 PIP essentials (for Python side)

Install Python dependencies from backend folder:

```bash
pip install -r src/ml/training/requirements.txt
```

Packages and purpose:
- `pandas`: data loading/preprocessing
- `numpy`: numeric arrays
- `scikit-learn`: split, metrics, logistic calibration
- `xgboost`: model training/inference

### 10.2 Train model

```bash
npm --prefix backend run train:model
```

Generated artifacts:
- `backend/src/ml/models/xgboost-model.json`
- `backend/src/ml/models/xgboost-meta.json`

Metadata includes:
- feature order
- dataset rows used
- calibration coefficients
- accuracy/precision/recall/F1/ROC-AUC/Brier

### 10.3 Runtime inference

Backend starts a Python worker process (`predict_xgboost.py --worker`) and sends feature vectors over stdin.

Why this design:
- avoids retraining during requests
- keeps inference fast
- caches loaded model in worker process

## 11. Database Schema (Prisma Models)

`User`:
- identity (`firebaseUid`, `email`, `name`)
- relation to scans and feedback

`Scan`:
- scanned URL, domain, category
- phishing verdict and score
- explanation and raw feature data

`BlockedDomain`:
- domain-level blocklist with counters and timestamps

`Feedback`:
- user-submitted suspicious website reports

## 12. Scripts You Should Know

Root `package.json`:
- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build:frontend`
- `npm run build:backend`

Backend:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run train:model`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`

Frontend:
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`

## 13. Testing

Frontend tests:

```bash
npm --prefix frontend run test
```

Backend has Vitest config and at least one policy test file (`backend/src/ml/risk-policy.test.ts`) but no dedicated npm `test` script currently.

To run backend tests directly:

```bash
cd backend
npx vitest run
```

## 14. Important Operational Notes

- `JWT_SECRET` is validated by env schema but Firebase token verification is the real auth mechanism.
- Frontend "Privacy Mode" (`doNotStoreUrls`) only controls local UI history behavior; backend still persists scans when `/scan` is called.
- `detectionSensitivity` is sent by frontend but backend currently ignores it.
- If Firebase admin credentials are missing, auth routes depending on token verification fail.
- If model/meta files are missing or unreadable, backend startup fails at model initialization.

## 15. Troubleshooting

### Backend exits on startup with env errors
Cause: missing/invalid `.env` values.
Fix: fill all required keys, especially `DATABASE_URL`, `JWT_SECRET`, Firebase admin keys.

### `401 Missing bearer token` or `Invalid or expired token`
Cause: no Firebase token attached or expired token.
Fix: sign in again and ensure frontend sends `Authorization: Bearer <token>`.

### `503 Firebase auth is not configured on server`
Cause: backend Firebase Admin credentials missing.
Fix: set service-account env vars (or `GOOGLE_APPLICATION_CREDENTIALS`).

### Scan endpoint fails with model worker errors
Cause: Python env/deps missing or wrong `PYTHON_BIN`.
Fix:
1. Confirm `python --version`
2. `pip install -r backend/src/ml/training/requirements.txt`
3. Verify paths in backend `.env`

### Prisma migration issues
Cause: DB connectivity/permission/schema drift.
Fix: verify `DATABASE_URL`, run `npm --prefix backend run prisma:generate`, retry migration.

## 16. Suggested Next Improvements

1. Add a backend `test` script for consistency.
2. Either remove legacy JWT utilities or switch fully to local JWT strategy.
3. Make frontend privacy toggles enforce server-side non-persistence option.
4. Wire `detectionSensitivity` into backend policy thresholding.
5. Add OpenAPI/Swagger docs for endpoint contracts.

## 17. Minimal Onboarding Checklist

1. Install Node, Python, PostgreSQL access, Firebase project.
2. Install npm dependencies in root/backend/frontend.
3. Create and fill `backend/.env` and `frontend/.env`.
4. Run Prisma generate + migrate.
5. Start backend and frontend.
6. Register user in UI, verify email, sign in.
7. Scan a known safe and known suspicious URL and inspect history.

If all 7 steps pass, your local project setup is healthy.
