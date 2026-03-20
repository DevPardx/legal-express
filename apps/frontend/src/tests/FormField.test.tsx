import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

// lucide-react CJS bundle is incompatible with jsdom — stub all icons
vi.mock("lucide-react", () => ({
  TriangleAlert: () => null,
}));

import { FormField } from "../components/form/FormField";
import { I18nProvider } from "../i18n";
import type { FormFieldSchema } from "@legal-express/shared";
import type { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

function renderField(
  field: FormFieldSchema,
  value: unknown = "",
  error?: string,
  onChange = vi.fn()
) {
  return render(
    <Wrapper>
      <FormField field={field} value={value} error={error} onChange={onChange} />
    </Wrapper>
  );
}

const textField: FormFieldSchema = {
  id: "fullName",
  type: "text",
  label: "Full Name",
  placeholder: "Jane Doe",
  required: true,
};

const emailField: FormFieldSchema = {
  id: "email",
  type: "email",
  label: "Email Address",
  placeholder: "jane@example.com",
  required: true,
};

const selectField: FormFieldSchema = {
  id: "documentType",
  type: "select",
  label: "Document Type",
  placeholder: "Select a document type",
  required: true,
  options: [
    { value: "CONTRACT", label: "Contract" },
    { value: "NDA", label: "Non-Disclosure Agreement (NDA)" },
  ],
};

const checkboxField: FormFieldSchema = {
  id: "urgent",
  type: "checkbox",
  label: "Urgent Processing",
};

describe("FormField — text input", () => {
  it("renders the input with an associated label", () => {
    renderField(textField);
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
  });

  it("shows required asterisk for required fields", () => {
    renderField(textField);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not show asterisk for optional fields", () => {
    renderField({ ...textField, required: false });
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("calls onChange with field id and new value when typing", async () => {
    const onChange = vi.fn();
    renderField(textField, "", undefined, onChange);
    await userEvent.type(screen.getByLabelText(/Full Name/i), "J");
    expect(onChange).toHaveBeenCalledWith("fullName", "J");
  });

  it("displays current value in the input", () => {
    renderField(textField, "Jane Smith");
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue("Jane Smith");
  });
});

describe("FormField — error state", () => {
  it("shows the error message when error prop is provided", () => {
    renderField(textField, "", "This field is required.");
    expect(screen.getByRole("alert")).toHaveTextContent("This field is required.");
  });

  it("sets aria-invalid to true when there is an error", () => {
    renderField(textField, "", "Required");
    expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("sets aria-describedby to error element id when there is an error", () => {
    renderField(textField, "", "Required");
    const input = screen.getByLabelText(/Full Name/i);
    expect(input).toHaveAttribute("aria-describedby", "field-fullName-error");
  });

  it("does not show error element when no error", () => {
    renderField(textField);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("FormField — email input", () => {
  it("renders with type=email", () => {
    renderField(emailField);
    expect(screen.getByLabelText(/Email Address/i)).toHaveAttribute("type", "email");
  });
});

describe("FormField — select", () => {
  it("renders a combobox with options", () => {
    renderField(selectField);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Contract")).toBeInTheDocument();
    expect(screen.getByText("Non-Disclosure Agreement (NDA)")).toBeInTheDocument();
  });

  it("calls onChange when an option is selected", async () => {
    const onChange = vi.fn();
    renderField(selectField, "", undefined, onChange);
    await userEvent.selectOptions(screen.getByRole("combobox"), "CONTRACT");
    expect(onChange).toHaveBeenCalledWith("documentType", "CONTRACT");
  });
});

describe("FormField — checkbox", () => {
  it("renders a checkbox input", () => {
    renderField(checkboxField, false);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders with label text", () => {
    renderField(checkboxField, false);
    expect(screen.getByText("Urgent Processing")).toBeInTheDocument();
  });

  it("is unchecked when value is false", () => {
    renderField(checkboxField, false);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("is checked when value is true", () => {
    renderField(checkboxField, true);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onChange with new boolean on click", async () => {
    const onChange = vi.fn();
    renderField(checkboxField, false, undefined, onChange);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith("urgent", true);
  });
});
