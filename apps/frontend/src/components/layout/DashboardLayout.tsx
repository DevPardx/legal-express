import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Globe } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t, toggleLang, lang } = useI18n();
  const { user } = useAuth();
  const initials = user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "AD";

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-end gap-3 h-16 px-8 bg-white border-b border-[#E5E7EB] shrink-0">
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>

          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E7EB] text-[#6B7280] text-sm font-medium hover:bg-gray-50 transition-colors"
            aria-label={
              lang === "en" ? "Switch to French" : "Passer en anglais"
            }
          >
            <Globe size={14} aria-hidden="true" />
            {t("header.language")}
          </button>

          <div
            className="w-8 h-8 rounded-full bg-navy flex items-center justify-center"
            role="img"
            aria-label="User profile"
          >
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
        </div>

        <main
          id="main-content"
          className="flex-1 overflow-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
