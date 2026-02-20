import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { buildExplanation, scorePhishingProbability } from "../ml/xgboost-model.js";
import { detectCategory, extractDomain, extractFeatures } from "../ml/feature-extractor.js";
import { applyRiskPolicy } from "../ml/risk-policy.js";
import { evaluateDomainReputation } from "../ml/reputation.js";

const scanSchema = z.object({
  url: z.string().min(4).max(2048),
});
const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

const normalizeUrl = (url: string): string =>
  url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

const TRUSTED_DOMAINS = env.TRUSTED_DOMAINS.split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const isTrustedDomain = (domain: string): boolean =>
  TRUSTED_DOMAINS.some((trusted) => domain === trusted || domain.endsWith(`.${trusted}`));

const isBlockedEntryExpired = (lastSeen: Date): boolean => {
  const ttlMs = env.PHISHING_BLOCKLIST_TTL_HOURS * 60 * 60 * 1000;
  return Date.now() - new Date(lastSeen).getTime() > ttlMs;
};

export const scanRouter = Router();

scanRouter.get("/history", requireAuth, async (req, res, next) => {
  try {
    const { limit } = historyQuerySchema.parse(req.query);
    const scans = await prisma.scan.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        url: true,
        domain: true,
        category: true,
        isPhishing: true,
        isBlocked: true,
        score: true,
        explanation: true,
        createdAt: true,
      },
    });

    res.json({
      items: scans.map((scan) => ({
        id: scan.id,
        url: scan.url,
        domain: scan.domain,
        category: scan.category,
        isPhishing: scan.isPhishing,
        isBlocked: scan.isBlocked,
        score: scan.score,
        explanation: scan.explanation,
        checkedAt: scan.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

scanRouter.delete("/history", requireAuth, async (req, res, next) => {
  try {
    const result = await prisma.scan.deleteMany({
      where: { userId: req.user!.id },
    });
    res.json({ deleted: result.count });
  } catch (error) {
    next(error);
  }
});

scanRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = scanSchema.parse(req.body);
    const normalizedUrl = normalizeUrl(payload.url.trim());
    const domain = extractDomain(normalizedUrl);
    const category = detectCategory(normalizedUrl);
    const trustedDomain = isTrustedDomain(domain);

    const blocked = trustedDomain
      ? null
      : await prisma.blockedDomain.findUnique({
          where: { domain },
        });

    if (blocked && !isBlockedEntryExpired(blocked.lastSeen)) {
      const existingBlockScan = await prisma.scan.create({
        data: {
          userId: req.user!.id,
          url: normalizedUrl,
          domain,
          category,
          isPhishing: true,
          isBlocked: true,
          score: 100,
          explanation: "Domain is on the blocked list from previous phishing detections.",
        },
      });

      res.json({
        id: existingBlockScan.id,
        url: existingBlockScan.url,
        domain: existingBlockScan.domain,
        category: existingBlockScan.category,
        isPhishing: true,
        isBlocked: true,
        score: existingBlockScan.score,
        explanation: existingBlockScan.explanation,
        checkedAt: existingBlockScan.createdAt,
      });
      return;
    }
    if (blocked && isBlockedEntryExpired(blocked.lastSeen)) {
      await prisma.blockedDomain.delete({ where: { domain } }).catch(() => undefined);
    }

    const features = extractFeatures(normalizedUrl);
    const { probability: modelProbability, details } = await scorePhishingProbability(features);
    const policy = applyRiskPolicy({
      normalizedUrl,
      domain,
      modelProbability,
      features,
      trustedDomain,
    });

    const [safeCount, phishCount] = await Promise.all([
      prisma.scan.count({
        where: {
          domain,
          isPhishing: false,
        },
      }),
      prisma.scan.count({
        where: {
          domain,
          isPhishing: true,
        },
      }),
    ]);

    const reputation = await evaluateDomainReputation({
      domain,
      normalizedUrl,
      safeCount,
      phishCount,
      timeoutMs: env.REPUTATION_TIMEOUT_MS,
    });

    const probability = Math.max(0, Math.min(1, policy.adjustedProbability + reputation.delta));
    const allReasons = [...details, ...policy.reasons, ...reputation.reasons];
    const isPhishing = probability >= env.PHISHING_THRESHOLD;
    const score = Math.round(probability * 100);
    const explanation = trustedDomain
      ? `Trusted domain safeguard applied (${domain}). Model risk: ${score}%.`
      : buildExplanation(isPhishing, probability, allReasons);

    const scan = await prisma.scan.create({
      data: {
        userId: req.user!.id,
        url: normalizedUrl,
        domain,
        category,
        isPhishing,
        isBlocked: isPhishing,
        score,
        explanation,
        featureData: features,
      },
    });

    const qualifiesByModelOnly = probability >= Math.min(1, env.PHISHING_BLOCKLIST_THRESHOLD + 0.03);
    const canConsiderBlocking =
      isPhishing &&
      !trustedDomain &&
      !reputation.preventBlocking &&
      (reputation.externalMaliciousHit || qualifiesByModelOnly);

    if (canConsiderBlocking) {
      const [detections, uniqueUsers] = await Promise.all([
        prisma.scan.count({
          where: {
            domain,
            isPhishing: true,
          },
        }),
        prisma.scan.findMany({
          where: {
            domain,
            isPhishing: true,
          },
          distinct: ["userId"],
          select: { userId: true },
        }),
      ]);

      if (
        detections >= env.PHISHING_BLOCKLIST_MIN_DETECTIONS &&
        uniqueUsers.length >= env.PHISHING_BLOCKLIST_MIN_DETECTIONS
      ) {
        await prisma.blockedDomain.upsert({
          where: { domain },
          update: {
            flaggedCnt: { increment: 1 },
          },
          create: {
            domain,
            flaggedCnt: 1,
          },
        });
      }
    }

    res.json({
      id: scan.id,
      url: scan.url,
      domain: scan.domain,
      category: scan.category,
      isPhishing: scan.isPhishing,
      isBlocked: scan.isBlocked,
      score: scan.score,
      explanation: scan.explanation,
      checkedAt: scan.createdAt,
    });
  } catch (error) {
    next(error);
  }
});
