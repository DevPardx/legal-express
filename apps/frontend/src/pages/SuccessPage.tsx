import { Check, Timer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useI18n } from "../i18n";

export function SuccessPage() {
  const { t } = useI18n();
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <div className="min-h-screen flex flex-col bg-bg">

      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-12 py-10"
        tabIndex={-1}
        aria-label="Submission success"
      >
        <div
          className="bg-white rounded-lg border border-[#E5E7EB] px-10 py-12 w-full max-w-lg flex flex-col items-center gap-6 text-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center"
            aria-hidden="true"
          >
            <Check size={32} className="text-success" strokeWidth={2.5} />
          </div>

          <h1 className="font-display font-semibold text-2xl text-text">
            {t("success.title")}
          </h1>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm text-muted">{t("success.jobIdPrefix")}</span>
            <span className="px-2.5 py-1 rounded bg-[#F5F6F8] border border-[#E5E7EB] font-mono text-sm font-medium text-text">
              {jobId ?? "JOB-XXXX-XXXX"}
            </span>
          </div>

          <p className="text-sm text-muted">{t("success.notifyText")}</p>

          <div className="flex flex-col gap-3 w-full">
            <Link
              to="/documents"
              className="flex items-center justify-center h-12 px-8 rounded-md bg-navy text-white font-display font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {t("success.trackStatus")}
            </Link>

            <Link
              to="/request"
              className="flex items-center justify-center h-11 px-6 rounded-md border border-[#D1D5DB] text-[#374151] font-display font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              {t("success.newRequest")}
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-muted text-xs">
            <Timer size={14} aria-hidden="true" />
            <span>{t("success.estimatedTime")}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
