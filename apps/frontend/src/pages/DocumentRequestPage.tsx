import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../i18n";
import { DynamicForm } from "../components/form/DynamicForm";
import { documentRequestSchema } from "../lib/formSchema";
import { generateDocument } from "../lib/api";
import type { FormData } from "../hooks/useFormEngine";

export function DocumentRequestPage() {
  const { t } = useI18n();
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
      <div className="px-6 py-4 border-b border-[#E5E7EB] bg-white">
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-text transition-colors"
        >
          <ArrowLeft size={16} />
          {t("request.back")}
        </Link>
      </div>
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-5 sm:px-12 py-10"
        tabIndex={-1}
      >
        <DynamicForm schema={documentRequestSchema} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
