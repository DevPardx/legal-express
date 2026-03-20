import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "../components/ui/StatusBadge";
import { I18nProvider } from "../i18n";
import type { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

function renderBadge(status: Parameters<typeof StatusBadge>[0]["status"]) {
  return render(
    <Wrapper>
      <StatusBadge status={status} />
    </Wrapper>
  );
}

describe("StatusBadge", () => {
  it("renders \"Completed\" for completed status", () => {
    renderBadge("completed");
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders \"Processing\" for processing status", () => {
    renderBadge("processing");
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });

  it("renders \"Queued\" for queued status", () => {
    renderBadge("queued");
    expect(screen.getByText("Queued")).toBeInTheDocument();
  });

  it("renders \"Failed\" for failed status", () => {
    renderBadge("failed");
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("applies green color class for completed", () => {
    renderBadge("completed");
    expect(screen.getByText("Completed").className).toContain("text-[#16A34A]");
  });

  it("applies red color class for failed", () => {
    renderBadge("failed");
    expect(screen.getByText("Failed").className).toContain("text-[#DC2626]");
  });

  it("applies blue color class for processing", () => {
    renderBadge("processing");
    expect(screen.getByText("Processing").className).toContain("text-[#2563EB]");
  });

  it("applies amber color class for queued", () => {
    renderBadge("queued");
    expect(screen.getByText("Queued").className).toContain("text-[#D97706]");
  });

  it("has aria-label matching the displayed text", () => {
    renderBadge("completed");
    const badge = screen.getByText("Completed");
    expect(badge).toHaveAttribute("aria-label", "Completed");
  });
});
