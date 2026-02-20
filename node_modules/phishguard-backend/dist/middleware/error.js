import { ZodError } from "zod";
import { env } from "../config/env.js";
export const notFound = (_req, res) => {
    res.status(404).json({ message: "Route not found" });
};
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            message: "Validation error",
            errors: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    if (env.NODE_ENV !== "production" && err instanceof Error) {
        console.error(err);
    }
    const message = env.NODE_ENV === "production" ? "Internal server error" : err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
};
