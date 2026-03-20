import type { Request, Response, NextFunction } from "express";
import z from "zod";
import { Prisma } from "@prisma/client";
import { documentService } from "@/services/document.service.js";
import { prisma } from "@/config/database.config.js";
import { pdfQueue } from "@/queues/pdf.queue.js";

const DOC_STATUS_MAP: Record<string, string> = {
    PENDING: "queued",
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED: "failed",
};
function normalizeDocStatus(status: string): string {
    return DOC_STATUS_MAP[status] ?? status.toLowerCase();
}

const generateDocSchema = z.object({
    formId: z.string().min(1),
    userId: z.uuid(),
    formData: z.record(z.string(), z.unknown()),
    outputFormat: z.enum(["pdf", "html", "docx"]).default("html"),
    templateId: z.string().optional()
});

export class DocumentController {
    async generateDoc(req: Request, res: Response, next: NextFunction) {
        try {
            const parsed = generateDocSchema.safeParse(req.body);

            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid request body",
                        details: parsed.error.flatten().fieldErrors
                    }
                });

                return;
            }

            const result = await documentService.generateDocument(parsed.data);

            res.status(202).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error)
        }
    }

    async getDocumentStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const rawId = req.params["documentId"];
            const documentId = Array.isArray(rawId) ? rawId[0] : rawId;

            if (!documentId) {
                res.status(400).json({
                    success: false,
                    error: { code: "MISSING_PARAM", message: "documentId is required" }
                });

                return;
            }

            const status = await documentService.getDocumentStatus(documentId);

            if (!status) {
                res.status(404).json({
                    success: false,
                    error: { code: "NOT_FOUND", message: "Document not found" }
                });

                return;
            }

            res.status(200).json({ success: true, data: status });
        } catch (error) {
            next(error);
        }
    }

    async listDocuments(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
            const limit = Math.min(50, parseInt(req.query["limit"] as string) || 10);
            const skip = (page - 1) * limit;

            const [documents, total] = await Promise.all([
                prisma.document.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: { job: true }
                }),
                prisma.document.count()
            ]);

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const [completedMonth, pending] = await Promise.all([
                prisma.document.count({ where: { status: "COMPLETED", createdAt: { gte: startOfMonth } } }),
                prisma.document.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } })
            ]);

            const normalized = documents.map((doc) => ({
                ...doc,
                status: normalizeDocStatus(doc.status),
            }));

            res.json({
                success: true,
                data: { documents: normalized, total, page, limit, stats: { total, completedMonth, pending } }
            });
        } catch (error) {
            next(error);
        }
    }

    async getDocumentById(req: Request, res: Response, next: NextFunction) {
        try {
            const rawId = req.params["id"];
            const id = Array.isArray(rawId) ? rawId[0] : rawId;
            if (!id) {
                res.status(400).json({ success: false, error: { code: "MISSING_PARAM", message: "id is required" } });
                return;
            }

            const document = await prisma.document.findUnique({
                where: { id },
                include: {
                    job: true,
                    matter: { include: { user: true } }
                }
            });

            if (!document) {
                res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Document not found" } });
                return;
            }

            res.json({ success: true, data: { ...document, status: normalizeDocStatus(document.status) } });
        } catch (error) {
            next(error);
        }
    }

    async deleteDocument(req: Request, res: Response, next: NextFunction) {
        try {
            const rawId = req.params["id"];
            const id = Array.isArray(rawId) ? rawId[0] : rawId;
            if (!id) {
                res.status(400).json({ success: false, error: { code: "MISSING_PARAM", message: "id is required" } });
                return;
            }

            const document = await prisma.document.findUnique({ where: { id } });
            if (!document) {
                res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Document not found" } });
                return;
            }

            await prisma.document.delete({ where: { id } });
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    async regenerateDocument(req: Request, res: Response, next: NextFunction) {
        try {
            const rawId = req.params["id"];
            const id = Array.isArray(rawId) ? rawId[0] : rawId;
            if (!id) {
                res.status(400).json({ success: false, error: { code: "MISSING_PARAM", message: "id is required" } });
                return;
            }

            const document = await prisma.document.findUnique({ where: { id } });
            if (!document) {
                res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Document not found" } });
                return;
            }

            const job = await prisma.job.create({
                data: { status: "QUEUED", payload: { documentId: id } as Prisma.InputJsonValue }
            });

            await prisma.document.update({
                where: { id },
                data: { status: "PENDING", jobId: job.id, fileUrl: null }
            });

            const formData = (document.formData ?? {}) as Record<string, unknown>;
            await pdfQueue.add("generate-pdf", {
                documentId: id,
                jobId: job.id,
                templateId: "document",
                formData,
                outputFormat: document.fileUrl?.includes("-bundle.pdf") ? "docx" : document.fileUrl?.endsWith(".pdf") ? "pdf" : "html"
            }, { jobId: job.id });

            res.json({ success: true, data: { jobId: job.id, status: "queued" } });
        } catch (error) {
            next(error);
        }
    }
}

export const documentController = new DocumentController();