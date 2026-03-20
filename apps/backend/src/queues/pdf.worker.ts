import { Worker, type Job } from "bullmq";
import { bullmqConnection } from "@/config/redis.config.js";
import { prisma } from "@/config/database.config.js";
import { templateService } from "@/services/template.service.js";
import type { PdfGenerationJob } from "@/types/index.js";
import { PDF_QUEUE_NAME } from "./pdf.queue.js";
import { pdfService } from "@/services/pdf.service.js";
import { mergeDocxTemplate } from "@/services/docx.service.js";
import { mergePdfs } from "@/services/bundle.service.js";
import { documentEmitter } from "@/events/document.emitter.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = join(__dirname, "../../generated");

export function createPdfWorker() {
    const worker = new Worker<PdfGenerationJob>(
        PDF_QUEUE_NAME,
        async (job: Job<PdfGenerationJob>) => {
            const { documentId, jobId, templateId, formData, outputFormat } = job.data;

            console.log(`[Worker] Processing job ${job.id} for document ${documentId}`);

            // Update job status to PROCESSING
            await prisma.job.update({
                where: { id: jobId },
                data: { status: "PROCESSING", attempts: job.attemptsMade + 1 }
            });

            await prisma.document.update({
                where: { id: documentId },
                data: { status: "PROCESSING" }
            });
            documentEmitter.emit("document:status", { documentId, status: "processing" });

            const fullName = ((formData["fullName"] as string) ?? "").trim();
            const spaceIndex = fullName.indexOf(" ");
            const firstName = spaceIndex > 0 ? fullName.slice(0, spaceIndex) : fullName || "Unknown";
            const lastName = spaceIndex > 0 ? fullName.slice(spaceIndex + 1).trim() : "";

            const templateData = {
                ...formData,
                firstName,
                lastName,
                documentId,
                generatedAt: new Date().toISOString(),
                year: new Date().getFullYear(),
                referenceNumber: Math.random().toString(36).substring(2, 8).toUpperCase()
            };

            const html = await templateService.render(templateId, templateData);

            let fileUrl: string;

            if (outputFormat === "docx") {
                // 1. Merge data into DOCX template
                await mergeDocxTemplate({
                    templateName: "document",
                    data: templateData,
                    outputFileName: documentId,
                });

                // 2. Generate PDF from the same HTML template
                await pdfService.generatePdf(html, `${documentId}-main`);
                const mainPdfAbsPath = join(GENERATED_DIR, `${documentId}-main.pdf`);

                // 3. Bundle main PDF + any attachments into a single PDF file
                const bundleAbsPath = await mergePdfs([mainPdfAbsPath], `${documentId}-bundle`);
                void bundleAbsPath; // absolute path used internally; fileUrl is URL-relative
                fileUrl = `/generated/${documentId}-bundle.pdf`;
            } else if (outputFormat === "pdf") {
                fileUrl = await pdfService.generatePdf(html, documentId);
            } else {
                fileUrl = await pdfService.saveHtml(html, documentId);
            }

            await prisma.$transaction([
                prisma.document.update({
                    where: { id: documentId },
                    data: { status: "COMPLETED", fileUrl }
                }),
                prisma.job.update({
                    where: { id: jobId },
                    data: {
                        status: "COMPLETED",
                        result: { fileUrl, completedAt: new Date().toISOString() }
                    }
                })
            ]);

            documentEmitter.emit("document:status", { documentId, status: "completed", fileUrl });
            console.log(`[Worker] Job ${job.id} completed. File: ${fileUrl}`);
            return { fileUrl };
        },
        {
            connection: bullmqConnection,
            concurrency: 3 // Process up to 3 jobs simultaneously
        }
    );

    worker.on("failed", async (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed:`, err.message);

        if (job?.data.jobId) {
            await prisma.job.update({
                where: { id: job.data.jobId },
                data: { status: "FAILED", error: err.message }
            });
            await prisma.document.update({
                where: { id: job.data.documentId },
                data: { status: "FAILED" }
            });
            documentEmitter.emit("document:status", { documentId: job.data.documentId, status: "failed" });
        }
    });

    return worker;
}