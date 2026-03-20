import { prisma } from "@/config/database.config.js";
import { JobStatus, Prisma } from "@prisma/client";
import { pdfQueue } from "@/queues/pdf.queue.js";
import type {
    GenerateDocRequest,
    GenerateDocResponse
} from "@legal-express/shared";

export class DocumentService {
    async generateDocument(request: GenerateDocRequest) {
        const { formData, outputFormat, userId } = request;

        const email = (formData["email"] as string) ?? `${userId}@unknown.com`;
        const fullName = ((formData["fullName"] as string) ?? "").trim();
        const spaceIndex = fullName.indexOf(" ");
        const firstName = spaceIndex > 0 ? fullName.slice(0, spaceIndex) : fullName || "Unknown";
        const lastName = spaceIndex > 0 ? fullName.slice(spaceIndex + 1).trim() : "User";

        let existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
            try {
                existingUser = await prisma.user.create({ data: { id: userId, email, firstName, lastName } });
            } catch (e) {
                // P2002 means a concurrent request just created this user — re-fetch and continue
                if ((e as { code?: string }).code !== "P2002") throw e;
                existingUser = await prisma.user.findUniqueOrThrow({ where: { email } });
            }
        } else if (fullName && (existingUser.firstName === "Unknown" || existingUser.firstName === "")) {
            existingUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: { firstName, lastName }
            });
        }
        const resolvedUserId = existingUser.id;

        const documentType = ((formData["documentType"] as string) ?? "LETTER").toUpperCase() as "CONTRACT" | "INVOICE" | "AGREEMENT" | "LETTER" | "NDA";
        const matterTitle = (formData["matter"] as string)?.trim()
            || `${fullName || "Client"} — ${documentType}`;

        const { document, job } = await prisma.$transaction(async tx => {
            const job = await tx.job.create({
                data: {
                    status: "QUEUED",
                    payload: {
                        ...request,
                        formData
                    } as Prisma.InputJsonValue
                }
            });

            const matter = await tx.matter.create({
                data: {
                    title: matterTitle,
                    description: (formData["description"] as string) ?? null,
                    status: "OPEN",
                    userId: resolvedUserId
                }
            });

            const document = await tx.document.create({
                data: {
                    title: `${documentType} - ${new Date().toLocaleDateString()}`,
                    type: documentType,
                    status: "PENDING",
                    formData: formData as Prisma.InputJsonValue,
                    jobId: job.id,
                    matterId: matter.id
                }
            });

            return { document, job };
        });

        await pdfQueue.add(
            "generate-pdf",
            {
                documentId: document.id,
                jobId: job.id,
                templateId: "document",
                formData: formData as Record<string, unknown>,
                outputFormat
            },
            { jobId: job.id }
        );

        return {
            jobId: job.id,
            documentId: document.id,
            status: "queued",
            message: "Document generate queued successfully."
        }
    }

    async getDocumentStatus(documentId: string) {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: { job: true }
        });

        if (!document) {
            return null;
        }

        return {
            documentId: document.id,
            status: document.status.toLowerCase(),
            fileUrl: document.fileUrl,
            jobId: document.jobId,
            jobStatus: document.job?.status.toLowerCase()
        }
    }
}

export const documentService = new DocumentService();