import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const feedbackSchema = z.object({
  websiteUrl: z.string().url().max(2048),
  reason: z.string().min(2).max(100),
  description: z.string().min(10).max(4000),
  userEmail: z.string().email().optional().or(z.literal("")),
});

export const feedbackRouter = Router();

feedbackRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = feedbackSchema.parse(req.body);
    const feedback = await prisma.feedback.create({
      data: {
        websiteUrl: payload.websiteUrl,
        reason: payload.reason,
        description: payload.description,
        userEmail: payload.userEmail || null,
        userId: req.user!.id,
      },
      select: {
        id: true,
        websiteUrl: true,
        reason: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      id: feedback.id,
      websiteUrl: feedback.websiteUrl,
      reason: feedback.reason,
      createdAt: feedback.createdAt,
    });
  } catch (error) {
    next(error);
  }
});
