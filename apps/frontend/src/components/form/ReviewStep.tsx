import type { FormData } from "../../hooks/useFormEngine";
import { useI18n } from "../../i18n";
import type { TranslationKey } from "../../i18n";

interface ReviewRowProps {
  labelKey: TranslationKey;
  value: string;
}

function ReviewRow({ labelKey, value }: ReviewRowProps) {
  const { t } = useI18n();
  return (
    <div className="flex justify-between py-2 border-b border-[#F3F4F6] last:border-0">
      <span className="text-sm text-muted">{t(labelKey)}</span>
      <span className="text-sm font-medium text-text text-right max-w-xs wrap-break-word">
        {value || t("review.none")}
      </span>
    </div>
  );
}

interface ReviewStepProps {
  formData: FormData;
}

export function ReviewStep({ formData }: ReviewStepProps) {
  const { t } = useI18n();

  const boolDisplay = (v: unknown) =>
    v ? t("review.yes") : t("review.no");

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="review-client-heading">
        <h3
          id="review-client-heading"
          className="text-sm font-semibold text-text mb-3 pb-1 border-b border-[#E5E7EB]"
        >
          {t("review.client")}
        </h3>
        <ReviewRow labelKey="review.label.fullName" value={String(formData["fullName"] ?? "")} />
        <ReviewRow labelKey="review.label.email" value={String(formData["email"] ?? "")} />
        <ReviewRow labelKey="review.label.phone" value={String(formData["phone"] ?? "")} />
        <ReviewRow labelKey="review.label.matter" value={String(formData["matter"] ?? "")} />
      </section>

      <section aria-labelledby="review-document-heading">
        <h3
          id="review-document-heading"
          className="text-sm font-semibold text-text mb-3 pb-1 border-b border-[#E5E7EB]"
        >
          {t("review.document")}
        </h3>
        <ReviewRow labelKey="review.label.documentType" value={String(formData["documentType"] ?? "")} />
        <ReviewRow labelKey="review.label.description" value={String(formData["description"] ?? "")} />
        <ReviewRow labelKey="review.label.urgent" value={boolDisplay(formData["urgent"])} />
        {Boolean(formData["urgent"]) && (
          <ReviewRow labelKey="review.label.urgencyReason" value={String(formData["urgencyReason"] ?? "")} />
        )}
        <ReviewRow labelKey="review.label.dueDate" value={String(formData["dueDate"] ?? "")} />
        <ReviewRow
          labelKey="review.label.estimatedAmount"
          value={formData["estimatedAmount"] ? `$${formData["estimatedAmount"]}` : ""}
        />
        <ReviewRow labelKey="review.label.outputFormat" value={String(formData["outputFormat"] ?? "").toUpperCase()} />
      </section>
    </div>
  );
}
