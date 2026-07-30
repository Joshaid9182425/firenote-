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
            className={`relative w-full max-w-md rounded-2xl shadow-2xl border p-6 z-10 ${cardBg}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}>
                  <Database className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Supabase Cloud Sync</h2>
                  <p className={`text-xs ${subtext}`}>
                    {isSupabaseConfigured ? "Sync whiteboards to your cloud account" : "Connect your Supabase project"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}>
                <X className={`size-4 ${subtext}`} />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className={`grid grid-cols-3 p-1 rounded-xl mb-6 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === "signup"
                    ? dark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow"
                    : subtext
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setMode("config")}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  mode === "config"
                    ? dark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow"
                    : subtext
                }`}
              >
                Setup Keys
              </button>
            </div>

            {/* Config View */}
            {mode === "config" || !isSupabaseConfigured ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${isSupabaseConfigured ? (dark ? "bg-emerald-950/40 border-emerald-900" : "bg-emerald-50 border-emerald-200") : (dark ? "bg-amber-950/40 border-amber-900" : "bg-amber-50 border-amber-200")}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isSupabaseConfigured ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-500" />
                    )}
                    <span className={`text-xs font-bold ${isSupabaseConfigured ? "text-emerald-500" : "text-amber-500"}`}>
                      {isSupabaseConfigured ? "Supabase Connected" : "Missing Supabase Credentials"}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${subtext}`}>
                    Add your <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> into the <code className="px-1 rounded bg-black/10 font-mono">.env.local</code> file in your project directory.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <p className={`font-semibold flex items-center gap-1.5 ${subtext}`}>
                    <Key className="size-3.5" /> Where to get your keys:
                  </p>
                  <ol className={`list-decimal list-inside space-y-1 pl-1 ${subtext}`}>
                    <li>Go to <strong className="text-blue-500">supabase.com/dashboard</strong></li>
                    <li>Select your project → <strong>Project Settings</strong></li>
                    <li>Click <strong>API</strong> tab</li>
                    <li>Copy your <strong>Project URL</strong> and <strong>anon public key</strong> into <code className="px-1 rounded bg-black/10 font-mono">.env.local</code></li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}
                >
                  Got it
                </button>
              </div>
            ) : (
              /* Auth Form */
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${subtext}`}>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${subtext}`}>PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${inputBg}`}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }}
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
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
