import { verifyAuthToken } from "../lib/jwt.js";
export const requireAuth = (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
        res.status(401).json({ message: "Missing bearer token" });
        return;
    }
    try {
        const decoded = verifyAuthToken(token);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
        };
        next();
    }
    catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
