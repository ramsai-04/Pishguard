import { readFileSync } from "node:fs";
import path from "node:path";
import { RandomForestClassifier } from "ml-random-forest";
import { env } from "../config/env.js";
import { vectorizeFeatures } from "./feature-extractor.js";
let loadedModel = null;
let loadedMeta = null;
const getModel = () => {
    if (!loadedModel) {
        throw new Error("RandomForest model is not loaded. Run `npm run train:model` and restart backend.");
    }
    return loadedModel;
};
export const initializePhishingModel = () => {
    if (loadedModel)
        return;
    const modelPath = path.resolve(process.cwd(), env.PHISHING_MODEL_PATH);
    const raw = readFileSync(modelPath, "utf8");
    const payload = JSON.parse(raw);
    if (payload.kind !== "rf-classifier" || !payload.model) {
        throw new Error(`Invalid model artifact format: ${modelPath}`);
    }
    loadedModel = RandomForestClassifier.load(payload.model);
    loadedMeta = payload;
    console.log(`RandomForest model loaded: ${modelPath} (trainedAt=${payload.trainedAt}, rows=${payload.rows}${payload.sourceRows ? `/${payload.sourceRows}` : ""}, phishing=${payload.phishingRows}, legit=${payload.legitimateRows})`);
};
export const scorePhishingProbability = (features) => {
    const model = getModel();
    const vector = vectorizeFeatures(features);
    const probability = model.predictProbability([vector], 1)[0] ?? 0;
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
    const reasons = details.length ? details.slice(0, 3).join(", ") : "forest-level feature patterns";
    const trainedAt = loadedMeta?.trainedAt ?? "unknown";
    if (isPhishing) {
        return `Random Forest classified this URL as phishing (${riskPct}% risk). Key signals: ${reasons}. Model trained: ${trainedAt}.`;
    }
    return `Random Forest classified this URL as likely legitimate (${riskPct}% risk). Model trained: ${trainedAt}.`;
};
