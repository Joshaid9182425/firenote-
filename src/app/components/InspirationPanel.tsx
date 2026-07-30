import { useState } from "react";
import { LiquidGlass } from "./LiquidGlass";
import { X, Palette, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InspirationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dark?: boolean;
}

interface MoodBoard {
  theme: string;
  keywords: string[];
  vibe: string;
  layoutTip: string;
}

async function generateMoodBoard(theme: string): Promise<MoodBoard> {
  const rawKey = localStorage.getItem("gemini-api-key") || localStorage.getItem("openrouter-api-key");
  if (!rawKey) throw new Error("No API key. Add it in the AI Assistant panel first.");
  const apiKey = rawKey.replace(/[^ -~]/g, "").trim();
  if (!apiKey) throw new Error("Please enter a valid API key in the AI Assistant panel.");

  const res = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "FlameBoard",
      },
      body: JSON.stringify({
        model: "stepfun/step-3.5-flash:free",
        messages: [{
          role: "user",
          content: `You are a creative director. Generate a mood board inspiration for the theme: "${theme}". Return ONLY valid JSON with no markdown, no extra text:\n{"keywords":["6 specific evocative words that capture this theme"],"vibe":"one vivid sentence describing the emotional feel and aesthetic direction","layoutTip":"one specific, actionable tip for organising a whiteboard around this theme"}`
        }],
        max_tokens: 400,
      }),
    }
  );
  if (!res.ok) {
    let errMsg = "OpenRouter API error";
    try {
      const err = await res.json();
      errMsg = err?.error?.message ?? errMsg;
    } catch {
      errMsg = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errMsg);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}") + 1;
    const parsed = JSON.parse(clean.slice(start, end));
    return {
      theme,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : ["creative", "minimal", "bold", "modern", "clean"],
      vibe: parsed.vibe ?? "A modern, creative aesthetic",
      layoutTip: parsed.layoutTip ?? "Group related ideas together",
    };
  } catch {
    return {
      theme,
      keywords: ["creative", "minimal", "bold", "modern", "clean"],
      vibe: "A modern, creative aesthetic",
      layoutTip: "Group related ideas together and leave whitespace between sections",
    };
  }
}

export function InspirationPanel({ isOpen, onClose, dark = false }: InspirationPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [board, setBoard] = useState<MoodBoard | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setBoard(null);
    try {
      const result = await generateMoodBoard(input.trim());
      setBoard(result);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Check your API key in the AI Assistant panel.");
    } finally {
      setLoading(false);
    }
  };

  const text = dark ? "text-gray-100" : "text-gray-900";
  const subtext = dark ? "text-gray-400" : "text-gray-600";
  const inputBg = dark
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
    : "bg-white/60 border-gray-300 text-gray-900 placeholder-gray-400";
  const tagBg = dark ? "bg-gray-800 text-gray-300" : "bg-white/60 text-gray-700";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-80 z-50 p-4"
        >
          <LiquidGlass className="h-full flex flex-col p-5 gap-4" dark={dark}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}>
                  <Palette className="size-4 text-white" />
                </div>
                <h2 className={`text-base font-semibold ${text}`}>Mood Board</h2>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-white/20"}`}
              >
                <X className={`size-4 ${subtext}`} />
              </button>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <p className={`text-xs font-medium ${subtext}`}>DESCRIBE YOUR THEME OR VIBE</p>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleGenerate()}
                placeholder="e.g. minimalist startup pitch..."
                className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-all ${inputBg}`}
              />
              <button
                onClick={handleGenerate}
                disabled={!input.trim() || loading}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="size-3.5" />
                    Generate Mood Board
                  </>
                )}
              </button>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            {/* Result */}
            <AnimatePresence>
              {board && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 overflow-y-auto space-y-4"
                >
                  <div>
                    <p className={`text-xs font-medium mb-1.5 ${subtext}`}>VIBE</p>
                    <p className={`text-sm italic ${text}`}>"{board.vibe}"</p>
                  </div>

                  <div>
                    <p className={`text-xs font-medium mb-2 ${subtext}`}>KEYWORDS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {board.keywords.map((kw) => (
                        <span key={kw} className={`px-2.5 py-1 rounded-full text-xs font-medium ${tagBg}`}>{kw}</span>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-xl p-3 ${dark ? "bg-red-950/40 border border-red-900" : "bg-red-50 border border-red-200"}`}>
                    <p className={`text-xs font-medium mb-1 ${dark ? "text-red-400" : "text-red-700"}`}>💡 LAYOUT TIP</p>
                    <p className={`text-xs ${dark ? "text-red-300" : "text-red-800"}`}>{board.layoutTip}</p>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`w-full py-2 rounded-xl text-xs font-medium transition-all ${dark ? "bg-white/10 text-gray-300 hover:bg-white/15" : "bg-white/60 text-gray-600 hover:bg-white/80"}`}
                  >
                    ↻ Regenerate
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!board && !loading && (
              <div className={`flex-1 flex flex-col items-center justify-center text-center gap-3 mt-6 ${subtext}`}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#ef444422,#f9731622)" }}>
                  <Palette className="size-7 opacity-60" style={{ color: "#f87171" }} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${text}`}>AI Mood Board</p>
                  <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">FlameBoard Gallery</h2>
                  {!localStorage.getItem("gemini-api-key") && (
                    <p className="text-xs mt-2 text-amber-500">⚠️ Add your Gemini key in the AI Assistant panel first</p>
                  )}
                </div>
              </div>
            )}
          </LiquidGlass>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
