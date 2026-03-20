import type { MultiStepFormSchema } from "@legal-express/shared";

export const documentRequestSchema: MultiStepFormSchema = {
  id: "legal-doc-request",
  title: "Document Request",
  steps: [
    {
      id: "step-client",
      title: "Client Information",
      description: "Tell us about the client for this document.",
      fields: [
        {
          id: "fullName",
          type: "text",
          label: "Full Name",
          placeholder: "Jane Doe",
          required: true,
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          placeholder: "jane@example.com",
          required: true,
        },
        {
          id: "phone",
          type: "text",
          label: "Phone Number",
          placeholder: "+1 (555) 000-0000",
        },
        {
          id: "matter",
          type: "text",
          label: "Matter / Case Reference",
          placeholder: "e.g. M-2024-001",
        },
      ],
    },
    {
      id: "step-document",
      title: "Document Details",
      description: "Fill in the details about your document request.",
      fields: [
        {
          id: "documentType",
          type: "select",
          label: "Document Type",
          placeholder: "Select a document type",
          required: true,
          options: [
            { value: "NDA", label: "Non-Disclosure Agreement (NDA)" },
            { value: "CONTRACT", label: "Contract" },
            { value: "INVOICE", label: "Invoice" },
            { value: "AGREEMENT", label: "Agreement" },
            { value: "LETTER", label: "Engagement Letter" },
          ],
        },
        {
          id: "description",
          type: "textarea",
          label: "Description (Optional)",
          placeholder: "Brief description of the document requirements...",
        },
        {
          id: "urgent",
          type: "checkbox",
          label: "Urgent Processing",
        },
        {
          id: "urgencyReason",
          type: "text",
          label: "Reason for Urgency",
          placeholder: "e.g. Contract deadline is approaching on March 22nd...",
          conditional: { field: "urgent", value: true },
          ariaDescribedBy: "urgencyReason-hint",
        },
        {
          id: "dueDate",
          type: "date",
          label: "Due Date",
        },
        {
          id: "estimatedAmount",
          type: "number",
          label: "Estimated Amount ($)",
          validation: { min: 0 },
        },
        {
          id: "outputFormat",
          type: "select",
          label: "Output Format",
          required: true,
          options: [
            { value: "pdf", label: "PDF" },
            { value: "html", label: "HTML" },
            { value: "docx", label: "DOCX + PDF Bundle" },
          ],
        },
      ],
    },
    {
      id: "step-review",
      title: "Review & Submit",
      description: "Review your request before submitting.",
      fields: [],
    },
  ],
};
