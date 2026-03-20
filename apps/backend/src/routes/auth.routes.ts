import { Router } from "express";
import { authController } from "@/controllers/auth.controller.js";
import { requireAuth } from "@/middleware/auth.middleware.js";

const router = Router();

router.post("/auth/login", (req, res, next) => authController.login(req, res, next));
router.get("/auth/me", requireAuth, (req, res) => authController.me(req, res));

export default router;
