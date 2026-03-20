import { Router } from "express";
import { webhookController } from "@/controllers/webhook.controller.js";

const router = Router();

router.post("/webhook/payment", (req, res, next) => {
    webhookController.handlePayment(req, res, next);
});

export default router;