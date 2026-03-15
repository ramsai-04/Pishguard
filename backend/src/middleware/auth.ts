import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { verifyFirebaseIdToken } from "../lib/firebase-admin.js";
import { prisma } from "../lib/prisma.js";

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Missing bearer token" });
    return;
  }

  try {
    const decoded = await verifyFirebaseIdToken(token);
    const email = decoded.email?.toLowerCase();
    if (!email) {
      res.status(401).json({ message: "Firebase token missing email claim" });
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
    } else if (user.firebaseUid !== decoded.uid || user.email !== email || user.name !== displayName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: decoded.uid,
          email,
          name: displayName,
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      next(error);
      return;
    }

    res.status(401).json({ message: "Invalid or expired token" });
  }
};
