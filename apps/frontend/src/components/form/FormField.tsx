import type { FormFieldSchema } from "@legal-express/shared";
import { TriangleAlert } from "lucide-react";
import { useI18n } from "../../i18n";
import type { TranslationKey } from "../../i18n";
import type { FormData } from "../../hooks/useFormEngine";

interface FormFieldProps {
  field: FormFieldSchema;
  value: unknown;
  error?: string | undefined;
  onChange: (id: string, value: unknown) => void;
}

function getTranslatedLabel(field: FormFieldSchema, t: (key: TranslationKey) => string): string {
  const labelKey = `field.${field.id}.label` as TranslationKey;
  return t(labelKey) !== labelKey ? t(labelKey) : field.label;
}

function getTranslatedPlaceholder(field: FormFieldSchema, t: (key: TranslationKey) => string): string | undefined {
  if (!field.placeholder) return undefined;
  const key = `field.${field.id}.placeholder` as TranslationKey;
  return t(key) !== key ? t(key) : field.placeholder;
}

function getTranslatedOption(
  fieldId: string,
  optionValue: string,
  optionLabel: string,
  t: (key: TranslationKey) => string
): string {
  const key = `field.${fieldId}.options.${optionValue}` as TranslationKey;
  return t(key) !== key ? t(key) : optionLabel;
}

export function FormField({ field, value, error, onChange }: FormFieldProps) {
  const { t } = useI18n();
  const fieldId = `field-${field.id}`;
  const errorId = `${fieldId}-error`;
  const hintId = field.ariaDescribedBy;

  const label = getTranslatedLabel(field, t);
  const placeholder = getTranslatedPlaceholder(field, t);

  const baseInputClass = `
    w-full px-3 py-2 rounded-md border text-sm text-text bg-white
    transition-colors
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? "border-error" : "border-[#E5E7EB]"}
  `;

  const sharedProps = {
    id: fieldId,
    name: field.id,
    required: field.required ?? false,
    "aria-required": field.required ?? false,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby":
      [error ? errorId : "", hintId ?? ""].filter(Boolean).join(" ") || undefined,
  };

  if (field.type === "checkbox") {
    return (
      <div className="flex items-start gap-3">
        <div className="flex items-center h-5 mt-0.5">
          <input
            {...sharedProps}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(field.id, e.target.checked)}
            className="w-4 h-4 rounded border-[#D1D5DB] text-primary accent-primary cursor-pointer focus:ring-2 focus:ring-primary focus:ring-offset-1"
          />
        </div>
        <label htmlFor={fieldId} className="text-sm font-medium text-text cursor-pointer">
          {label}
        </label>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-error mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-text">
        {label}
        {field.required && (
          <span className="text-error ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {field.type === "textarea" && (
        <textarea
          {...sharedProps}
          rows={4}
          placeholder={placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={`${baseInputClass} resize-none`}
        />
      )}

      {field.type === "select" && (
        <select
          {...sharedProps}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={baseInputClass}
        >
          <option value="" disabled>
            {getTranslatedPlaceholder(field, t) ??
              t(`field.${field.id}.placeholder` as TranslationKey)}
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {getTranslatedOption(field.id, opt.value, opt.label, t)}
            </option>
          ))}
        </select>
      )}

      {(field.type === "text" || field.type === "email") && (
        <input
          {...sharedProps}
          type={field.type}
          placeholder={placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={baseInputClass}
          autoComplete={field.type === "email" ? "email" : undefined}
        />
      )}

      {field.type === "date" && (
        <input
          {...sharedProps}
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(field.id, e.target.value)}
          className={baseInputClass}
        />
      )}

      {field.type === "number" && (
        <input
          {...sharedProps}
          type="number"
          placeholder={placeholder}
          value={value !== undefined && value !== "" ? String(value) : ""}
          min={field.validation?.min}
          max={field.validation?.max}
          onChange={(e) =>
            onChange(field.id, e.target.value === "" ? "" : Number(e.target.value))
          }
          className={baseInputClass}
        />
      )}

      {field.type === "radio" && (
        <fieldset>
          <legend className="sr-only">{label}</legend>
          <div className="flex flex-col gap-2">
            {field.options?.map((opt) => {
              const radioId = `${fieldId}-${opt.value}`;
              return (
                <label key={opt.value} htmlFor={radioId} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    id={radioId}
                    type="radio"
                    name={field.id}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={() => onChange(field.id, opt.value)}
                    className="accent-primary"
                    required={field.required}
                    aria-required={field.required}
                  />
                  {getTranslatedOption(field.id, opt.value, opt.label, t)}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {hintId && (
        <p id={hintId} className="text-xs text-muted">
          {label}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs text-error flex items-center gap-1">
          <TriangleAlert size={12} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// Re-export types for convenience
export type { FormData };
