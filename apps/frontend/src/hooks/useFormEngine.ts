import { useState, useCallback, useRef } from "react";
import type {
  MultiStepFormSchema,
  FormFieldSchema,
  FormStepSchema,
} from "@legal-express/shared";
import { useI18n } from "../i18n";

export type FormData = Record<string, unknown>;
export type FormErrors = Record<string, string>;

interface UseFormEngineReturn {
  currentStep: number;
  totalSteps: number;
  currentStepSchema: FormStepSchema;
  formData: FormData;
  errors: FormErrors;
  isSubmitting: boolean;
  isFieldVisible: (field: FormFieldSchema) => boolean;
  setValue: (id: string, value: unknown) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  submit: () => Promise<string | null>;
  stepContentRef: React.RefObject<HTMLDivElement | null>;
}

export function useFormEngine(
  schema: MultiStepFormSchema,
  onSubmit: (data: FormData) => Promise<string>
): UseFormEngineReturn {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepContentRef = useRef<HTMLDivElement | null>(null);

  const totalSteps = schema.steps.length;
  const currentStepSchema = schema.steps[currentStep] ?? schema.steps[0];

  const isFieldVisible = useCallback(
    (field: FormFieldSchema): boolean => {
      if (!field.conditional) return true;
      return formData[field.conditional.field] === field.conditional.value;
    },
    [formData]
  );

  const validateField = useCallback(
    (field: FormFieldSchema, value: unknown): string | null => {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "boolean" && field.type === "checkbox"
          ? false
          : false);

      if (field.required && (value === undefined || value === null || value === "")) {
        return t("validation.required");
      }

      if (field.type === "email" && value) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(String(value))) return t("validation.email");
      }

      if (field.validation && value !== undefined && value !== "") {
        const { min, max, pattern, patternMessage } = field.validation;
        const num = Number(value);
        if (min !== undefined && !isNaN(num) && num < min)
          return t("validation.min", { min });
        if (max !== undefined && !isNaN(num) && num > max)
          return t("validation.max", { max });
        if (pattern && !new RegExp(pattern).test(String(value)))
          return patternMessage ?? t("validation.pattern");
      }

      // suppress unused variable warning
      void isEmpty;
      return null;
    },
    [t]
  );

  const validateStep = useCallback(
    (stepIndex: number): FormErrors => {
      const step = schema.steps[stepIndex];
      if (!step) return {};
      const newErrors: FormErrors = {};
      for (const field of step.fields) {
        if (!isFieldVisible(field)) continue;
        const error = validateField(field, formData[field.id]);
        if (error) newErrors[field.id] = error;
      }
      return newErrors;
    },
    [schema, formData, isFieldVisible, validateField]
  );

  const setValue = useCallback((id: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const focusStepTop = useCallback(() => {
    setTimeout(() => {
      stepContentRef.current?.focus();
    }, 50);
  }, []);

  const nextStep = useCallback((): boolean => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    focusStepTop();
    return true;
  }, [currentStep, totalSteps, validateStep, focusStepTop]);

  const prevStep = useCallback(() => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    focusStepTop();
  }, [focusStepTop]);

  const submit = useCallback(async (): Promise<string | null> => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return null;
    }
    setIsSubmitting(true);
    try {
      const jobId = await onSubmit(formData);
      return jobId;
    } catch {
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, onSubmit, validateStep]);

  return {
    currentStep,
    totalSteps,
    currentStepSchema: currentStepSchema!,
    formData,
    errors,
    isSubmitting,
    isFieldVisible,
    setValue,
    nextStep,
    prevStep,
    submit,
    stepContentRef,
  };
}
