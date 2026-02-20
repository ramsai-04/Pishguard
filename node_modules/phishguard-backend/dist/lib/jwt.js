import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export const signAuthToken = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
export const verifyAuthToken = (token) => jwt.verify(token, env.JWT_SECRET);
