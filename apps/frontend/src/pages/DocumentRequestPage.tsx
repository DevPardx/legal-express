import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicForm } from "../components/form/DynamicForm";
import { documentRequestSchema } from "../lib/formSchema";
import { generateDocument } from "../lib/api";
import type { FormData } from "../hooks/useFormEngine";

export function DocumentRequestPage() {
  const navigate = useNavigate();
  const [_error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: FormData): Promise<string> => {
      setError(null);
      const res = await generateDocument({
        formId: documentRequestSchema.id,
        userId: crypto.randomUUID(),
        formData: data,
        outputFormat: (data["outputFormat"] as "pdf" | "html" | "docx" | undefined) ?? "pdf",
        templateId: String(data["documentType"] ?? "NDA"),
      });
      navigate(`/success/${res.jobId}`);
      return res.jobId;
    },
    [navigate]
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-12 py-10"
        tabIndex={-1}
      >
        <DynamicForm schema={documentRequestSchema} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
