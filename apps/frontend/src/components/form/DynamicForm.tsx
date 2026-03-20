import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { MultiStepFormSchema } from "@legal-express/shared";
import { useI18n } from "../../i18n";
import { useFormEngine } from "../../hooks/useFormEngine";
import { StepIndicator } from "./StepIndicator";
import { FormField } from "./FormField";
import { ReviewStep } from "./ReviewStep";
import type { FormData } from "../../hooks/useFormEngine";

interface DynamicFormProps {
  schema: MultiStepFormSchema;
  onSubmit: (data: FormData) => Promise<string>;
}

export function DynamicForm({ schema, onSubmit }: DynamicFormProps) {
  const { t } = useI18n();
  const {
    currentStep,
    totalSteps,
    currentStepSchema,
    formData,
    errors,
    isSubmitting,
    isFieldVisible,
    setValue,
    nextStep,
    prevStep,
    submit,
    stepContentRef,
  } = useFormEngine(schema, onSubmit);

  const isLastStep = currentStep === totalSteps - 1;
  const isReviewStep = currentStepSchema.id === "step-review";

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLastStep) {
      void submit();
    } else {
      nextStep();
    }
  };

  const stepTitleKey = `step.${currentStepSchema.id.replace("step-", "")}.title` as Parameters<typeof t>[0];
  const stepDescKey = `step.${currentStepSchema.id.replace("step-", "")}.description` as Parameters<typeof t>[0];
  const resolvedTitle =
    t(stepTitleKey) !== stepTitleKey ? t(stepTitleKey) : currentStepSchema.title;
  const resolvedDesc =
    t(stepDescKey) !== stepDescKey ? t(stepDescKey) : currentStepSchema.description;

  return (
    <div
      className="bg-white rounded-lg border border-[#E5E7EB] p-8 w-full max-w-2xl mx-auto flex flex-col gap-7"
      role="region"
      aria-label={schema.title}
    >
      <StepIndicator steps={schema.steps} currentStep={currentStep} />

      {resolvedDesc && (
        <p className="text-sm text-muted text-center">{resolvedDesc}</p>
      )}

      <div
        ref={stepContentRef as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
        className="outline-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">{resolvedTitle}</span>
      </div>

      <form
        id={`form-step-${currentStep}`}
        onSubmit={handleNext}
        noValidate
        aria-label={resolvedTitle}
      >
        {isReviewStep ? (
          <ReviewStep formData={formData} />
        ) : (
          <div className="flex flex-col gap-5">
            {currentStepSchema.fields.map((field) => {
              if (!isFieldVisible(field)) return null;

              const isUrgent = field.id === "urgencyReason";

              return (
                <div
                  key={field.id}
                  className={
                    isUrgent
                      ? "pl-4 border-l-[3px] border-amber"
                      : undefined
                  }
                >
                  <FormField
                    field={field}
                    value={formData[field.id]}
                    error={errors[field.id]}
                    onChange={setValue}
                  />
                </div>
              );
            })}

          </div>
        )}

        <div className="flex items-center justify-between mt-7">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 h-11 px-6 rounded-md border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              {t("form.previous")}
            </button>
          ) : (
            <div />
          )}

          <span className="text-sm text-muted" aria-live="polite">
            {t("form.stepOf", {
              current: currentStep + 1,
              total: totalSteps,
            })}
          </span>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 h-11 px-6 rounded-md bg-navy text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            )}
            {isSubmitting
              ? t("form.submitting")
              : isLastStep
                ? t("form.submit")
                : t("form.next")}
            {!isSubmitting && !isLastStep && (
              <ChevronRight size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
