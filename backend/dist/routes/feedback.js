import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { extractDomain } from "../ml/feature-extractor.js";
const feedbackSchema = z.object({
    url: z.string().min(4).max(2048),
    isPhishing: z.boolean(),
    reason: z.string().max(500).optional(),
});
const normalizeUrl = (url) => url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
export const feedbackRouter = Router();
feedbackRouter.post("/", requireAuth, async (req, res, next) => {
    try {
        const payload = feedbackSchema.parse(req.body);
        const normalizedUrl = normalizeUrl(payload.url.trim());
        const domain = extractDomain(normalizedUrl);
        const feedback = await prisma.feedback.create({
            data: {
                userId: req.user.id,
                url: normalizedUrl,
                domain,
                isPhishing: payload.isPhishing,
                reason: payload.reason?.trim() || null,
            },
        });
        res.status(201).json({
            id: feedback.id,
            url: feedback.url,
            domain: feedback.domain,
            isPhishing: feedback.isPhishing,
            createdAt: feedback.createdAt,
        });
    }
    catch (error) {
        next(error);
    }
});
