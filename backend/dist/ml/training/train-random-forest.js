import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import { RandomForestClassifier } from "ml-random-forest";
import { env } from "../../config/env.js";
const toNumber = (value) => {
    const n = Number.parseFloat(value ?? "");
    return Number.isFinite(n) ? n : 0;
};
const vectorFromDatasetRow = (row) => [
    toNumber(row.URLLength),
    toNumber(row.DomainLength),
    toNumber(row.IsDomainIP),
    toNumber(row.TLDLength),
    toNumber(row.NoOfSubDomain),
    toNumber(row.HasObfuscation),
    toNumber(row.NoOfObfuscatedChar),
    toNumber(row.ObfuscationRatio),
    toNumber(row.NoOfLettersInURL),
    toNumber(row.LetterRatioInURL),
    toNumber(row.NoOfDegitsInURL),
    toNumber(row.DegitRatioInURL),
    toNumber(row.NoOfEqualsInURL),
    toNumber(row.NoOfQMarkInURL),
    toNumber(row.NoOfAmpersandInURL),
    toNumber(row.NoOfOtherSpecialCharsInURL),
    toNumber(row.SpacialCharRatioInURL),
    toNumber(row.IsHTTPS),
];
const loadRows = async (datasetPath, maxRows) => {
    const parser = createReadStream(datasetPath).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
    }));
    const rows = [];
    let sourceRows = 0;
    for await (const record of parser) {
        sourceRows += 1;
        if (maxRows <= 0 || rows.length < maxRows) {
            rows.push(record);
        }
        else {
            break;
        }
    }
    parser.destroy();
    return { rows, sourceRows };
};
const run = async () => {
    const datasetPath = path.resolve(process.cwd(), env.PHISHING_DATASET_PATH);
    const modelPath = path.resolve(process.cwd(), env.PHISHING_MODEL_PATH);
    const maxRows = env.PHISHING_TRAIN_MAX_ROWS;
    const { rows: selectedRows, sourceRows } = await loadRows(datasetPath, maxRows);
    const X = [];
    const y = [];
    for (const row of selectedRows) {
        const labelRaw = toNumber(row.label);
        const isPhishing = labelRaw === env.PHISHING_LABEL_VALUE ? 1 : 0;
        X.push(vectorFromDatasetRow(row));
        y.push(isPhishing);
    }
    if (X.length === 0) {
        throw new Error(`Dataset is empty: ${datasetPath}`);
    }
    const model = new RandomForestClassifier({
        seed: 42,
        maxFeatures: 6,
        replacement: true,
        nEstimators: 120,
        useSampleBagging: true,
        treeOptions: {
            maxDepth: 18,
            minNumSamples: 3,
        },
    });
    model.train(X, y);
    const phishingRows = y.filter((v) => v === 1).length;
    const payload = {
        kind: "rf-classifier",
        version: 1,
        trainedAt: new Date().toISOString(),
        datasetPath,
        rows: X.length,
        sourceRows,
        phishingRows,
        legitimateRows: X.length - phishingRows,
        labelValueForPhishing: env.PHISHING_LABEL_VALUE,
        model: model.toJSON(),
    };
    mkdirSync(path.dirname(modelPath), { recursive: true });
    writeFileSync(modelPath, JSON.stringify(payload), "utf8");
    console.log(`Model artifact written: ${modelPath}`);
    console.log(`Rows=${payload.rows}/${payload.sourceRows}, phishing=${payload.phishingRows}, legit=${payload.legitimateRows}`);
};
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
