import { useState, useEffect, useCallback } from "react";
import { Plus, Download, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useI18n } from "../i18n";
import { listDocuments, deleteDocument, type DocumentSummary } from "../lib/api";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { useDocumentEvents } from "../hooks/useDocumentEvents";
import type { JobStatus } from "@legal-express/shared";

export function DocumentsListPage() {
  const { t } = useI18n();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 10;

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    listDocuments(page, limit)
      .then((data) => { setDocuments(data.documents); setTotal(data.total); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }, [page]);

  // Poll while any document is in an active state
  useEffect(() => {
    const hasActive = documents.some((d) => d.status === "queued" || d.status === "processing");
    if (!hasActive) return;
    const interval = setInterval(() => {
      listDocuments(page, limit).then((data) => {
        setDocuments(data.documents);
        setTotal(data.total);
      }).catch(() => null);
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, page]);

  useDocumentEvents(useCallback((event) => {
    if (event.type === "document:status") {
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id !== event.documentId) return d;
          const fileUrl: string | null = event.fileUrl !== undefined ? event.fileUrl : d.fileUrl;
          return { ...d, status: event.status as JobStatus, fileUrl };
        })
      );
    }
  }, []));

  const totalPages = Math.ceil(total / limit);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setTotal((prev) => prev - 1);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
    <DashboardLayout>
      <div className="flex flex-col gap-7 p-10">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-semibold text-[28px] text-text tracking-tight">
            {t("nav.myDocuments")}
          </h1>
          <Link
            to="/request"
            className="flex items-center gap-2 h-11 px-5 rounded-md bg-navy text-white font-display font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} aria-hidden="true" />
            {t("header.newRequest")}
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-sm text-error">{error}</div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm text-muted">No documents yet.</p>
              <Link to="/request" className="text-sm text-primary hover:underline">Create your first document →</Link>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                    <th scope="col" className="text-left px-5 h-12 text-xs font-semibold text-muted uppercase tracking-wide w-60">{t("dashboard.table.title")}</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide w-36">{t("dashboard.table.type")}</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide w-36">{t("dashboard.table.status")}</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide w-36">{t("dashboard.table.created")}</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide">{t("dashboard.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const docTypeKey = `docType.${doc.type}` as Parameters<typeof t>[0];
                    return (
                      <tr key={doc.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-5 h-13 font-medium text-text">
                          <Link to={`/documents/${doc.id}`} className="hover:underline focus:underline focus:outline-none">
                            {doc.title}
                          </Link>
                        </td>
                        <td className="px-3 h-13"><span className="text-sm text-text">{t(docTypeKey)}</span></td>
                        <td className="px-3 h-13"><StatusBadge status={doc.status as JobStatus} /></td>
                        <td className="px-3 h-13 text-muted">
                          {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-3 h-13">
                          <div className="flex items-center gap-2">
                            <button type="button" disabled={!doc.fileUrl} onClick={() => doc.fileUrl && window.open(doc.fileUrl, "_blank")} className="p-1.5 rounded hover:bg-gray-100 text-muted hover:text-text transition-colors disabled:opacity-40" aria-label={`${t("action.download")} ${doc.title}`}>
                              <Download size={16} />
                            </button>
                            <button type="button" onClick={() => setDeleteTarget(doc)} className="p-1.5 rounded hover:bg-[#FEF2F2] text-muted hover:text-error transition-colors" aria-label={`${t("action.delete")} ${doc.title}`}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-10 py-4 border-t border-[#E5E7EB]">
                <span className="text-sm text-muted">
                  {t("dashboard.showing", { count: documents.length, total })}
                </span>
                {totalPages > 1 && (
                  <nav aria-label="Pagination">
                    <ul className="flex items-center gap-1">
                      <li>
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-[#E5E7EB] text-text hover:bg-gray-50 disabled:opacity-40">‹</button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <li key={p}>
                          <button type="button" onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-navy text-white" : "bg-white border border-[#E5E7EB] text-text hover:bg-gray-50"}`}
                            aria-current={p === page ? "page" : undefined}>{p}</button>
                        </li>
                      ))}
                      <li>
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-[#E5E7EB] text-text hover:bg-gray-50 disabled:opacity-40">›</button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>

    <ConfirmModal
      isOpen={deleteTarget !== null}
      title="Delete document"
      message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      isLoading={isDeleting}
      onConfirm={handleDeleteConfirm}
      onCancel={() => setDeleteTarget(null)}
    />
    </>
  );
}
