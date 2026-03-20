// Shared types used by both frontend and backend

export interface FormFieldSchema {
    id: string;
    type: "text" | "email" | "textarea" | "select" | "checkbox" | "radio" | "date" | "number";
    label: string;
    placeholder?: string;
    required?:boolean;
    validation?: FieldValidation;
    options?: SelectOption[]
    conditional?: ConditionalRule;
    ariaDescribedBy?: string;
}

export interface FieldValidation {
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface ConditionalRule {
    field: string;
    value: string | boolean | number;
}

export interface FormStepSchema {
    id: string;
    title: string;
    description?: string;
    fields: FormFieldSchema[];
}

export interface MultiStepFormSchema {
    id: string;
    title: string;
    steps: FormStepSchema[];
}

// API contract types
export interface GenerateDocRequest {
    formId: string;
    userId: string;
    formData: Record<string, unknown>;
    outputFormat: "pdf" | "html" | "docx";
    templateId?: string | undefined;
}

export interface GenerateDocResponse {
    jobId: string;
    status: JobStatus;
    documentId: string;
    fileUrl?: string;
    message: string;
}

export interface WebhookPaymentPayload {
    jobId: string;
    paymentStatus: "paid" | "failed" | "refunded";
    amount: number;
    currency: string;
    transactionId: string;
    timestamp: string;
}

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}