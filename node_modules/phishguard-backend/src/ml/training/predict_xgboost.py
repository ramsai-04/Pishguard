import json
import sys

import numpy as np
from xgboost import XGBClassifier


def predict(payload, model_cache, calibration_cache):
    model_path = payload["modelPath"]
    meta_path = payload.get("metaPath")
    features = payload["features"]

    if model_path not in model_cache:
        model = XGBClassifier()
        model.load_model(model_path)
        model_cache[model_path] = model

    model = model_cache[model_path]
    calibration = None
    if meta_path:
        if meta_path not in calibration_cache:
            meta = json.loads(open(meta_path, "r", encoding="utf-8").read())
            calibration_cache[meta_path] = meta.get("calibration")
        calibration = calibration_cache[meta_path]

    x = np.array([features], dtype=float)
    raw_prob = float(model.predict_proba(x)[0][1])
    prob = raw_prob
    if isinstance(calibration, dict) and calibration.get("type") == "platt":
        coef = float(calibration.get("coef", 1.0))
        intercept = float(calibration.get("intercept", 0.0))
        z = coef * raw_prob + intercept
        prob = 1.0 / (1.0 + np.exp(-z))
    return prob


def run_once():
    if len(sys.argv) < 2:
        raise ValueError("Missing payload argument")
    payload = json.loads(sys.argv[1])
    probability = predict(payload, {}, {})
    print(json.dumps({"probability": probability}))


def run_worker():
    model_cache = {}
    calibration_cache = {}
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        request_id = None
        try:
            payload = json.loads(line)
            request_id = payload.get("id")
            if not request_id:
                raise ValueError("Missing request id")
            probability = predict(payload, model_cache, calibration_cache)
            print(json.dumps({"id": request_id, "probability": probability}), flush=True)
        except Exception as exc:  # noqa
            if request_id:
                print(json.dumps({"id": request_id, "error": str(exc)}), flush=True)
            else:
                print(json.dumps({"id": "unknown", "error": str(exc)}), flush=True)


def main():
    if "--worker" in sys.argv:
        run_worker()
        return

    run_once()
    return


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa
        print(str(exc), file=sys.stderr)
        sys.exit(1)
