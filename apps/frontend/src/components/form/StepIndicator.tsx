import { Check } from "lucide-react";
import type { FormStepSchema } from "@legal-express/shared";
import { useI18n } from "../../i18n";

interface StepIndicatorProps {
  steps: FormStepSchema[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { t } = useI18n();

  return (
    <div
      role="list"
      aria-label="Form progress"
      className="flex items-center justify-center w-full"
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        const stepTitleKey = `step.${step.id.replace("step-", "")}.title` as Parameters<typeof t>[0];
        const label = t(stepTitleKey) !== stepTitleKey ? t(stepTitleKey) : step.title;

        return (
          <div key={step.id} className="flex items-center" role="listitem">
            <div className="flex items-center gap-2">
              <div
                className={`
                  flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0
                  transition-colors
                  ${isCompleted ? "bg-success text-white" : ""}
                  ${isCurrent ? "bg-navy text-white ring-2 ring-navy ring-offset-2" : ""}
                  ${!isCompleted && !isCurrent ? "bg-[#E5E7EB] text-muted" : ""}
                `}
                aria-label={
                  isCompleted
                    ? `${label} – completed`
                    : isCurrent
                      ? `${label} – current step`
                      : `${label} – not started`
                }
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">{index + 1}</span>
                )}
              </div>

              <span
                className={`text-sm font-medium hidden sm:block ${
                  isCurrent ? "text-text" : isCompleted ? "text-success" : "text-muted"
                }`}
                aria-hidden="true"
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`mx-3 h-0.5 w-12 rounded shrink-0 ${
                  isCompleted ? "bg-success" : "bg-[#D1D5DB]"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
