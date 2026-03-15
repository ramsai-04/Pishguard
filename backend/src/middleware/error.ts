import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
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

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error(err);

    res.status(503).json({
      message: "Database is unavailable. Check DATABASE_URL/DIRECT_URL and confirm the PostgreSQL server is reachable.",
    });
    return;
  }

  if (err instanceof Error) {
    console.error(err);
  }

  const message =
    env.NODE_ENV === "production" ? "Internal server error" : err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ message });
};
