import path from "node:path";
import { spawnSync } from "node:child_process";
import { env } from "../../config/env.js";
const scriptPath = path.resolve(process.cwd(), "src/ml/training/train_xgboost.py");
const proc = spawnSync(env.PYTHON_BIN, [scriptPath], {
    stdio: "inherit",
    env: process.env,
});
if (proc.error) {
    console.error(proc.error.message);
    process.exit(1);
}
process.exit(proc.status ?? 1);
