import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { boardStore } from "../store/boardStore";
import { Board, Tool, CanvasState, PenType } from "../types";
import { HomeBar } from "../components/HomeBar";
import { WritingDock } from "../components/WritingDock";
import { AnnotationDock } from "../components/AnnotationDock";
import { ZoomPill } from "../components/ZoomPill";
import { GridSelector } from "../components/GridSelector";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { StickyNotesLayer } from "../components/StickyNotesLayer";
import { ShapesLayer } from "../components/ShapesLayer";
import { AIPanel } from "../components/AIPanel";
import { InspirationPanel } from "../components/InspirationPanel";
import { Lightbulb, Undo2, Redo2, Keyboard } from "lucide-react";
import { TableLayer } from "../components/TableLayer";
import { LiquidGlass } from "../components/LiquidGlass";
import { toast } from "sonner";

const SHORTCUTS = [
  { key: "P", action: "Pen tool" },
  { key: "E", action: "Eraser" },
  { key: "S", action: "Shape tool" },
  { key: "L", action: "Lasso" },
  { key: "N", action: "Sticky note" },
  { key: "Space", action: "Pan canvas" },
  { key: "⌘ Z", action: "Undo" },
  { key: "⌘ ⇧ Z", action: "Redo" },
  { key: "Delete", action: "Delete selected" },
  { key: "?", action: "Show shortcuts" },
  { key: "Esc", action: "Close panels" },
];

export function Canvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>("pen");
  const [penType, setPenType] = useState<PenType>("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [canvasState, setCanvasState] = useState<CanvasState>({ zoom: 1, panX: 0, panY: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [showInspirationPanel, setShowInspirationPanel] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState<{ r: number; c: number } | null>(null);

  // Undo / Redo
  const historyRef = useRef<Board[]>([]);
  const redoRef = useRef<Board[]>([]);
  const lastHistoryPushRef = useRef<number>(0);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [writingDockCloseSignal, setWritingDockCloseSignal] = useState(0);

  const [dark, setDark] = useState(() => localStorage.getItem("flaimboard-theme") === "dark");

  useEffect(() => {
    const onStorage = () => setDark(localStorage.getItem("flaimboard-theme") === "dark");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (id) {
      const loadedBoard = boardStore.getBoard(id);
      if (loadedBoard) {
        setBoard(loadedBoard);
        historyRef.current = [loadedBoard];
      } else {
        toast.error("Board not found");
        navigate("/");
      }
    }
  }, [id, navigate]);

  const handleBoardUpdate = useCallback((updates: Partial<Board>) => {
    if (!board || !id) return;
    // Only push to history if 600ms passed since last push (prevents recording every drag frame)
    const now = Date.now();
    if (now - lastHistoryPushRef.current > 600) {
      historyRef.current = [...historyRef.current.slice(-49), board]; // cap at 50 entries
      redoRef.current = [];
      lastHistoryPushRef.current = now;
    }
    const updatedBoard = { ...board, ...updates };
    setBoard(updatedBoard);
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      // Capture thumbnail — composite background + strokes onto a temp canvas
      const canvasEl = document.querySelector("canvas") as HTMLCanvasElement | null;
      let thumbnail: string | undefined;
      if (canvasEl) {
        try {
          const tmp = document.createElement("canvas");
          tmp.width = canvasEl.width;
          tmp.height = canvasEl.height;
          const ctx = tmp.getContext("2d");
          if (ctx) {
            // Fill background based on dark mode
            ctx.fillStyle = localStorage.getItem("flaimboard-theme") === "dark" ? "#0f0f17" : "#FAFAFA";
            ctx.fillRect(0, 0, tmp.width, tmp.height);
            ctx.drawImage(canvasEl, 0, 0);
            thumbnail = tmp.toDataURL("image/jpeg", 0.4);
          }
        } catch { }
      }
      boardStore.updateBoard(id, { ...updates, ...(thumbnail ? { thumbnail } : {}) });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 500);
  }, [board, id]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length <= 1) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    if (board) redoRef.current = [...redoRef.current, board];
    setBoard(prev);
    if (id) boardStore.updateBoard(id, prev);
    toast("↩ Undone");
  }, [board, id]);

  const handleRedo = useCallback(() => {
    if (redoRef.current.length === 0) return;
    const next = redoRef.current[redoRef.current.length - 1];
    redoRef.current = redoRef.current.slice(0, -1);
    if (board) historyRef.current = [...historyRef.current, board];
    setBoard(next);
    if (id) boardStore.updateBoard(id, next);
    toast("↪ Redone");
  }, [board, id]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "?") { setShowShortcuts((v) => !v); return; }
      if (e.key === "Escape") { setShowShortcuts(false); setShowAIPanel(false); setShowInspirationPanel(false); return; }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); handleRedo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); handleUndo(); return; }

      if (!e.metaKey && !e.ctrlKey) {
        if (e.key === "p") setCurrentTool("pen");
        if (e.key === "e") setCurrentTool("eraser");
        if (e.key === "s") setCurrentTool("shape");
        if (e.key === "l") setCurrentTool("lasso");
        if (e.key === "n") setCurrentTool("sticky");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo, handleRedo]);

  const handleInsertImage = () => imageInputRef.current?.click();

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 600;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = img.width * scale;
        const h = img.height * scale;
        const cx = (window.innerWidth / 2 - canvasState.panX) / canvasState.zoom - w / 2;
        const cy = (window.innerHeight / 2 - canvasState.panY) / canvasState.zoom - h / 2;
        handleBoardUpdate({
          shapes: [...(board?.shapes ?? []), {
            id: Date.now().toString(), type: "image",
            x: cx, y: cy, width: w, height: h,
            color: "transparent", strokeColor: "transparent",
            zIndex: (board?.shapes ?? []).length, imageUrl: src,
          }],
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleInsertTable = (rows: number, cols: number) => {
    if (!board) return;
    setShowTablePicker(false);
    const cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ content: "", width: 100, height: 40 }))
    );
    const cx = (window.innerWidth / 2 - canvasState.panX) / canvasState.zoom - (cols * 100) / 2;
    const cy = (window.innerHeight / 2 - canvasState.panY) / canvasState.zoom - (rows * 40) / 2;
    handleBoardUpdate({
      tables: [...(board.tables ?? []), {
        id: Date.now().toString(),
        x: cx, y: cy,
        rows, cols, cells,
        zIndex: (board.tables ?? []).length,
      }],
    });
  };

  const handleZoomIn = () => setCanvasState((p) => ({ ...p, zoom: Math.min(p.zoom * 1.2, 5) }));
  const handleZoomOut = () => setCanvasState((p) => ({ ...p, zoom: Math.max(p.zoom / 1.2, 0.1) }));

  const handleExport = async () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) { toast.error("Canvas not found"); return; }
    try {
      canvas.toBlob((blob) => {
        if (!blob) { toast.error("Failed to export"); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `FlameBoard_${board?.name}_${Date.now()}.png`;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        toast.success("✅ Board exported!");
      }, "image/png");
    } catch (e) { toast.error("Failed to export"); }
  };

  if (!board) {
    return (
      <div className={`flex items-center justify-center h-screen ${dark ? "bg-gray-950" : "bg-gray-50"}`}>
        <div className={dark ? "text-gray-400" : "text-gray-500"}>Loading...</div>
      </div>
    );
  }

  const dotColor = dark ? "#2d2d3a" : "#d1d5db";
  const lineColor = dark ? "#1e1e2e" : "#e5e7eb";
  const canUndo = historyRef.current.length > 1;
  const canRedo = redoRef.current.length > 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: dark ? "#0f0f17" : "#FAFAFA", overscrollBehavior: "none" }}>

      {/* Top Bar */}
      <HomeBar
        boardName={board.name}
        onBack={() => navigate("/")}
        onExport={handleExport}
        onAIImprove={() => setShowAIPanel(true)}
        onNameChange={(name) => handleBoardUpdate({ name })}
        dark={dark}
        onInsertTable={() => setShowTablePicker(true)}
      />

      {/* Save indicator + Undo/Redo + Shortcuts — top right inside top bar */}
      <div className="absolute top-0 right-4 h-16 flex items-center gap-2 z-50">
        {/* Save status */}
        {saveStatus !== "idle" && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg transition-all ${saveStatus === "saving"
            ? (dark ? "text-gray-400" : "text-gray-500")
            : "text-green-500"
            }`}>
            {saveStatus === "saving" ? "Saving..." : "Saved ✓"}
          </span>
        )}

        {/* Undo */}
        <button onClick={handleUndo} disabled={!canUndo}
          title="Undo (⌘Z)"
          className={`p-2 rounded-lg transition-all ${!canUndo ? "opacity-30 cursor-not-allowed" : dark ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`}>
          <Undo2 className="size-4" />
        </button>

        {/* Redo */}
        <button onClick={handleRedo} disabled={!canRedo}
          title="Redo (⌘⇧Z)"
          className={`p-2 rounded-lg transition-all ${!canRedo ? "opacity-30 cursor-not-allowed" : dark ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`}>
          <Redo2 className="size-4" />
        </button>

        {/* Shortcuts */}
        <button onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)"
          className={`p-2 rounded-lg transition-all ${dark ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`}>
          <Keyboard className="size-4" />
        </button>
      </div>

      {/* Writing Dock */}
      <WritingDock currentTool={currentTool} onToolChange={setCurrentTool}
        penType={penType} onPenTypeChange={setPenType}
        penColor={penColor} onColorChange={setPenColor}
        penSize={penSize} onSizeChange={setPenSize}
        dark={dark} closeSignal={writingDockCloseSignal} />

      {/* Annotation Dock */}
      <AnnotationDock currentTool={currentTool} onToolChange={setCurrentTool}
        dark={dark} onInsertImage={handleInsertImage} />

      {/* Zoom Pill */}
      <ZoomPill zoom={canvasState.zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} dark={dark} />

      {/* Grid Selector */}
      <GridSelector backgroundType={board.background}
        onBackgroundChange={(background) => handleBoardUpdate({ background })} dark={dark} />

      {/* Canvas Container */}
      <div className="absolute inset-0 pt-16"
        onMouseDown={() => { if (currentTool === "pen") setWritingDockCloseSignal((n) => n + 1); }}>

        {/* Background pattern */}
        {showGrid && board.background !== "blank" && (
          <div className="absolute inset-0 pointer-events-none">
            {board.background === "dots" && (
              <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px)`, backgroundSize: "24px 24px" }} />
            )}
            {board.background === "lines" && (
              <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
            )}
            {board.background === "graph" && (
              <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`, backgroundSize: "12px 12px" }} />
            )}
          </div>
        )}

        <StickyNotesLayer stickyNotes={board.stickyNotes}
          onUpdate={(stickyNotes) => handleBoardUpdate({ stickyNotes })}
          canvasState={canvasState} onCanvasStateChange={setCanvasState}
          isActive={currentTool === "sticky"} currentTool={currentTool} />

        <ShapesLayer shapes={board.shapes}
          onUpdate={(shapes) => handleBoardUpdate({ shapes })}
          canvasState={canvasState} isActive={currentTool === "shape"} currentTool={currentTool} />

        <TableLayer
          tables={board.tables ?? []}
          onUpdate={(tables) => handleBoardUpdate({ tables })}
          canvasState={canvasState}
          currentTool={currentTool}
        />

        <DrawingCanvas board={board} onBoardUpdate={handleBoardUpdate}
          currentTool={currentTool} penType={penType} penColor={penColor} penSize={penSize}
          canvasState={canvasState} onCanvasStateChange={setCanvasState}
          selectedElementIds={selectedElementIds} onSelectedElementsChange={setSelectedElementIds}
          dark={dark} />
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <AIPanel board={board} onClose={() => setShowAIPanel(false)}
          onApply={(improvements) => { handleBoardUpdate(improvements); setShowAIPanel(false); toast.success("✨ AI improvements applied!"); }}
          dark={dark} />
      )}

      {/* Inspiration Panel */}
      <InspirationPanel isOpen={showInspirationPanel} onClose={() => setShowInspirationPanel(false)} dark={dark} />

      {/* Inspiration toggle */}
      {!showInspirationPanel && (
        <div className="absolute bottom-6 left-24 z-40">
          <LiquidGlass className="p-3" blurRadius={45} dark={dark}>
            <button onClick={() => setShowInspirationPanel(true)}
              className={`p-2.5 rounded-lg transition-colors ${dark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-white/20"}`}
              title="Inspiration">
              <Lightbulb className="size-5" />
            </button>
          </LiquidGlass>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />

      {/* ── Table Picker ────────────────────────────────────────────── */}
      {showTablePicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={() => setShowTablePicker(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
            className={`relative z-10 rounded-2xl shadow-2xl p-6 ${dark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-100"}`}>
            <h3 className={`text-sm font-semibold mb-3 ${dark ? "text-white" : "text-gray-900"}`}>Select table size</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 28px)", gap: 3 }}>
              {Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, c) => (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() => setTableHover({ r, c })}
                  onMouseLeave={() => setTableHover(null)}
                  onClick={() => handleInsertTable(r + 1, c + 1)}
                  style={{
                    width: 28, height: 28, borderRadius: 4, cursor: "pointer",
                    background: tableHover && r <= tableHover.r && c <= tableHover.c
                      ? "linear-gradient(135deg,#ef4444,#f97316)"
                      : dark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
                    border: "1px solid",
                    borderColor: tableHover && r <= tableHover.r && c <= tableHover.c
                      ? "transparent"
                      : dark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                    transition: "all 0.1s",
                  }}
                />
              )))}
            </div>
            {tableHover && (
              <p className={`text-xs mt-3 text-center ${dark ? "text-gray-400" : "text-gray-500"}`}>
                {tableHover.r + 1} × {tableHover.c + 1} table
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Keyboard Shortcuts Modal ──────────────────────────────────────── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-96 rounded-2xl shadow-2xl p-6 z-10 ${dark ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-100"}`}>
            <h2 className={`text-lg font-bold mb-4 ${dark ? "text-white" : "text-gray-900"}`}>
              ⌨️ Flame Board — Keyboard Shortcuts
            </h2>
            <div className="space-y-1">
              {SHORTCUTS.map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <span className={`text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>{action}</span>
                  <kbd className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${dark ? "bg-gray-800 text-gray-300 border border-gray-700" : "bg-gray-100 text-gray-700 border border-gray-200"}`}>
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className={`text-xs mt-4 ${dark ? "text-gray-600" : "text-gray-400"}`}>Press <kbd className="px-1 rounded bg-gray-100 text-gray-600 font-mono">Esc</kbd> or click outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
