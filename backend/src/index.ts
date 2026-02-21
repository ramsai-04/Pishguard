import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { scanRouter } from "./routes/scan.js";
import { healthRouter } from "./routes/health.js";
import { feedbackRouter } from "./routes/feedback.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { initializePhishingModel } from "./ml/xgboost-model.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

const scanLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_SCAN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/health", healthRouter);
app.use("/auth", authLimiter, authRouter);
app.use("/scan", scanLimiter, scanRouter);
app.use("/feedback", authLimiter, feedbackRouter);

app.use(notFound);
app.use(errorHandler);

initializePhishingModel();

app.listen(env.PORT, () => {
  console.log(`PhishGuard backend listening on port ${env.PORT}`);
});
