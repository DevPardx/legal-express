import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Scale, Eye, EyeOff, Loader2, FileCheck, Timer, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/documents";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setError(msg.includes("401") || msg.includes("Invalid") ? "Invalid email or password" : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left hero panel — hidden on mobile */}
      <div className="hidden md:flex w-80 lg:w-150 shrink-0 bg-[#0F1D3D] flex-col justify-center px-10 lg:px-16 py-20 gap-10">
        <div className="flex items-center gap-2.5">
          <Scale size={28} className="text-white" />
          <span className="font-display font-semibold text-xl text-white">Legal Express</span>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[#CBD5E1] text-base leading-relaxed max-w-95">
            Professional legal document generation for modern law firms.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <FileCheck size={18} className="text-amber shrink-0" />
            <span className="text-[#94A3B8] text-sm">Automated document generation</span>
          </div>
          <div className="flex items-center gap-3">
            <Timer size={18} className="text-amber shrink-0" />
            <span className="text-[#94A3B8] text-sm">Real-time processing status</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-amber shrink-0" />
            <span className="text-[#94A3B8] text-sm">Secure & compliant storage</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#F5F6F8] flex items-center justify-center px-5 sm:px-10 md:px-16">
        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] p-6 sm:p-10 w-full max-w-110 flex flex-col gap-6">
          {/* Logo shown only on mobile (hero panel is hidden) */}
          <div className="flex items-center gap-2 md:hidden">
            <Scale size={22} className="text-navy" />
            <span className="font-display font-semibold text-base text-navy">Legal Express</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-display font-bold text-2xl text-[#0D1117]">Welcome back</h1>
            <p className="text-sm text-[#6B7280]">Sign in to your account to continue</p>
          </div>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-[#374151]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@legalexpress.com"
                className="w-full h-10.5 px-3 rounded-md border border-[#D1D5DB] text-sm text-[#0D1117] placeholder:text-[#9CA3AF] outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-[#374151]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10.5 px-3 pr-10 rounded-md border border-[#D1D5DB] text-sm text-[#0D1117] placeholder:text-[#9CA3AF] outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-error bg-[#FEF2F2] border border-[#FECACA] rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-navy text-white rounded-md text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="border-t border-[#E5E7EB]" />

          <p className="text-center text-xs text-[#9CA3AF]">
            Contact your administrator for access
          </p>
        </div>
      </div>
    </div>
  );
}
