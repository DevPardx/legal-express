import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/database.config.js";

export class InvoiceController {
    async listInvoices(req: Request, res: Response, next: NextFunction) {
        try {
            const invoices = await prisma.invoice.findMany({
                orderBy: { createdAt: "desc" },
                include: { user: true, matter: true }
            });
            res.json({ success: true, data: { invoices } });
        } catch (error) {
            next(error);
        }
    }

    async listWebhookEntries(req: Request, res: Response, next: NextFunction) {
        try {
            // Return jobs that have result payloads (i.e., have been processed via webhook)
            const jobs = await prisma.job.findMany({
                where: { result: { not: {} } },
                orderBy: { updatedAt: "desc" },
                take: 100,
                include: { document: true }
            });
            res.json({ success: true, data: { entries: jobs } });
        } catch (error) {
            next(error);
        }
    }
}

export const invoiceController = new InvoiceController();
