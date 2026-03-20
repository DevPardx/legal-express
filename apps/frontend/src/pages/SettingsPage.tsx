import { Settings, Mail, Shield } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-7 p-10">
        <div className="flex items-center gap-3">
          <Settings size={24} className="text-primary" aria-hidden="true" />
          <h1 className="font-display font-semibold text-[28px] text-text tracking-tight">Settings</h1>
        </div>

        <div className="grid grid-cols-1 gap-5 max-w-2xl">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-6 flex flex-col gap-5">
            <h2 className="font-display font-semibold text-[15px] text-text">Profile</h2>
            <hr className="border-[#E5E7EB]" />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center shrink-0">
                <span className="text-white text-lg font-semibold">
                  {user?.name?.slice(0, 1) ?? "A"}
                </span>
              </div>
              <div>
                <p className="font-medium text-text">{user?.name ?? "Admin"}</p>
                <p className="text-sm text-muted capitalize">{user?.role ?? "admin"}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <Mail size={16} className="text-muted shrink-0" />
                <div>
                  <p className="text-xs text-muted">Email</p>
                  <p className="text-sm font-medium text-text">{user?.email ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <Shield size={16} className="text-muted shrink-0" />
                <div>
                  <p className="text-xs text-muted">Role</p>
                  <p className="text-sm font-medium text-text capitalize">{user?.role ?? "admin"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
