import { Scale, LayoutDashboard, FileText, Receipt, Settings, LogOut, Webhook } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n";
import { useAuth } from "../../contexts/AuthContext";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  labelKey: "nav.dashboard" | "nav.myDocuments" | "nav.invoices" | "nav.settings" | "nav.webhooks";
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/documents", icon: <LayoutDashboard size={18} />, labelKey: "nav.dashboard", end: true },
  { to: "/documents/list", icon: <FileText size={18} />, labelKey: "nav.myDocuments", end: true },
  { to: "/invoices", icon: <Receipt size={18} />, labelKey: "nav.invoices" },
  { to: "/webhooks", icon: <Webhook size={18} />, labelKey: "nav.webhooks" },
  { to: "/settings", icon: <Settings size={18} />, labelKey: "nav.settings" },
];

export function Sidebar() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav
      className="flex flex-col w-60 h-full bg-navy px-5 py-6"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-2 pb-6">
        <Scale size={24} className="text-white" aria-hidden="true" />
        <span className="font-display font-semibold text-lg text-white">
          {t("brand.name")}
        </span>
      </div>

      <ul className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item, i) => (
          <li key={`${item.to}-${i}`}>
            <NavLink
              to={item.to}
              {...(item.end ? { end: true } : {})}
              className={({ isActive }) =>
                `flex items-center gap-2.5 h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-sidebar-text hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => { logout(); navigate("/login", { replace: true }); }}
        className="flex items-center gap-2.5 h-10 px-3 rounded-md text-sm text-sidebar-text hover:bg-white/5 hover:text-white transition-colors w-full"
      >
        <LogOut size={18} aria-hidden="true" />
        {t("nav.logout")}
      </button>
    </nav>
  );
}
