import axios from "axios";
import type {
  GenerateDocRequest,
  GenerateDocResponse,
  ApiResponse,
  JobStatus,
} from "@legal-express/shared";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach auth token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("le_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Types
export interface DocumentSummary {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  fileUrl?: string | null;
  job?: { id: string; status: string } | null;
}

export interface DocumentDetail extends DocumentSummary {
  content: string | null;
  fileUrl: string | null;
  formData: Record<string, unknown>;
  jobId: string | null;
  matter?: { user?: { firstName: string; lastName: string; email: string } | null } | null;
}

export interface DashboardStats {
  total: number;
  completedMonth: number;
  pending: number;
}

export interface InvoiceEntry {
  id: string;
  amount: string;
  status: string;
  dueDate: string;
  createdAt: string;
  user?: { email: string; firstName: string; lastName: string } | null;
  matter?: { title: string } | null;
}

export interface WebhookEntry {
  transactionId: string;
  valId: string;
  paymentStatus: "paid" | "failed" | "refunded" | "pending";
  amount: number;
  currency: string;
  receivedAt: string;
}

// Document generation
export async function generateDocument(payload: GenerateDocRequest): Promise<GenerateDocResponse> {
  const res = await client.post<ApiResponse<GenerateDocResponse>>("/generate-doc", payload);
  const body = res.data;
  if (!body.success || !body.data) throw new Error(body.error?.message ?? "Failed to generate document");
  return body.data;
}

// Document status
export async function getDocumentStatus(documentId: string): Promise<{ status: JobStatus; fileUrl?: string }> {
  const res = await client.get<ApiResponse<{ status: JobStatus; fileUrl?: string }>>(`/documents/${documentId}/status`);
  const body = res.data;
  if (!body.success || !body.data) throw new Error(body.error?.message ?? "Failed to fetch status");
  return body.data;
}

// List documents
export async function listDocuments(page = 1, limit = 10): Promise<{
  documents: DocumentSummary[];
  total: number;
  page: number;
  limit: number;
  stats: DashboardStats;
}> {
  const res = await client.get<ApiResponse<{ documents: DocumentSummary[]; total: number; page: number; limit: number; stats: DashboardStats }>>(
    `/documents?page=${page}&limit=${limit}`
  );
  const body = res.data;
  if (!body.success || !body.data) throw new Error(body.error?.message ?? "Failed to fetch documents");
  return body.data;
}

// Get document by id
export async function getDocumentById(id: string): Promise<DocumentDetail> {
  const res = await client.get<ApiResponse<DocumentDetail>>(`/documents/${id}`);
  const body = res.data;
  if (!body.success || !body.data) throw new Error(body.error?.message ?? "Document not found");
  return body.data;
}

// Delete document
export async function deleteDocument(id: string): Promise<void> {
  await client.delete(`/documents/${id}`);
}

// Regenerate document
export async function regenerateDocument(id: string): Promise<void> {
  await client.post(`/documents/${id}/regenerate`);
}

// List invoices
export async function listInvoices(): Promise<{ invoices: InvoiceEntry[] }> {
  const res = await client.get<ApiResponse<{ invoices: InvoiceEntry[] }>>("/invoices");
  const body = res.data;
  if (!body.success || !body.data) throw new Error(body.error?.message ?? "Failed to fetch invoices");
  return body.data;
}

// List webhook entries (jobs with results)
export async function listWebhookEntries(): Promise<{ entries: Array<{
  id: string;
  status: string;
  result: Record<string, unknown> | null;
  updatedAt: string;
  document?: { title: string; type: string } | null;
}> }> {
  const res = await client.get<ApiResponse<{ entries: Array<{
    id: string;
    status: string;
    result: Record<string, unknown> | null;
    updatedAt: string;
    document?: { title: string; type: string } | null;
  }> }>>("/webhooks");
  const body = res.data;
  if (!body.success || !body.data) throw new Error(body.error?.message ?? "Failed to fetch webhooks");
  return body.data;
}
