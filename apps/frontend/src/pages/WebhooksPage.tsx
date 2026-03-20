import { useState, useEffect } from "react";
import { Webhook, Loader2 } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useI18n } from "../i18n";
import { listWebhookEntries } from "../lib/api";

interface WebhookRow {
  id: string;
  status: string;
  result: Record<string, unknown> | null;
  updatedAt: string;
  document?: { title: string; type: string } | null;
}

export function WebhooksPage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<WebhookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listWebhookEntries()
      .then((data) => setEntries(data.entries))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }, []);

  function statusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-[#F0FDF4] text-[#16A34A]";
      case "failed": return "bg-[#FEF2F2] text-[#DC2626]";
      case "processing": return "bg-[#EFF6FF] text-[#2563EB]";
      default: return "bg-[#F9FAFB] text-[#6B7280]";
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-center gap-3">
          <Webhook size={24} className="text-primary" aria-hidden="true" />
          <h1 className="font-display font-semibold text-2xl text-text">{t("webhooks.title")}</h1>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden" role="region" aria-label="Payment webhooks">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-sm text-error">{error}</div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted">
              No webhook events received yet.
            </div>
          ) : (
            <>
              <table className="w-full text-sm" aria-label={t("webhooks.title")}>
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wide">Job ID</th>
                    <th scope="col" className="text-left px-3 py-3.5 text-xs font-semibold text-muted uppercase tracking-wide">Document</th>
                    <th scope="col" className="text-left px-3 py-3.5 text-xs font-semibold text-muted uppercase tracking-wide">{t("webhooks.table.paymentStatus")}</th>
                    <th scope="col" className="text-left px-3 py-3.5 text-xs font-semibold text-muted uppercase tracking-wide">Transaction ID</th>
                    <th scope="col" className="text-left px-3 py-3.5 text-xs font-semibold text-muted uppercase tracking-wide">{t("webhooks.table.receivedAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const result = entry.result ?? {};
                    const txId = (result["transactionId"] as string) ?? "—";
                    const payStatus = (result["paymentStatus"] as string) ?? entry.status;
                    return (
                      <tr key={entry.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-text">{entry.id.slice(0, 12)}…</td>
                        <td className="px-3 py-3.5 text-sm text-muted">{entry.document?.title ?? "—"}</td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(payStatus)}`}>
                            {payStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-xs text-muted">{txId}</td>
                        <td className="px-3 py-3.5 text-muted text-xs">
                          {new Date(entry.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-5 py-4 border-t border-[#E5E7EB]">
                <span className="text-sm text-muted">{entries.length} event{entries.length !== 1 ? "s" : ""}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
