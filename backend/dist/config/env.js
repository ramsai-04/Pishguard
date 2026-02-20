import "dotenv/config";
import { z } from "zod";
const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    PHISHING_THRESHOLD: z.coerce.number().min(0).max(1).default(0.62),
    PHISHING_BLOCKLIST_THRESHOLD: z.coerce.number().min(0).max(1).default(0.95),
    PHISHING_BLOCKLIST_MIN_DETECTIONS: z.coerce.number().int().positive().default(2),
    TRUSTED_DOMAINS: z.string().default("google.com,facebook.com,github.com,microsoft.com,apple.com,usa.gov"),
    PHISHING_DATASET_PATH: z.string().default("src/ml/training/phishing.csv"),
    PHISHING_HARD_NEGATIVE_PATH: z.string().default("src/ml/training/hard_negatives.txt"),
    PHISHING_MODEL_PATH: z.string().default("src/ml/models/xgboost-model.json"),
    PHISHING_MODEL_META_PATH: z.string().default("src/ml/models/xgboost-meta.json"),
    PHISHING_LABEL_VALUE: z.coerce.number().int().default(0),
    PHISHING_TRAIN_MAX_ROWS: z.coerce.number().int().default(0),
    PYTHON_BIN: z.string().default("python"),
    REPUTATION_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
    REPUTATION_CACHE_TTL_MS: z.coerce.number().int().positive().default(3600000),
    REPUTATION_ENABLE_EXTERNAL: z
        .string()
        .default("true")
        .transform((v) => v.toLowerCase() !== "false"),
    GOOGLE_SAFE_BROWSING_API_KEY: z.string().default(""),
    PHISHTANK_API_KEY: z.string().default(""),
    PHISHTANK_ENDPOINT: z.string().url().default("https://checkurl.phishtank.com/checkurl/"),
    RDAP_LOOKUP_BASE_URL: z.string().url().default("https://rdap.org/domain/"),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_SCAN_MAX: z.coerce.number().int().positive().default(60),
    PHISHING_BLOCKLIST_TTL_HOURS: z.coerce.number().int().positive().default(168),
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = parsed.data;
