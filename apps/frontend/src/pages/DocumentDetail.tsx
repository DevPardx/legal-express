import { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, Trash2, ChevronRight, Scale, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { useI18n } from "../i18n";
import { getDocumentById, deleteDocument, regenerateDocument, type DocumentDetail as DocDetail } from "../lib/api";
import { useDocumentEvents } from "../hooks/useDocumentEvents";
import type { JobStatus } from "@legal-express/shared";

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-success" : "text-text"}`}>{value}</span>
    </div>
  );
}

export function DocumentDetail() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getDocumentById(id)
      .then(setDoc)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load document"))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Poll while document is processing — derive status so `doc` object isn't a dep
  const docStatus = doc?.status;
  useEffect(() => {
    if (!id) return;
    if (docStatus !== "queued" && docStatus !== "processing") return;
    const interval = setInterval(() => {
      getDocumentById(id).then(setDoc).catch(() => null);
    }, 2000);
    return () => clearInterval(interval);
  }, [id, docStatus]);

  // Build blob URL when fileUrl changes to an HTML file
  useEffect(() => {
    if (!doc?.fileUrl?.endsWith(".html")) return;
    let objectUrl: string | null = null;
    fetch(doc.fileUrl)
      .then((r) => r.text())
      .then((html) => {
        const blob = new Blob([html], { type: "text/html" });
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => null);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlobUrl(null);
    };
  }, [doc?.fileUrl]);

  useDocumentEvents(useCallback((event) => {
    if (event.type !== "document:status" || event.documentId !== id) return;
    setDoc((prev) => prev ? { ...prev, status: event.status as JobStatus, fileUrl: event.fileUrl ?? prev.fileUrl } : prev);
  }, [id]));

  const formData = (doc?.formData ?? {}) as Record<string, string>;
  const clientName = formData["fullName"]
    ?? (formData["firstName"] ? `${formData["firstName"]} ${formData["lastName"] ?? ""}`.trim() : "—");
  const clientEmail = formData["email"] ?? doc?.matter?.user?.email ?? "—";

  const isHtml = doc?.fileUrl?.endsWith(".html") ?? false;
  const isBundle = doc?.fileUrl?.endsWith("-bundle.pdf") ?? false;
  const docxUrl = isBundle ? doc!.fileUrl!.replace("-bundle.pdf", ".docx") : null;

  async function handleRegenerate() {
    if (!id) return;
    setIsRegenerating(true);
    setBlobUrl(null);
    try {
      await regenerateDocument(id);
      const updated = await getDocumentById(id);
      setDoc(updated);
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteDocument(id);
      navigate("/documents/list", { replace: true });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDownload(url?: string | null, ext?: string) {
    const src = url ?? blobUrl ?? doc?.fileUrl;
    if (!src) return;
    const resolvedExt = ext ?? (src.endsWith(".pdf") ? "pdf" : src.endsWith(".docx") ? "docx" : "html");
    const a = document.createElement("a");
    a.href = src;
    a.download = `${doc?.title ?? "document"}.${resolvedExt}`;
    a.click();
  }

  const fileLabel = isBundle ? "PDF Bundle" : doc?.fileUrl?.endsWith(".pdf") ? "PDF" : doc?.fileUrl ? "HTML" : "PDF";

  return (
    <>
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 md:px-8 py-4 bg-white border-b border-[#E5E7EB]">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link to="/documents/list" className="text-sm font-medium text-primary hover:underline">
                {t("detail.breadcrumb.documents")}
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={14} className="text-muted" /></li>
            <li>
              <span className="text-sm font-medium text-text" aria-current="page">
                {doc?.title ?? "Loading…"}
              </span>
            </li>
          </ol>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {isBundle && docxUrl && (
            <button
              type="button"
              onClick={() => handleDownload(docxUrl, "docx")}
              className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg border border-navy text-navy text-sm font-medium hover:bg-navy/5 transition-colors"
            >
              <Download size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Download </span>DOCX
            </button>
          )}
          <button
            type="button"
            disabled={!doc?.fileUrl}
            onClick={() => handleDownload()}
            className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg bg-navy text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Download size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Download </span>{fileLabel}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 p-5 md:p-8 min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-muted" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-sm text-error">{error}</div>
        ) : !doc ? null : (
          <>
            <div className="flex-1 min-w-0 flex flex-col">
              {isHtml && blobUrl ? (
                <iframe
                  src={blobUrl}
                  title={doc.title}
                  className="flex-1 w-full rounded-lg border border-[#E5E7EB] shadow-sm bg-white"
                  style={{ minHeight: "600px" }}
                />
              ) : (
                <article className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-10 flex flex-col gap-6" aria-label="Document preview">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Scale size={18} className="text-primary" aria-hidden="true" />
                      <span className="font-display font-semibold text-sm text-primary">Legal Express Inc.</span>
                    </div>
                    <span className="text-sm text-muted">
                      {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <hr className="border-[#E5E7EB]" />

                  <div className="text-center">
                    <h1 className="font-display font-semibold text-xl text-text uppercase tracking-wide">
                      {doc.title}
                    </h1>
                    {clientName !== "—" && (
                      <p className="text-sm text-muted mt-1">Between Legal Express Inc. and {clientName}</p>
                    )}
                  </div>

                  <hr className="border-[#E5E7EB]" />

                  {doc.status === "completed" ? (
                    <div className="text-sm text-muted">
                      <p>Document generated. <button type="button" onClick={() => handleDownload()} className="text-primary hover:underline">Download to view</button>.</p>
                    </div>
                  ) : doc.status === "failed" ? (
                    <div className="text-sm text-error">
                      <p>Generation failed. Use Re-generate to try again.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      <p>Document is being processed. The full content will be available once generation is complete.</p>
                    </div>
                  )}
                </article>
              )}
            </div>

            <aside className="w-full lg:w-90 lg:shrink-0 flex flex-col gap-4" aria-label="Document details">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 flex flex-col gap-4">
                <h2 className="font-display font-semibold text-[15px] text-text">{t("detail.info.title")}</h2>
                <hr className="border-[#E5E7EB]" />
                <div className="flex flex-col divide-y divide-[#F3F4F6]">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted">{t("detail.info.status")}</span>
                    <StatusBadge status={doc.status as JobStatus} />
                  </div>
                  <InfoRow label={t("detail.info.jobId")} value={doc.jobId?.slice(0, 12) ?? "—"} />
                  <InfoRow label={t("detail.info.type")} value={doc.type} />
                  <InfoRow
                    label={t("detail.info.created")}
                    value={new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  />
                  <InfoRow label={t("detail.info.available")} value={doc.fileUrl ? "Available" : "Pending"} highlight={!!doc.fileUrl} />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 flex flex-col gap-4">
                <h2 className="font-display font-semibold text-[15px] text-text">{t("detail.client.title")}</h2>
                <hr className="border-[#E5E7EB]" />
                <div className="flex flex-col divide-y divide-[#F3F4F6]">
                  <InfoRow label={t("detail.client.name")} value={clientName} />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted">{t("detail.client.email")}</span>
                    {clientEmail !== "—" ? (
                      <a href={`mailto:${clientEmail}`} className="text-sm font-medium text-primary hover:underline">{clientEmail}</a>
                    ) : (
                      <span className="text-sm font-medium text-text">—</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 flex flex-col gap-4">
                <h2 className="font-display font-semibold text-[15px] text-text">{t("detail.actions.title")}</h2>
                <hr className="border-[#E5E7EB]" />
                <div className="flex flex-col gap-2">
                  {isBundle && docxUrl && (
                    <button type="button" onClick={() => handleDownload(docxUrl, "docx")}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-navy text-navy text-sm font-medium hover:bg-navy/5 transition-colors">
                      <Download size={16} aria-hidden="true" />Download DOCX
                    </button>
                  )}
                  <button type="button" disabled={!doc.fileUrl} onClick={() => handleDownload()}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
                    <Download size={16} aria-hidden="true" />Download {fileLabel}
                  </button>
                  <button type="button" onClick={handleRegenerate} disabled={isRegenerating}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-text text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                    <RefreshCw size={16} className={isRegenerating ? "animate-spin" : ""} aria-hidden="true" />
                    {isRegenerating ? "Regenerating…" : t("detail.actions.regenerate")}
                  </button>
                  <button type="button" onClick={() => setShowDeleteModal(true)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-error text-sm font-medium hover:bg-[#FEF2F2] transition-colors">
                    <Trash2 size={16} aria-hidden="true" />{t("detail.actions.delete")}
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </DashboardLayout>

    <ConfirmModal
      isOpen={showDeleteModal}
      title="Delete document"
      message={`Are you sure you want to delete "${doc?.title}"? This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      isLoading={isDeleting}
      onConfirm={handleDeleteConfirm}
      onCancel={() => setShowDeleteModal(false)}
    />
    </>
  );
}
