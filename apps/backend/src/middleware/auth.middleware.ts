import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/services/auth.service.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
        return;
    }

    const token = header.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
        res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
        return;
    }

    (req as Request & { user: typeof payload }).user = payload;
    next();
}
