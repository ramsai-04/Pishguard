import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { isFirebaseConfigured, verifyFirebaseIdToken } from "../lib/firebase-admin.js";

const firebaseAuthSchema = z.object({
  idToken: z.string().min(10),
});

export const authRouter = Router();

authRouter.post("/register", async (_req, res) => {
  res.status(410).json({ message: "Use Firebase authentication instead of /auth/register" });
});

authRouter.post("/login", async (_req, res) => {
  res.status(410).json({ message: "Use Firebase authentication instead of /auth/login" });
});

authRouter.post("/firebase", async (req, res, next) => {
  try {
    if (!isFirebaseConfigured()) {
      res.status(503).json({ message: "Firebase auth is not configured on server" });
      return;
    }

    const payload = firebaseAuthSchema.parse(req.body);
    const decoded = await verifyFirebaseIdToken(payload.idToken);
    const email = decoded.email?.toLowerCase();

    if (!email) {
      res.status(400).json({ message: "Firebase token does not contain an email" });
      return;
    }
    if (decoded.email_verified !== true) {
      res.status(403).json({ message: "Email is not verified. Please verify your email before signing in." });
      return;
    }

    const displayName = (decoded.name ?? email.split("@")[0] ?? "User").trim().slice(0, 100) || "User";

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: decoded.uid }, { email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email,
          name: displayName,
          passwordHash: "__firebase_auth__",
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: decoded.uid,
          email,
          name: displayName,
        },
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});
