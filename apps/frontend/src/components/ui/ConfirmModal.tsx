import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center">
            <AlertTriangle size={18} className="text-error" />
          </div>
          <div className="flex flex-col gap-1">
            <h2
              id="confirm-modal-title"
              className="font-display font-semibold text-base text-text"
            >
              {title}
            </h2>
            <p className="text-sm text-muted leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="h-9 px-4 rounded-md text-sm font-medium text-text border border-[#E5E7EB] bg-white hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-9 px-4 rounded-md text-sm font-medium text-white bg-error hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
