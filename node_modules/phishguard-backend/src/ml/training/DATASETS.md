# XGBoost Dataset Notes

This backend trains an XGBoost classifier from your provided phishing CSV schema (the one with columns like `URLLength`, `DomainLength`, `NoOfSubDomain`, etc.).

## Default dataset path

`src/ml/training/phishing.csv`

Configure with:

`PHISHING_DATASET_PATH`

## Label mapping

For your current dataset:

- `label = 0` -> phishing
- `label = 1` -> legitimate

Configure with:

`PHISHING_LABEL_VALUE=0`

## Training command

From `backend/`:

```bash
npm run train:model
```

This generates model artifacts at:

- `src/ml/models/xgboost-model.json`
- `src/ml/models/xgboost-meta.json`
