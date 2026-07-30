import { useState, useRef, useCallback } from "react";
import { StickyNote, CanvasState } from "../types";
import { motion } from "motion/react";
import { X, Bold, Type } from "lucide-react";

interface StickyNotesLayerProps {
  stickyNotes: StickyNote[];
  onUpdate: (notes: StickyNote[]) => void;
  canvasState: CanvasState;
  onCanvasStateChange?: (state: CanvasState) => void;
  isActive: boolean;
  currentTool?: string;
}

const STICKY_COLORS = [
  "#FEF3C7",
  "#DBEAFE",
  "#FCE7F3",
  "#D1FAE5",
  "#E0E7FF",
  "#FED7AA",
];

export function StickyNotesLayer({
  stickyNotes,
  onUpdate,
  canvasState,
  isActive,
  currentTool = "select",
}: StickyNotesLayerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Hold timer for drag
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHoldDragging, setIsHoldDragging] = useState(false);

  // Drag to move
  const dragState = useRef<{
    noteId: string;
    startMouseX: number;
    startMouseY: number;
    startNoteX: number;
    startNoteY: number;
    moved: boolean;
  } | null>(null);

  // Drag to resize
  const resizeState = useRef<{
    noteId: string;
    startMouseX: number;
    startMouseY: number;
    startW: number;
    startH: number;
    startX: number;
    startY: number;
    corner: "se" | "sw" | "ne" | "nw";
  } | null>(null);

  // ─── Place new note ───────────────────────────────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isActive || e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;
    const maxZ = stickyNotes.length > 0 ? Math.max(...stickyNotes.map((n) => n.zIndex)) : 0;
    const newNote: StickyNote = {
      id: Date.now().toString(),
      x, y,
      width: 200,
      height: 160,
      color: STICKY_COLORS[stickyNotes.length % STICKY_COLORS.length],
      text: "",
      zIndex: maxZ + 1,
    };
    onUpdate([...stickyNotes, newNote]);
    setSelectedId(newNote.id);
    setEditingId(newNote.id);
  };

  const bringToFront = useCallback((id: string, notes: StickyNote[]): StickyNote[] => {
    const maxZ = Math.max(...notes.map((n) => n.zIndex), 0);
    return notes.map((n) => (n.id === id ? { ...n, zIndex: maxZ + 1 } : n));
  }, []);

  // ─── Drag to move ─────────────────────────────────────────────────────────────
  const handleDragBarMouseDown = (e: React.MouseEvent, note: StickyNote) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.stopPropagation();
    setSelectedId(note.id);
    const startX = e.clientX;
    const startY = e.clientY;

    setIsHoldDragging(true);
    onUpdate(bringToFront(note.id, stickyNotes));
    dragState.current = {
      noteId: note.id,
      startMouseX: startX,
      startMouseY: startY,
      startNoteX: note.x,
      startNoteY: note.y,
      moved: false,
    };
  };

  // ─── Resize handle mousedown ──────────────────────────────────────────────────
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    note: StickyNote,
    corner: "se" | "sw" | "ne" | "nw"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(note.id);
    resizeState.current = {
      noteId: note.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: note.width,
      startH: note.height,
      startX: note.x,
      startY: note.y,
      corner,
    };
  };

  // ─── Mouse move: handles both drag and resize ─────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent) => {
    // Resize
    if (resizeState.current) {
      const rs = resizeState.current;
      const dxScreen = e.clientX - rs.startMouseX;
      const dyScreen = e.clientY - rs.startMouseY;
      const dx = dxScreen / canvasState.zoom;
      const dy = dyScreen / canvasState.zoom;
      const MIN = 120;

      let newW = rs.startW;
      let newH = rs.startH;
      let newX = rs.startX;
      let newY = rs.startY;

      if (rs.corner === "se") {
        newW = Math.max(MIN, rs.startW + dx);
        newH = Math.max(MIN, rs.startH + dy);
      } else if (rs.corner === "sw") {
        newW = Math.max(MIN, rs.startW - dx);
        newH = Math.max(MIN, rs.startH + dy);
        newX = rs.startX + (rs.startW - newW);
      } else if (rs.corner === "ne") {
        newW = Math.max(MIN, rs.startW + dx);
        newH = Math.max(MIN, rs.startH - dy);
        newY = rs.startY + (rs.startH - newH);
      } else if (rs.corner === "nw") {
        newW = Math.max(MIN, rs.startW - dx);
        newH = Math.max(MIN, rs.startH - dy);
        newX = rs.startX + (rs.startW - newW);
        newY = rs.startY + (rs.startH - newH);
      }

      onUpdate(stickyNotes.map((n) =>
        n.id === rs.noteId ? { ...n, x: newX, y: newY, width: newW, height: newH } : n
      ));
      return;
    }

    // Drag
    if (dragState.current) {
      const ds = dragState.current;
      const dx = (e.clientX - ds.startMouseX) / canvasState.zoom;
      const dy = (e.clientY - ds.startMouseY) / canvasState.zoom;
      if (!ds.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      ds.moved = true;
      onUpdate(stickyNotes.map((n) =>
        n.id === ds.noteId ? { ...n, x: ds.startNoteX + dx, y: ds.startNoteY + dy } : n
      ));
    }
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    dragState.current = null;
    resizeState.current = null;
    setIsHoldDragging(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(stickyNotes.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  const handleTextChange = (id: string, text: string) => {
    onUpdate(stickyNotes.map((n) => (n.id === id ? { ...n, text } : n)));
  };

  const handleColorChange = (id: string, color: string) => {
    onUpdate(stickyNotes.map((n) => (n.id === id ? { ...n, color } : n)));
  };

  const handleHeaderChange = (id: string, headerText: string) => {
    onUpdate(stickyNotes.map((n) => (n.id === id ? { ...n, headerText } : n)));
  };
  const handleHeaderBoldToggle = (id: string) => {
    onUpdate(stickyNotes.map((n) => (n.id === id ? { ...n, headerBold: !n.headerBold } : n)));
  };
  const handleHeaderColorChange = (id: string, headerColor: string) => {
    onUpdate(stickyNotes.map((n) => (n.id === id ? { ...n, headerColor } : n)));
  };
  const handleTextColorChange = (id: string, textColor: string) => {
    onUpdate(stickyNotes.map((n) => (n.id === id ? { ...n, textColor } : n)));
  };
  const handleTextSizeChange = (id: string, textSize: number) => {
    onUpdate(stickyNotes.map((n) => (n.id === id ? { ...n, textSize } : n)));
  };

  const sortedNotes = [...stickyNotes].sort((a, b) => a.zIndex - b.zIndex);
  const isDrawingTool = ["eraser", "lasso", "arrow"].includes(currentTool);

  // Resize handle style helper
  const resizeHandle = (corner: "se" | "sw" | "ne" | "nw", noteId: string, note: StickyNote) => {
    const cursors = { se: "nwse-resize", sw: "nesw-resize", ne: "nesw-resize", nw: "nwse-resize" };
    const positions: Record<string, React.CSSProperties> = {
      se: { bottom: 0, right: 0 },
      sw: { bottom: 0, left: 0 },
      ne: { top: 0, right: 0 },
      nw: { top: 0, left: 0 },
    };
    return (
      <div
        key={corner}
        onMouseDown={(e) => handleResizeMouseDown(e, note, corner)}
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          ...positions[corner],
          cursor: cursors[corner],
          zIndex: 20,
          display: "flex",
          alignItems: corner === "se" || corner === "sw" ? "flex-end" : "flex-start",
          justifyContent: corner === "se" || corner === "ne" ? "flex-end" : "flex-start",
          padding: 2,
        }}
      >
        {/* Visible corner grip dots */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: selectedId === noteId ? "rgba(59,130,246,0.7)" : "rgba(0,0,0,0.18)",
          transition: "background-color 0.15s",
        }} />
      </div>
    );
  };

  return (
    <div
      className="absolute inset-0"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        cursor: "default",
        pointerEvents: "none",
      }}
    >
      {/* Placement overlay — only active when sticky tool selected, passes alt+clicks through for panning */}
      {isActive && (
        <div
          className="absolute inset-0"
          style={{ pointerEvents: "auto", cursor: "copy" }}
          onMouseDown={(e) => {
            // If Alt is held or Middle click, let it bubble for panning
            if (e.altKey || e.button === 1) return;
            e.stopPropagation();
            handleCanvasClick(e);
          }}
        />
      )}
      {sortedNotes.map((note) => {
        const screenX = canvasState.panX + note.x * canvasState.zoom;
        const screenY = canvasState.panY + note.y * canvasState.zoom;
        const screenW = note.width * canvasState.zoom;
        const screenH = note.height * canvasState.zoom;
        const fontSize = Math.max(11, Math.min(16, 14 * canvasState.zoom));
        const isSelected = selectedId === note.id;
        const isEditing = editingId === note.id;
        const isHovered = hoveredId === note.id;
        const noteIndex = sortedNotes.indexOf(note) + 1;

        // Header controls: shrink when typing, full size when hovered
        const showControls = isHovered || !isEditing;
        const controlsScale = isEditing && !isHovered ? 0.6 : 1;
        const controlsOpacity = isEditing && !isHovered ? 0.35 : 1;

        return (
          <motion.div
            key={note.id}
            className="absolute"
            style={{
              left: screenX,
              top: screenY,
              width: screenW,
              height: screenH,
              zIndex: note.zIndex + 10,
              pointerEvents: "auto", // Always allow interaction
            }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onMouseEnter={() => setHoveredId(note.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className="relative w-full h-full rounded-2xl overflow-visible"
              style={{
                backgroundColor: note.color,
                borderRadius: 16,
                boxShadow: isSelected
                  ? "0 0 0 2px #3B82F6, 0 8px 24px rgba(0,0,0,0.18)"
                  : "0 4px 16px rgba(0,0,0,0.14)",
                overflow: "hidden",
              }}
            >
              {/* ── Header bar ──────────────────────────────────────────────── */}
              <div
                className="absolute top-0 left-0 right-0 flex items-center justify-between px-2"
                style={{
                  height: 36,
                  backgroundColor: "rgba(0,0,0,0.07)",
                  cursor: isHoldDragging && dragState.current?.noteId === note.id ? "grabbing" : "grab",
                  userSelect: "none",
                  zIndex: 2,
                }}
                onMouseDown={(e) => handleDragBarMouseDown(e, note)}
              >
                {/* Color dots — shrink when typing */}
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                    transform: `scale(${controlsScale})`,
                    opacity: controlsOpacity,
                    transition: "transform 0.2s ease, opacity 0.2s ease",
                    transformOrigin: "left center",
                  }}
                >
                  {STICKY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={(e) => { e.stopPropagation(); handleColorChange(note.id, c); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        width: note.color === c ? 24 : 18,
                        height: note.color === c ? 24 : 18,
                        borderRadius: "50%",
                        backgroundColor: c,
                        border: note.color === c
                          ? "2px solid rgba(0,0,0,0.3)"
                          : "1.5px solid rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        padding: 0,
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    />
                  ))}
                </div>

                {/* Note number */}
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "rgba(0,0,0,0.3)",
                  letterSpacing: 1,
                  userSelect: "none",
                  opacity: isEditing && !isHovered ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}>
                  #{noteIndex}
                </span>

                {/* Close button — shrinks when typing, grows back on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(note.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.15)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    flexShrink: 0,
                    zIndex: 99,
                    position: "relative",
                    transform: `scale(${controlsScale})`,
                    opacity: controlsOpacity,
                    transition: "transform 0.2s ease, opacity 0.2s ease, background-color 0.15s",
                    transformOrigin: "right center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#EF4444";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.15)";
                    (e.currentTarget as HTMLElement).style.transform = `scale(${controlsScale})`;
                  }}
                >
                  <X style={{ width: 13, height: 13, color: "#374151", pointerEvents: "none" }} />
                </button>
              </div>

              {/* Header input */}
              <div style={{ position: "absolute", top: 36, left: 0, right: 0, zIndex: 2, display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderBottom: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.04)" }}>
                <input
                  value={note.headerText ?? ""}
                  onChange={(e) => handleHeaderChange(note.id, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={() => setEditingHeaderId(note.id)}
                  onBlur={() => setEditingHeaderId(null)}
                  placeholder="Header..."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 12,
                    fontWeight: note.headerBold ? 700 : 600,
                    color: note.headerColor ?? "rgba(0,0,0,0.7)",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    cursor: "text",
                  }}
                />
                {/* Bold toggle */}
                <button
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleHeaderBoldToggle(note.id); }}
                  style={{ padding: "2px 4px", borderRadius: 4, border: "none", cursor: "pointer", background: note.headerBold ? "rgba(0,0,0,0.15)" : "transparent", color: "rgba(0,0,0,0.5)" }}
                  title="Bold header"
                >
                  <Bold style={{ width: 10, height: 10 }} />
                </button>
                {/* Header color */}
                <input type="color" value={note.headerColor ?? "#374151"}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => handleHeaderColorChange(note.id, e.target.value)}
                  style={{ width: 16, height: 16, border: "none", borderRadius: 3, padding: 0, cursor: "pointer", background: "transparent" }}
                  title="Header color"
                />
              </div>

              {/* Text formatting bar — shown when editing body */}
              {editingId === note.id && (
                <div onMouseDown={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", borderTop: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.04)" }}>
                  <Type style={{ width: 10, height: 10, color: "rgba(0,0,0,0.4)" }} />
                  {[11, 13, 15, 18].map((sz) => (
                    <button key={sz} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleTextSizeChange(note.id, sz); }}
                      style={{ fontSize: 9, fontWeight: (note.textSize ?? 13) === sz ? 700 : 400, color: (note.textSize ?? 13) === sz ? "#ef4444" : "rgba(0,0,0,0.5)", background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}>
                      {sz}
                    </button>
                  ))}
                  <input type="color" value={note.textColor ?? "#1f2937"}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => handleTextColorChange(note.id, e.target.value)}
                    style={{ width: 16, height: 16, border: "none", borderRadius: 3, padding: 0, cursor: "pointer", marginLeft: "auto" }}
                    title="Text color"
                  />
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={note.text}
                onChange={(e) => handleTextChange(note.id, e.target.value)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(note.id);
                  setEditingId(note.id);
                }}
                onFocus={() => setEditingId(note.id)}
                onBlur={() => setEditingId(null)}
                placeholder="✏️ Type here..."
                autoFocus={isEditing && note.text === ""}
                className="absolute inset-0 w-full bg-transparent resize-none focus:outline-none placeholder-gray-400"
                style={{
                  top: 66,
                  bottom: editingId === note.id ? 24 : 0,
                  left: 0,
                  right: 0,
                  height: "auto",
                  paddingTop: 6,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingBottom: 10,
                  fontSize: `${note.textSize ?? fontSize}px`,
                  color: note.textColor ?? "#1f2937",
                  lineHeight: 1.6,
                  cursor: "text",
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                  zIndex: 1,
                }}
              />

              {/* Folded corner decoration */}
              <div
                className="absolute top-0 right-0 pointer-events-none"
                style={{
                  width: 0,
                  height: 0,
                  borderStyle: "solid",
                  borderWidth: "0 18px 18px 0",
                  borderColor: "transparent rgba(0,0,0,0.1) transparent transparent",
                  zIndex: 3,
                }}
              />
            </div>

            {/* ── Resize handles — all 4 corners, outside overflow:hidden ──── */}
            {(isSelected || isHovered) && (
              <>
                {(["se", "sw", "ne", "nw"] as const).map((corner) =>
                  resizeHandle(corner, note.id, note)
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
