export type {
    GenerateDocRequest,
    GenerateDocResponse,
    WebhookPaymentPayload,
    JobStatus,
    ApiResponse,
    ApiError
} from "@legal-express/shared";

// Backend-specific types
export interface PdfGenerationJob {
    documentId: string;
    jobId: string;
    templateId: string;
    formData: Record<string, unknown>;
    outputFormat: "pdf" | "html" | "docx";
}

export interface TemplateData {
    [key: string]: unknown;
    generatedAt: string;
    documentId: string;
}