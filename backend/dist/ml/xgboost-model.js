import { accessSync, constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { env } from "../config/env.js";
import { vectorizeFeatures } from "./feature-extractor.js";
const modelPath = path.resolve(process.cwd(), env.PHISHING_MODEL_PATH);
const modelMetaPath = path.resolve(process.cwd(), env.PHISHING_MODEL_META_PATH);
const predictorScriptPath = path.resolve(process.cwd(), "src/ml/training/predict_xgboost.py");
const workerWarmupTimeoutMs = 10000;
let predictorProc = null;
let requestId = 0;
const pending = new Map();
const nextId = () => {
    requestId += 1;
    return `req_${requestId}_${Date.now()}`;
};
const rejectAllPending = (message) => {
    for (const entry of pending.values()) {
        clearTimeout(entry.timeout);
        entry.reject(new Error(message));
    }
    pending.clear();
};
const ensurePredictorWorker = () => {
    if (predictorProc)
        return;
    const proc = spawn(env.PYTHON_BIN, [predictorScriptPath, "--worker"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
    });
    predictorProc = proc;
    const rl = createInterface({ input: proc.stdout });
    rl.on("line", (line) => {
        const trimmed = line.trim();
        if (!trimmed)
            return;
        let msg;
        try {
            msg = JSON.parse(trimmed);
        }
        catch {
            return;
        }
        if (!msg.id)
            return;
        const entry = pending.get(msg.id);
        if (!entry)
            return;
        pending.delete(msg.id);
        clearTimeout(entry.timeout);
        if (typeof msg.error === "string" && msg.error.length > 0) {
            entry.reject(new Error(`XGBoost predictor failed: ${msg.error}`));
            return;
        }
        if (typeof msg.probability !== "number" || !Number.isFinite(msg.probability)) {
            entry.reject(new Error("XGBoost predictor returned invalid probability"));
            return;
        }
        entry.resolve({ probability: msg.probability });
    });
    proc.stderr.on("data", (chunk) => {
        const text = chunk.toString().trim();
        if (text && env.NODE_ENV !== "production") {
            console.error(`[xgboost-worker] ${text}`);
        }
    });
    proc.on("error", (err) => {
        predictorProc = null;
        rejectAllPending(`XGBoost worker spawn error: ${err.message}`);
    });
    proc.on("exit", (code, signal) => {
        predictorProc = null;
        rejectAllPending(`XGBoost worker exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
    });
};
export const initializePhishingModel = () => {
    accessSync(modelPath, constants.R_OK);
    accessSync(modelMetaPath, constants.R_OK);
    accessSync(predictorScriptPath, constants.R_OK);
    ensurePredictorWorker();
    console.log(`XGBoost model files loaded: model=${modelPath}, meta=${modelMetaPath}`);
};
export const scorePhishingProbability = async (features) => {
    ensurePredictorWorker();
    if (!predictorProc) {
        throw new Error("XGBoost worker unavailable");
    }
    const id = nextId();
    const payload = {
        id,
        modelPath,
        metaPath: modelMetaPath,
        features: vectorizeFeatures(features),
    };
    const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            pending.delete(id);
            reject(new Error("XGBoost predictor timed out"));
        }, workerWarmupTimeoutMs);
        pending.set(id, { resolve, reject, timeout });
        predictorProc.stdin.write(`${JSON.stringify(payload)}\n`);
    });
    const probability = Number.isFinite(result.probability) ? result.probability : 0;
    const details = [];
    if (features.isDomainIP)
        details.push("IP address used as domain");
    if (features.noOfSubDomain >= 3)
        details.push("excessive subdomains");
    if (features.hasObfuscation)
        details.push("URL obfuscation detected");
    if (!features.isHTTPS)
        details.push("HTTP without TLS");
    if (features.noOfQMarkInURL + features.noOfAmpersandInURL + features.noOfEqualsInURL >= 5) {
        details.push("suspicious query complexity");
    }
    if (features.digitRatioInURL > 0.2)
        details.push("high numeric ratio in URL");
    return { probability, details };
};
export const buildExplanation = (isPhishing, probability, details) => {
    const riskPct = Math.round(probability * 100);
    const reasons = details.length ? details.slice(0, 3).join(", ") : "gradient-boosted feature patterns";
    if (isPhishing) {
        return `XGBoost classified this URL as phishing (${riskPct}% risk). Key signals: ${reasons}.`;
    }
    return `XGBoost classified this URL as likely legitimate (${riskPct}% risk).`;
};
