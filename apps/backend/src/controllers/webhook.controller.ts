import type { Request, Response, NextFunction } from "express";
import z from "zod";
import { prisma } from "@/config/database.config.js";

const webhookPaymentSchema = z.object({
    jobId: z.uuid(),
    paymentStatus: z.enum(["paid", "failed", "refunded"]),
    amount: z.number().positive(),
    currency: z.string().length(3),
    transactionId: z.string().min(1),
    timestamp: z.coerce.date()
});

const invoiceStatusMap = {
    paid: "PAID",
    failed: "PENDING",
    refunded: "CANCELLED"
} as const;

export class WebhookController {
    async handlePayment(req: Request, res: Response, next: NextFunction) {
        try {
            const parsed = webhookPaymentSchema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid webhook payload",
                        details: parsed.error.flatten().fieldErrors
                    }
                });

                return;
            }

            const { jobId, paymentStatus, amount, currency: _currency, transactionId } = parsed.data;

            // Find associated document
            const document = await prisma.document.findFirst({
                where: { jobId },
                include: { matter: true }
            });

            if (!document) {
                // Return 200 to prevent webhook retries for unknown jobs
                res.status(200).json({
                    success: true,
                    message: "Job not found, acknowledged"
                });

                return;
            }

            await prisma.$transaction(async tx => {
                await tx.job.update({
                    where: { id: jobId },
                    data: {
                        status: paymentStatus === "paid" ? "COMPLETED" : "FAILED",
                        result: { transactionId, paymentStatus, processedAt: new Date().toISOString() }
                    }
                });

                if (document.matter?.userId) {
                    // Check idempotency via raw SQL to avoid Prisma client cache issues
                    const rows = await tx.$queryRaw<{ id: string }[]>`
                        SELECT id FROM invoices WHERE transaction_id = ${transactionId} LIMIT 1
                    `;

                    if (rows.length > 0) {
                        await tx.invoice.update({
                            where: { id: rows[0]!.id },
                            data: { status: invoiceStatusMap[paymentStatus] }
                        });
                    } else {
                        await tx.invoice.create({
                            data: {
                                transactionId,
                                amount,
                                status: invoiceStatusMap[paymentStatus],
                                dueDate: new Date(),
                                userId: document.matter.userId,
                                matterId: document.matter.id
                            }
                        });
                    }
                }
            });

            console.log(`[Webhook] Payment processed: jobId=${jobId}, status=${paymentStatus}`);

            res.status(200).json({
                success: true,
                message: `Payment ${paymentStatus} processed for job ${jobId}`,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const webhookController = new WebhookController();