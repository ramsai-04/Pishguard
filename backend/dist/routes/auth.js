import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signAuthToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(200),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(200),
});
export const authRouter = Router();
authRouter.post("/register", async (req, res, next) => {
    try {
        const payload = registerSchema.parse(req.body);
        const email = payload.email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ message: "Email already registered" });
            return;
        }
        const passwordHash = await bcrypt.hash(payload.password, 12);
        const user = await prisma.user.create({
            data: {
                name: payload.name.trim(),
                email,
                passwordHash,
            },
        });
        const token = signAuthToken({
            sub: user.id,
            email: user.email,
            name: user.name,
        });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
authRouter.post("/login", async (req, res, next) => {
    try {
        const payload = loginSchema.parse(req.body);
        const email = payload.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const valid = await bcrypt.compare(payload.password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = signAuthToken({
            sub: user.id,
            email: user.email,
            name: user.name,
        });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
authRouter.get("/me", requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
});
