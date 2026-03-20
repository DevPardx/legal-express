import type { Request, Response, NextFunction } from "express";
import z from "zod";
import { checkAdminCredentials, signToken } from "@/services/auth.service.js";
import { env } from "@/config/env.config.js";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export class AuthController {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const parsed = loginSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required" } });
                return;
            }

            const { email, password } = parsed.data;
            if (!checkAdminCredentials(email, password)) {
                res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
                return;
            }

            const token = signToken({ email, role: "admin" });
            res.json({
                success: true,
                data: {
                    token,
                    user: { email: env.ADMIN_EMAIL, role: "admin", name: "Admin" }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    me(req: Request, res: Response) {
        const user = (req as Request & { user?: { email: string } }).user;
        res.json({ success: true, data: { email: user?.email ?? env.ADMIN_EMAIL, role: "admin", name: "Admin" } });
    }
}

export const authController = new AuthController();
