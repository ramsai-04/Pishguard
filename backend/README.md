# Backend

Express + Prisma + PostgreSQL API for PhishGuard.

## Setup

```bash
npm install
cp .env.example .env
```

Update:

- `DATABASE_URL`
- `DIRECT_URL` (optional for local app runtime, recommended for Prisma migrations)
- `JWT_SECRET`
- `PHISHING_DATASET_PATH` (example: `src/ml/training/phishing.csv`)
- `PHISHING_MODEL_PATH` (example: `src/ml/models/xgboost-model.json`)
- `PHISHING_MODEL_META_PATH` (example: `src/ml/models/xgboost-meta.json`)
- `PHISHING_LABEL_VALUE` (for this dataset use `0` as phishing)
- `PHISHING_TRAIN_MAX_ROWS` (`0` = full dataset, any positive number = cap rows)
- `PYTHON_BIN` (example: `python`)

For Supabase PostgreSQL, `DATABASE_URL` is typically the pooled connection string and `DIRECT_URL` is the direct database connection string. Replace the placeholder values in `.env` with your own project credentials before starting the backend.

## Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Run

```bash
npm run dev
```

## ML logic

1. Install Python dependencies:

```bash
pip install -r src/ml/training/requirements.txt
```

2. Train model artifact (one-time or when dataset changes):

```bash
npm run train:model
```

- Backend loads the pre-trained XGBoost artifact from `PHISHING_MODEL_PATH` at startup.
- `/scan` performs inference only (no runtime training).
