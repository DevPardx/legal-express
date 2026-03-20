import { useState, useEffect } from "react";
import { Receipt, Loader2 } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { listInvoices, type InvoiceEntry } from "../lib/api";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PAID: "bg-[#F0FDF4] text-[#16A34A]",
    PENDING: "bg-[#FFFBEB] text-[#D97706]",
    OVERDUE: "bg-[#FEF2F2] text-[#DC2626]",
    CANCELLED: "bg-[#F9FAFB] text-[#6B7280]",
  };
  return map[status] ?? "bg-[#F9FAFB] text-[#6B7280]";
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listInvoices()
      .then((data) => setInvoices(data.invoices))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load invoices"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-5 md:p-10">
        <div className="flex items-center gap-3">
          <Receipt size={24} className="text-primary" aria-hidden="true" />
          <h1 className="font-display font-semibold text-[28px] text-text tracking-tight">Invoices</h1>
        </div>

        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-sm text-error">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted">No invoices yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
                    <th scope="col" className="text-left px-5 h-12 text-xs font-semibold text-muted uppercase tracking-wide">Invoice ID</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide">Client</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide">Matter</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide">Amount</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                    <th scope="col" className="text-left px-3 h-12 text-xs font-semibold text-muted uppercase tracking-wide">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 h-13 font-mono text-xs text-text">{inv.id.slice(0, 12)}…</td>
                      <td className="px-3 h-13 text-muted">
                        {inv.user ? `${inv.user.firstName} ${inv.user.lastName}` : "—"}
                      </td>
                      <td className="px-3 h-13 text-muted">{inv.matter?.title ?? "—"}</td>
                      <td className="px-3 h-13 font-medium text-text">${Number(inv.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-3 h-13">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(inv.status)}`}>
                          {inv.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-3 h-13 text-muted">
                        {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-4 border-t border-[#E5E7EB]">
                <span className="text-sm text-muted">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
