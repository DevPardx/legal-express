import jwt from "jsonwebtoken";
import { env } from "@/config/env.config.js";

const TOKEN_EXPIRY = "7d";

export function signToken(payload: object): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): jwt.JwtPayload | null {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        return typeof decoded === "object" ? decoded : null;
    } catch {
        return null;
    }
}

export function checkAdminCredentials(email: string, password: string): boolean {
    return email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD;
}
