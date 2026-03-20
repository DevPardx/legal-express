import { Router } from "express";
import { invoiceController } from "@/controllers/invoice.controller.js";
import { requireAuth } from "@/middleware/auth.middleware.js";

const router = Router();

router.get("/invoices", requireAuth, (req, res, next) => invoiceController.listInvoices(req, res, next));
router.get("/webhooks", requireAuth, (req, res, next) => invoiceController.listWebhookEntries(req, res, next));

export default router;
