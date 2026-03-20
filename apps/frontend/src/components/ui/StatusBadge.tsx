import type { JobStatus } from "@legal-express/shared";
import { useI18n } from "../../i18n";

interface StatusBadgeProps {
  status: JobStatus;
}

const STATUS_STYLES: Record<JobStatus, string> = {
  completed: "bg-[#F0FDF4] text-[#16A34A]",
  processing: "bg-[#EFF6FF] text-[#2563EB]",
  queued: "bg-[#FFFBEB] text-[#D97706]",
  failed: "bg-[#FEF2F2] text-[#DC2626]",
};

const STATUS_KEYS: Record<JobStatus, "status.completed" | "status.processing" | "status.queued" | "status.failed"> = {
  completed: "status.completed",
  processing: "status.processing",
  queued: "status.queued",
  failed: "status.failed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}
      aria-label={t(STATUS_KEYS[status])}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}

interface PaymentStatusBadgeProps {
  status: "paid" | "failed" | "refunded" | "pending";
}

const PAYMENT_STYLES: Record<PaymentStatusBadgeProps["status"], string> = {
  paid: "bg-[#F0FDF4] text-[#16A34A]",
  failed: "bg-[#FEF2F2] text-[#DC2626]",
  refunded: "bg-[#FFFBEB] text-[#D97706]",
  pending: "bg-[#EFF6FF] text-[#2563EB]",
};

const PAYMENT_KEYS: Record<
  PaymentStatusBadgeProps["status"],
  "paymentStatus.paid" | "paymentStatus.failed" | "paymentStatus.refunded" | "paymentStatus.pending"
> = {
  paid: "paymentStatus.paid",
  failed: "paymentStatus.failed",
  refunded: "paymentStatus.refunded",
  pending: "paymentStatus.pending",
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PAYMENT_STYLES[status]}`}
    >
      {t(PAYMENT_KEYS[status])}
    </span>
  );
}
