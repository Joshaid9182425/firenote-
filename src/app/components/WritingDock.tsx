import { Pen, Pencil, Highlighter, Plus, X } from "lucide-react";
import { Tool, PenType } from "../types";
import { LiquidGlass } from "./LiquidGlass";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Slider from "@radix-ui/react-slider";

interface WritingDockProps {
  currentTool: Tool;
  penType: PenType;
  penColor: string;
  penSize: number;
  onToolChange: (tool: Tool) => void;
  onPenTypeChange: (type: PenType) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  dark?: boolean;
  closeSignal?: number;
}

const STANDARD_COLORS = [
  "#000000", "#FFFFFF", "#EF4444", "#F97316",
  "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#64748B",
];

const HIGHLIGHTER_COLORS = [
  { type: "highlighter-yellow" as PenType, color: "#FEF08A", label: "Yellow" },
  { type: "highlighter-green" as PenType, color: "#86EFAC", label: "Green" },
  { type: "highlighter-blue" as PenType, color: "#93C5FD", label: "Blue" },
  { type: "highlighter-pink" as PenType, color: "#F9A8D4", label: "Pink" },
  { type: "highlighter-orange" as PenType, color: "#FED7AA", label: "Orange" },
  { type: "highlighter-purple" as PenType, color: "#D8B4FE", label: "Purple" },
  { type: "highlighter-red" as PenType, color: "#FCA5A5", label: "Red" },
];

const PRESET_KEY = "flaimboard-color-presets";

function loadPresets(): string[] {
  try { return JSON.parse(localStorage.getItem(PRESET_KEY) ?? "[]"); }
  catch { return []; }
}
function savePresets(presets: string[]) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}

export function WritingDock({
  currentTool, penType, penColor, penSize,
  onToolChange, onPenTypeChange, onColorChange, onSizeChange,
  dark = false,
  closeSignal = 0,
}: WritingDockProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [presets, setPresets] = useState<string[]>(loadPresets);

  // Auto-close panel when user switches to another tool
  useEffect(() => {
    if (currentTool !== "pen") setShowOptions(false);
  }, [currentTool]);

  // Close panel when drawing starts on canvas
  useEffect(() => {
    if (closeSignal > 0) setShowOptions(false);
  }, [closeSignal]);

  const isHighlighter = penType.startsWith("highlighter");

  const handlePenClick = () => {
    if (currentTool === "pen") setShowOptions(!showOptions);
    else { onToolChange("pen"); setShowOptions(true); }
  };

  const addPreset = () => {
    if (presets.includes(penColor)) return;
    const updated = presets.length >= 8
      ? [...presets.slice(1), penColor]
      : [...presets, penColor];
    setPresets(updated);
    savePresets(updated);
  };

  const removePreset = (color: string) => {
    const updated = presets.filter((c) => c !== color);
    setPresets(updated);
    savePresets(updated);
  };

  const lc = dark ? "#6b7280" : "#9ca3af";
  const text1 = dark ? "#f1f1f3" : "#111118";
  const cardBg = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const borderC = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const divider = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const inactiveBtn = dark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-white/20";

  return (
    <>
      {/* Left dock trigger */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40">
        <LiquidGlass className="flex flex-col items-center gap-4 p-4 w-[72px]" dark={dark}>
          <button
            onClick={handlePenClick}
            className={`p-3 rounded-xl transition-all ${currentTool === "pen" ? "text-white shadow-lg" : inactiveBtn}`}
            style={currentTool === "pen" ? { background: "linear-gradient(135deg,#ef4444,#f97316)" } : {}}
            title="Pen"
          >
            <Pen className="size-6" />
          </button>
        </LiquidGlass>
      </div>

      {/* Expandable panel */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="absolute left-24 top-1/2 -translate-y-1/2 z-40"
          >
            <LiquidGlass className="w-[280px] p-5" dark={dark}>
              <div className="space-y-4">

                {/* 1. PEN TYPE */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: lc, letterSpacing: 1, marginBottom: 8 }}>PEN TYPE</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {([
                      { type: "pen" as PenType, label: "Pen", icon: <Pen className="size-4" /> },
                      { type: "pencil" as PenType, label: "Pencil", icon: <Pencil className="size-4" /> },
                      { type: "marker" as PenType, label: "Marker", icon: <Pen className="size-5 stroke-[3]" /> },
                    ]).map(({ type, label, icon }) => {
                      const active = penType === type && !isHighlighter;
                      return (
                        <button
                          key={type}
                          onClick={() => onPenTypeChange(type)}
                          className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                          style={{
                            background: active ? "linear-gradient(135deg,#ef4444,#f97316)" : cardBg,
                            border: `1px solid ${active ? "transparent" : borderC}`,
                            color: active ? "white" : text1,
                          }}
                        >
                          {icon}
                          <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. COLOUR (pen/pencil/marker only) */}
                {!isHighlighter && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: lc, letterSpacing: 1 }}>COLOUR</p>
                      <label style={{ cursor: "pointer", position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: lc }}>Custom</span>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          backgroundColor: penColor,
                          border: `2px solid ${borderC}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }} />
                        <input
                          type="color"
                          value={penColor}
                          onChange={(e) => onColorChange(e.target.value)}
                          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                        />
                      </label>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }}>
                      {STANDARD_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => onColorChange(c)}
                          style={{
                            width: "100%", aspectRatio: "1", borderRadius: 9,
                            backgroundColor: c,
                            border: penColor === c
                              ? "2.5px solid #ef4444"
                              : c === "#FFFFFF" ? `1.5px solid ${borderC}` : "2px solid transparent",
                            transform: penColor === c ? "scale(1.18)" : "scale(1)",
                            boxShadow: penColor === c ? "0 2px 8px rgba(239,68,68,0.35)" : "none",
                            transition: "all 0.15s",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: divider }} />

                {/* 3. HIGHLIGHTER */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: lc, letterSpacing: 1, marginBottom: 8 }}>HIGHLIGHTER</p>
                  <button
                    onClick={() => onPenTypeChange("highlighter-yellow")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all"
                    style={{
                      background: isHighlighter ? "linear-gradient(135deg,#ef4444,#f97316)" : cardBg,
                      border: `1px solid ${isHighlighter ? "transparent" : borderC}`,
                      color: isHighlighter ? "white" : text1,
                    }}
                  >
                    <Highlighter className="size-4" />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>
                      {isHighlighter ? "Highlighter On" : "Use Highlighter"}
                    </span>
                  </button>

                  {isHighlighter && (
                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                      {HIGHLIGHTER_COLORS.map(({ type, color, label }) => (
                        <button
                          key={type}
                          onClick={() => onPenTypeChange(type)}
                          title={label}
                          style={{
                            width: "100%", aspectRatio: "1", borderRadius: 8,
                            backgroundColor: color,
                            border: penType === type ? "2.5px solid #ef4444" : "1.5px solid rgba(0,0,0,0.12)",
                            transform: penType === type ? "scale(1.18)" : "scale(1)",
                            boxShadow: penType === type ? "0 2px 8px rgba(239,68,68,0.35)" : "none",
                            transition: "all 0.15s",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: divider }} />

                {/* 4. SIZE (universal slider) */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: lc, letterSpacing: 1 }}>SIZE</p>
                    <span style={{ fontSize: 11, color: lc }}>{penSize}px</span>
                  </div>
                  <Slider.Root
                    className="relative flex items-center select-none touch-none w-full h-5"
                    value={[penSize]}
                    onValueChange={(v) => onSizeChange(v[0])}
                    min={1} max={20} step={1}
                  >
                    <Slider.Track className={`relative grow rounded-full h-1.5 ${dark ? "bg-gray-700" : "bg-gray-200"}`}>
                      <Slider.Range className="absolute rounded-full h-full" style={{ background: "linear-gradient(90deg,#ef4444,#f97316)" }} />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-5 h-5 bg-white rounded-full focus:outline-none shadow-md"
                      style={{ border: "2px solid #ef4444" }}
                    />
                  </Slider.Root>
                </div>

                <div style={{ height: 1, background: divider }} />

                {/* 5. MY PRESETS */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: lc, letterSpacing: 1 }}>MY PRESETS</p>
                    <button
                      onClick={addPreset}
                      style={{
                        display: "flex", alignItems: "center", gap: 3,
                        fontSize: 10, fontWeight: 600, color: "#ef4444",
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                      }}
                    >
                      <Plus style={{ width: 11, height: 11 }} />
                      Save current
                    </button>
                  </div>

                  {presets.length === 0 ? (
                    <p style={{ fontSize: 11, color: lc, fontStyle: "italic" }}>
                      Pick a colour then tap "Save current"
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {presets.map((c) => (
                        <div key={c} style={{ position: "relative" }}>
                          <button
                            onClick={() => onColorChange(c)}
                            style={{
                              width: 30, height: 30, borderRadius: 8,
                              backgroundColor: c,
                              border: penColor === c ? "2.5px solid #ef4444" : `1.5px solid ${borderC}`,
                              transform: penColor === c ? "scale(1.15)" : "scale(1)",
                              boxShadow: penColor === c ? "0 2px 8px rgba(239,68,68,0.35)" : "none",
                              transition: "all 0.15s",
                              cursor: "pointer",
                            }}
                          />
                          <button
                            onClick={() => removePreset(c)}
                            style={{
                              position: "absolute", top: -4, right: -4,
                              width: 14, height: 14, borderRadius: "50%",
                              background: "#EF4444", border: "none",
                              cursor: "pointer", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              padding: 0,
                            }}
                          >
                            <X style={{ width: 8, height: 8, color: "white" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </LiquidGlass>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
