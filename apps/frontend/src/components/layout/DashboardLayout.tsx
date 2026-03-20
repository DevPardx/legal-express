import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Globe, Menu } from "lucide-react";
import { useI18n } from "../../i18n";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t, toggleLang, lang } = useI18n();
  const { user } = useAuth();
  const initials = user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "AD";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 h-16 px-4 md:px-8 bg-white border-b border-[#E5E7EB] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-md text-[#6B7280] hover:bg-gray-100 transition-colors"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <a className="skip-link" href="#main-content">
              Skip to main content
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E7EB] text-[#6B7280] text-sm font-medium hover:bg-gray-50 transition-colors"
              aria-label={lang === "en" ? "Switch to French" : "Passer en anglais"}
            >
              <Globe size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{t("header.language")}</span>
            </button>

            <div
              className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0"
              role="img"
              aria-label="User profile"
            >
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
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
