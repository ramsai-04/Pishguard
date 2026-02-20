import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score, brier_score_loss
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

FEATURE_COLUMNS = [
    "urlLength",
    "domainLength",
    "isDomainIP",
    "tldLength",
    "noOfSubDomain",
    "hasObfuscation",
    "noOfObfuscatedChar",
    "obfuscationRatio",
    "noOfLettersInURL",
    "letterRatioInURL",
    "noOfDigitsInURL",
    "digitRatioInURL",
    "noOfEqualsInURL",
    "noOfQMarkInURL",
    "noOfAmpersandInURL",
    "noOfOtherSpecialCharsInURL",
    "specialCharRatioInURL",
    "isHTTPS",
]

def count_regex(text: str, pattern) -> int:
    import re
    return len(re.findall(pattern, text))

def extract_url_features(raw_url: str):
    url = (raw_url or "").strip().lower()
    normalized = url if url.startswith(("http://", "https://")) else f"https://{url}"
    parsed = urlparse(normalized)
    domain = (parsed.hostname or "").lower()

    tld = domain.split(".")[-1] if "." in domain else ""
    subdomain_parts = domain.split(".") if domain else []
    no_of_subdomain = max(0, len(subdomain_parts) - 2)
    is_domain_ip = 1 if count_regex(domain, r"^\d{1,3}(\.\d{1,3}){3}$") else 0

    has_percent_encoding = bool(count_regex(normalized, r"%[0-9a-f]{2}"))
    has_punycode = "xn--" in domain
    has_obfuscation = 1 if (has_percent_encoding or has_punycode) else 0

    no_of_encoded_triplets = count_regex(normalized, r"%[0-9a-f]{2}")
    no_of_obfuscated_char = no_of_encoded_triplets * 3 + (4 if has_punycode else 0)

    url_length = len(normalized)
    no_of_letters = count_regex(normalized, r"[a-z]")
    no_of_digits = count_regex(normalized, r"\d")
    no_of_equals = normalized.count("=")
    no_of_qmark = normalized.count("?")
    no_of_amp = normalized.count("&")
    no_of_other_special = count_regex(normalized, r"[^a-z0-9:/?&=._-]")

    return {
        "urlLength": url_length,
        "domainLength": len(domain),
        "isDomainIP": is_domain_ip,
        "tldLength": len(tld),
        "noOfSubDomain": no_of_subdomain,
        "hasObfuscation": has_obfuscation,
        "noOfObfuscatedChar": no_of_obfuscated_char,
        "obfuscationRatio": (no_of_obfuscated_char / url_length) if url_length else 0,
        "noOfLettersInURL": no_of_letters,
        "letterRatioInURL": (no_of_letters / url_length) if url_length else 0,
        "noOfDigitsInURL": no_of_digits,
        "digitRatioInURL": (no_of_digits / url_length) if url_length else 0,
        "noOfEqualsInURL": no_of_equals,
        "noOfQMarkInURL": no_of_qmark,
        "noOfAmpersandInURL": no_of_amp,
        "noOfOtherSpecialCharsInURL": no_of_other_special,
        "specialCharRatioInURL": (no_of_other_special / url_length) if url_length else 0,
        "isHTTPS": 1 if normalized.startswith("https://") else 0,
    }


def main():
    dataset_path = Path(os.environ.get("PHISHING_DATASET_PATH", "src/ml/training/phishing.csv")).resolve()
    hard_negative_path = Path(os.environ.get("PHISHING_HARD_NEGATIVE_PATH", "src/ml/training/hard_negatives.txt")).resolve()
    model_path = Path(os.environ.get("PHISHING_MODEL_PATH", "src/ml/models/xgboost-model.json")).resolve()
    meta_path = Path(os.environ.get("PHISHING_MODEL_META_PATH", "src/ml/models/xgboost-meta.json")).resolve()
    label_value_for_phishing = int(os.environ.get("PHISHING_LABEL_VALUE", "0"))
    max_rows = int(os.environ.get("PHISHING_TRAIN_MAX_ROWS", "0"))

    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    df = pd.read_csv(dataset_path)
    source_rows = len(df)
    if max_rows > 0:
        df = df.head(max_rows)

    # Inject curated hard negatives (known legitimate URLs/domains) to reduce false positives.
    hard_negative_urls = []
    if hard_negative_path.exists():
        for line in hard_negative_path.read_text(encoding="utf-8").splitlines():
            cleaned = line.strip()
            if cleaned and not cleaned.startswith("#"):
                hard_negative_urls.append(cleaned)

    if hard_negative_urls:
        legit_label = 1 if label_value_for_phishing == 0 else 0
        hard_df = pd.DataFrame({"URL": hard_negative_urls, "label": [legit_label] * len(hard_negative_urls)})
        df = pd.concat([df[["URL", "label"]], hard_df], ignore_index=True)
    else:
        df = df[["URL", "label"]]

    y_raw = df["label"].astype(int)
    y = (y_raw == label_value_for_phishing).astype(int)
    extracted = df["URL"].fillna("").astype(str).map(extract_url_features)
    x = pd.DataFrame(list(extracted))[FEATURE_COLUMNS].apply(pd.to_numeric, errors="coerce").fillna(0)

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=400,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
    )

    model.fit(x_train, y_train)

    # Probability calibration (Platt scaling on held-out calibration subset).
    x_fit, x_cal, y_fit, y_cal = train_test_split(
        x_train, y_train, test_size=0.2, random_state=42, stratify=y_train
    )
    model.fit(x_fit, y_fit)
    cal_prob = model.predict_proba(x_cal)[:, 1].reshape(-1, 1)
    calibrator = LogisticRegression(max_iter=1000)
    calibrator.fit(cal_prob, y_cal)

    raw_test_prob = model.predict_proba(x_test)[:, 1]
    y_prob = calibrator.predict_proba(raw_test_prob.reshape(-1, 1))[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "brier": float(brier_score_loss(y_test, y_prob)),
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.parent.mkdir(parents=True, exist_ok=True)

    model.save_model(str(model_path))

    meta = {
        "kind": "xgboost-classifier",
        "version": 1,
        "trainedAt": pd.Timestamp.utcnow().isoformat(),
        "datasetPath": str(dataset_path),
        "rows": int(len(df)),
        "sourceRows": int(source_rows),
        "hardNegativeRows": int(len(hard_negative_urls)),
        "hardNegativePath": str(hard_negative_path),
        "labelValueForPhishing": int(label_value_for_phishing),
        "featureColumns": FEATURE_COLUMNS,
        "calibration": {
            "type": "platt",
            "coef": float(calibrator.coef_[0][0]),
            "intercept": float(calibrator.intercept_[0]),
        },
        "metrics": metrics,
    }

    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print(json.dumps({"modelPath": str(model_path), "metaPath": str(meta_path), "metrics": metrics}))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa
        print(str(exc), file=sys.stderr)
        sys.exit(1)
