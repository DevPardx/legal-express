import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useFormEngine } from "../hooks/useFormEngine";
import { I18nProvider } from "../i18n";
import type { MultiStepFormSchema } from "@legal-express/shared";
import type { ReactNode } from "react";
import { createElement } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(I18nProvider, null, children);
}

const twoStepSchema: MultiStepFormSchema = {
  id: "test-form",
  title: "Test Form",
  steps: [
    {
      id: "step-1",
      title: "Step 1",
      fields: [
        { id: "name", type: "text", label: "Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
      ],
    },
    {
      id: "step-2",
      title: "Step 2",
      fields: [
        { id: "notes", type: "textarea", label: "Notes" },
      ],
    },
  ],
};

const conditionalSchema: MultiStepFormSchema = {
  id: "cond-form",
  title: "Conditional Form",
  steps: [
    {
      id: "step-1",
      title: "Step 1",
      fields: [
        { id: "urgent", type: "checkbox", label: "Urgent" },
        {
          id: "reason",
          type: "text",
          label: "Reason",
          conditional: { field: "urgent", value: true },
        },
      ],
    },
  ],
};

describe("useFormEngine — initialization", () => {
  it("starts on step 0", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    expect(result.current.currentStep).toBe(0);
  });

  it("reports correct total steps", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    expect(result.current.totalSteps).toBe(2);
  });

  it("initializes with empty formData and no errors", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    expect(result.current.formData).toEqual({});
    expect(result.current.errors).toEqual({});
  });

  it("sets currentStepSchema to the first step", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    expect(result.current.currentStepSchema.id).toBe("step-1");
  });
});

describe("useFormEngine — setValue", () => {
  it("updates formData with the new value", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => {
      result.current.setValue("name", "Jane");
    });
    expect(result.current.formData["name"]).toBe("Jane");
  });

  it("clears existing error for the updated field", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => { result.current.nextStep(); }); // triggers validation errors
    expect(result.current.errors["name"]).toBeDefined();
    act(() => { result.current.setValue("name", "Jane"); });
    expect(result.current.errors["name"]).toBeUndefined();
  });
});

describe("useFormEngine — nextStep validation", () => {
  it("blocks navigation and sets errors when required fields are empty", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => { result.current.nextStep(); });
    expect(result.current.errors["name"]).toBeDefined();
    expect(result.current.errors["email"]).toBeDefined();
    expect(result.current.currentStep).toBe(0);
  });

  it("advances to step 1 when all required fields are filled", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => {
      result.current.setValue("name", "Jane");
      result.current.setValue("email", "jane@example.com");
    });
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(1);
    expect(result.current.errors).toEqual({});
  });

  it("returns false when validation fails", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    let advanced: boolean | undefined;
    act(() => { advanced = result.current.nextStep(); });
    expect(advanced).toBe(false);
  });

  it("returns true when validation passes", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => {
      result.current.setValue("name", "Jane");
      result.current.setValue("email", "jane@example.com");
    });
    let advanced: boolean | undefined;
    act(() => { advanced = result.current.nextStep(); });
    expect(advanced).toBe(true);
  });

  it("blocks on invalid email format", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => {
      result.current.setValue("name", "Jane");
      result.current.setValue("email", "not-an-email");
    });
    act(() => { result.current.nextStep(); });
    expect(result.current.errors["email"]).toBeDefined();
    expect(result.current.currentStep).toBe(0);
  });
});

describe("useFormEngine — prevStep", () => {
  it("goes back to previous step", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => {
      result.current.setValue("name", "Jane");
      result.current.setValue("email", "jane@example.com");
    });
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(1);
    act(() => { result.current.prevStep(); });
    expect(result.current.currentStep).toBe(0);
  });

  it("does not go below step 0", () => {
    const { result } = renderHook(() => useFormEngine(twoStepSchema, vi.fn()), { wrapper });
    act(() => { result.current.prevStep(); });
    expect(result.current.currentStep).toBe(0);
  });
});

describe("useFormEngine — conditional fields", () => {
  it("hides conditional field when condition is not met", () => {
    const { result } = renderHook(() => useFormEngine(conditionalSchema, vi.fn()), { wrapper });
    const reasonField = conditionalSchema.steps[0]!.fields[1]!;
    expect(result.current.isFieldVisible(reasonField)).toBe(false);
  });

  it("shows conditional field when condition is met", () => {
    const { result } = renderHook(() => useFormEngine(conditionalSchema, vi.fn()), { wrapper });
    act(() => { result.current.setValue("urgent", true); });
    const reasonField = conditionalSchema.steps[0]!.fields[1]!;
    expect(result.current.isFieldVisible(reasonField)).toBe(true);
  });

  it("skips validation for hidden conditional fields", () => {
    const { result } = renderHook(() => useFormEngine(conditionalSchema, vi.fn()), { wrapper });
    // 'reason' is conditional and hidden — should not trigger error
    act(() => { result.current.nextStep(); });
    expect(result.current.errors["reason"]).toBeUndefined();
  });
});

describe("useFormEngine — submit", () => {
  it("calls onSubmit with the accumulated formData", async () => {
    const onSubmit = vi.fn().mockResolvedValue("job-123");
    const singleStepSchema: MultiStepFormSchema = {
      id: "simple",
      title: "Simple",
      steps: [{ id: "step-1", title: "Step 1", fields: [] }],
    };
    const { result } = renderHook(() => useFormEngine(singleStepSchema, onSubmit), { wrapper });
    act(() => { result.current.setValue("foo", "bar"); });
    await act(async () => { await result.current.submit(); });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ foo: "bar" }));
  });

  it("returns the jobId from onSubmit", async () => {
    const onSubmit = vi.fn().mockResolvedValue("job-abc");
    const singleStepSchema: MultiStepFormSchema = {
      id: "simple",
      title: "Simple",
      steps: [{ id: "step-1", title: "Step 1", fields: [] }],
    };
    const { result } = renderHook(() => useFormEngine(singleStepSchema, onSubmit), { wrapper });
    let jobId: string | null = null;
    await act(async () => { jobId = await result.current.submit(); });
    expect(jobId).toBe("job-abc");
  });
});
