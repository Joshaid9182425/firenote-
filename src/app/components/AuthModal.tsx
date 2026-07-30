import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { X, LogIn, UserPlus, Database, CheckCircle2, AlertTriangle, Key } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  dark?: boolean;
}

export function AuthModal({ isOpen, onClose, dark = false }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "config">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleAuth = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setMode("config");
      return;
    }
    setLoading(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      toast.error(err.message ?? "Google Sign-In failed");
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isSupabaseConfigured) {
      setMode("config");
      return;
    }
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        toast.success("🎉 Account created! Check your email to confirm.");
        onClose();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        toast.success("⚡ Logged in successfully!");
        onClose();
      }
    } catch (err: any) {
      setError(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const cardBg = dark ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-100 text-gray-900";
  const inputBg = dark ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900";
  const subtext = dark ? "text-gray-400" : "text-gray-500";
  const googleBtnBg = dark ? "bg-gray-800 border-gray-700 hover:bg-gray-750 text-white" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-3xl shadow-2xl border p-7 z-10 ${cardBg}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl" style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}>
                  <LogIn className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Welcome to FlameBoard</h2>
                  <p className={`text-xs ${subtext}`}>
                    Sign in to save and sync your whiteboards
                  </p>
                </div>
              </div>
              <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
                <X className={`size-4 ${subtext}`} />
              </button>
            </div>

            {/* Mode Switcher */}
            {isSupabaseConfigured ? (
              <div className={`grid grid-cols-2 p-1 rounded-2xl mb-6 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                    mode === "signin"
                      ? dark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow"
                      : subtext
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                    mode === "signup"
                      ? dark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow"
                      : subtext
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-3 p-1 rounded-2xl mb-6 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                    mode === "signin" ? (dark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow") : subtext
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                    mode === "signup" ? (dark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow") : subtext
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setMode("config")}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                    mode === "config" ? (dark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow") : subtext
                  }`}
                >
                  Setup Keys
                </button>
              </div>
            )}

            {/* Config View (Only shown if keys are missing or specifically requested) */}
            {mode === "config" && !isSupabaseConfigured ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${dark ? "bg-amber-950/40 border-amber-900" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-500">Missing Supabase Credentials</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${subtext}`}>
                    Add your <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> into <code className="px-1 rounded bg-black/10 font-mono">.env.local</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}
                >
                  Got it
                </button>
              </div>
            ) : (
              /* Customer Auth Form */
              <div className="space-y-4">
                {/* Google One-Click Auth */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] ${googleBtnBg}`}
                >
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className={`w-full border-t ${dark ? "border-gray-800" : "border-gray-200"}`} />
                  <span className={`absolute px-3 text-[10px] font-semibold tracking-wider uppercase ${dark ? "bg-gray-900 text-gray-500" : "bg-white text-gray-400"}`}>
                    OR
                  </span>
                </div>

                <form onSubmit={handleAuth} className="space-y-3.5">
                  <div>
                    <label className={`block text-[11px] font-bold tracking-wider mb-1.5 uppercase ${subtext}`}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold tracking-wider mb-1.5 uppercase ${subtext}`}>
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all ${inputBg}`}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-2xl border border-red-500/20">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}
                  >
                    {loading ? (
                      <div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : mode === "signup" ? (
                      <>
                        <UserPlus className="size-4" /> Create Account
                      </>
                    ) : (
                      <>
                        <LogIn className="size-4" /> Sign In
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
