import { useState, useEffect, useRef } from "react";
import { Shape, CanvasState, ShapeType } from "../types";
import { motion } from "motion/react";
import { X, Square, Circle, Diamond } from "lucide-react";

interface ShapesLayerProps {
  shapes: Shape[];
  onUpdate: (shapes: Shape[]) => void;
  canvasState: CanvasState;
  isActive: boolean;
  currentTool?: string;
}

const SHAPE_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

export function ShapesLayer({
  shapes,
  onUpdate,
  canvasState,
  isActive,
  currentTool = "select",
}: ShapesLayerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentShapeType, setCurrentShapeType] = useState<ShapeType>("rectangle");
  const [selectedColor, setSelectedColor] = useState<string>(SHAPE_COLORS[0]);

  // Resize state
  const [resizing, setResizing] = useState<{
    corner: "nw" | "ne" | "sw" | "se";
    startMouseX: number;
    startMouseY: number;
    startShape: Shape;
  } | null>(null);

  // Global drag ref (so drag works even if mouse leaves container)
  const dragRef = useRef<{ shapeId: string; startMouseX: number; startMouseY: number; startShape: Shape } | null>(null);

  // Drag-to-create shape states
  const [isCreating, setIsCreating] = useState(false);
  const [createStart, setCreateStart] = useState<{ x: number; y: number } | null>(null);
  const [createEnd, setCreateEnd] = useState<{ x: number; y: number } | null>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!isActive || e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
    const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;

    // Start drag-to-create shape
    setIsCreating(true);
    setCreateStart({ x, y });
    setCreateEnd({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isCreating && createStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom;
      const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom;

      setCreateEnd({ x, y });
    } else if (isDragging && selectedId) {
      handleShapeDrag(e);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isCreating && createStart && createEnd) {
      // Create shape from drag (from Android code: createShape)
      const minX = Math.min(createStart.x, createEnd.x);
      const minY = Math.min(createStart.y, createEnd.y);
      const width = Math.abs(createEnd.x - createStart.x);
      const height = Math.abs(createEnd.y - createStart.y);

      // Only create if dragged a reasonable distance
      if (width > 10 && height > 10) {
        const newShape: Shape = {
          id: Date.now().toString(),
          type: currentShapeType,
          x: minX,
          y: minY,
          width,
          height,
          color: selectedColor,
          strokeColor: selectedColor,
          zIndex: shapes.length,
        };

        onUpdate([...shapes, newShape]);
        setSelectedId(newShape.id);
      }

      setIsCreating(false);
      setCreateStart(null);
      setCreateEnd(null);
    } else if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleShapeMouseDown = (e: React.MouseEvent, shape: Shape) => {
    e.stopPropagation();
    setSelectedId(shape.id);
    setIsDragging(true);
    dragRef.current = {
      shapeId: shape.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startShape: { ...shape },
    };
  };

  const handleShapeDrag = (e: React.MouseEvent) => {
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (!shape) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.panX) / canvasState.zoom - dragOffset.x;
    const y = (e.clientY - rect.top - canvasState.panY) / canvasState.zoom - dragOffset.y;
    onUpdate(shapes.map((s) => (s.id === selectedId ? { ...s, x, y } : s)));
  };

  // Global mouse handlers for resize + drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Resize
      if (resizing) {
        const dx = (e.clientX - resizing.startMouseX) / canvasState.zoom;
        const dy = (e.clientY - resizing.startMouseY) / canvasState.zoom;
        const sh = resizing.startShape;
        let nx = sh.x, ny = sh.y, nw = sh.width, nh = sh.height;
        if (resizing.corner === "se") { nw = Math.max(20, sh.width + dx); nh = Math.max(20, sh.height + dy); }
        if (resizing.corner === "sw") { nx = sh.x + dx; nw = Math.max(20, sh.width - dx); nh = Math.max(20, sh.height + dy); }
        if (resizing.corner === "ne") { nw = Math.max(20, sh.width + dx); ny = sh.y + dy; nh = Math.max(20, sh.height - dy); }
        if (resizing.corner === "nw") { nx = sh.x + dx; ny = sh.y + dy; nw = Math.max(20, sh.width - dx); nh = Math.max(20, sh.height - dy); }
        onUpdate(shapes.map((s) => s.id === sh.id ? { ...s, x: nx, y: ny, width: nw, height: nh } : s));
        return;
      }
      // Drag
      if (dragRef.current && isDragging) {
        const { shapeId, startMouseX, startMouseY, startShape } = dragRef.current;
        const dx = (e.clientX - startMouseX) / canvasState.zoom;
        const dy = (e.clientY - startMouseY) / canvasState.zoom;
        onUpdate(shapes.map((s) => s.id === shapeId ? { ...s, x: startShape.x + dx, y: startShape.y + dy } : s));
      }
    };
    const onUp = () => { setResizing(null); setIsDragging(false); dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizing, isDragging, canvasState.zoom, shapes, onUpdate]);

  // Pen mode: coord-based shape selection so canvas still draws freely
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      // Check if click lands on any shape bbox
      for (const shape of shapes) {
        const sx = canvasState.panX + shape.x * canvasState.zoom;
        const sy = canvasState.panY + shape.y * canvasState.zoom;
        const sw = shape.width * canvasState.zoom;
        const sh2 = shape.height * canvasState.zoom;
        if (e.clientX >= sx && e.clientX <= sx + sw && e.clientY >= sy && e.clientY <= sy + sh2) {
          setSelectedId(shape.id);
          return;
        }
      }
      // Clicked empty space — deselect
      setSelectedId(null);
      setHoveredId(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [shapes, canvasState]);

  // Delete key removes selected shape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedId) {
        onUpdate(shapes.filter((s) => s.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, shapes, onUpdate]);

  const isDrawingTool = ["pen", "eraser", "lasso", "arrow"].includes(currentTool);

  const handleDelete = (id: string) => {
    onUpdate(shapes.filter((s) => s.id !== id));
    setSelectedId(null);
  };

  const renderShape = (shape: Shape) => {
    const svgStyle = { pointerEvents: "none" as const };
    const baseProps = {
      className: "w-full h-full",
      style: {
        fill: shape.color,
        stroke: shape.strokeColor,
        strokeWidth: 2,
      },
    };

    // From Android code: when (shape.type) { ... }
    switch (shape.type) {
      case "circle":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
            <circle cx="50" cy="50" r="48" {...baseProps} />
          </svg>
        );
      case "rounded-rect":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
            <rect x="2" y="2" width="96" height="96" rx="15" {...baseProps} />
          </svg>
        );
      case "diamond":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
            <polygon points="50,5 95,50 50,95 5,50" {...baseProps} />
          </svg>
        );
      case "cloud":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
            <path
              d="M 25,60 Q 15,50 20,40 Q 25,30 35,30 Q 40,20 50,20 Q 60,20 65,30 Q 75,30 80,40 Q 85,50 80,60 Q 75,70 65,70 L 35,70 Q 25,70 25,60 Z"
              {...baseProps}
            />
          </svg>
        );
      case "image":
        if (shape.imageUrl) {
          return (
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none" style={svgStyle}>
              <image href={shape.imageUrl} x="0" y="0" width="100" height="100" preserveAspectRatio="none" />
            </svg>
          );
        }
        // Fallback if no image URL
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
            <rect x="2" y="2" width="96" height="96" {...baseProps} />
          </svg>
        );
      default: // rectangle
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" style={svgStyle}>
            <rect x="2" y="2" width="96" height="96" {...baseProps} />
          </svg>
        );
    }
  };

  // Render preview shape while dragging to create
  const renderPreviewShape = () => {
    if (!isCreating || !createStart || !createEnd) return null;

    const minX = Math.min(createStart.x, createEnd.x);
    const minY = Math.min(createStart.y, createEnd.y);
    const width = Math.abs(createEnd.x - createStart.x);
    const height = Math.abs(createEnd.y - createStart.y);

    const previewShape: Shape = {
      id: "preview",
      type: currentShapeType,
      x: minX,
      y: minY,
      width,
      height,
      color: "#3B82F6" + "20",
      strokeColor: "#3B82F6",
      zIndex: 9999,
    };

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: canvasState.panX + previewShape.x * canvasState.zoom,
          top: canvasState.panY + previewShape.y * canvasState.zoom,
          width: previewShape.width * canvasState.zoom,
          height: previewShape.height * canvasState.zoom,
          zIndex: previewShape.zIndex,
          opacity: 0.5,
        }}
      >
        {renderShape(previewShape)}
      </div>
    );
  };

  return (
    <>
      {/* Shape Type Selector - appears when shape tool is active */}
      {isActive && (
        <div className="absolute left-6 bottom-24 z-40 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-600 mb-2">Shape Type</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentShapeType("rectangle")}
              className={`p-2 rounded-lg transition-all ${currentShapeType === "rectangle"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
                }`}
              title="Rectangle"
            >
              <Square className="size-5" />
            </button>
            <button
              onClick={() => setCurrentShapeType("circle")}
              className={`p-2 rounded-lg transition-all ${currentShapeType === "circle"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
                }`}
              title="Circle"
            >
              <Circle className="size-5" />
            </button>
            <button
              onClick={() => setCurrentShapeType("diamond")}
              className={`p-2 rounded-lg transition-all ${currentShapeType === "diamond"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
                }`}
              title="Diamond"
            >
              <Diamond className="size-5" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3 mb-2">Color</p>
          <div className="flex gap-1.5 flex-wrap">
            {SHAPE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{ backgroundColor: color }}
                className={`w-6 h-6 rounded-full border-2 transition-all ${selectedColor === color ? "border-gray-800 scale-110" : "border-transparent"}`}
                title={color}
              />
            ))}
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-6 h-6 rounded-full cursor-pointer border-0 p-0"
              style={{ appearance: "none", backgroundColor: "transparent" }}
              title="Custom color"
            />
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{
          cursor: "default",
          pointerEvents: "none",
        }}
      >
        {/* Draw overlay — only active when shape tool selected */}
        {isActive && (
          <div
            className="absolute inset-0"
            style={{ pointerEvents: "auto", cursor: "crosshair", zIndex: 1 }}
            onMouseDown={(e) => { setSelectedId(null); handleCanvasMouseDown(e); }}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={() => { setIsCreating(false); setCreateStart(null); setCreateEnd(null); }}
          />
        )}
        {shapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="absolute group"
            onMouseEnter={() => setHoveredId(shape.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              pointerEvents: "none",
              left: canvasState.panX + shape.x * canvasState.zoom,
              top: canvasState.panY + shape.y * canvasState.zoom,
              width: shape.width * canvasState.zoom,
              height: shape.height * canvasState.zoom,
              zIndex: selectedId === shape.id ? 30 : (shape.zIndex ?? 0) + 10,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div
              className="relative w-full h-full"
              style={{ pointerEvents: isDrawingTool ? "none" : "auto" }}
              onMouseDown={(e) => handleShapeMouseDown(e, shape)}
            >
              {renderShape(shape)}

              {/* Resize handles — only when selected and not in drawing mode */}
              {selectedId === shape.id && (
                <>
                  {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                    <div
                      key={corner}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizing({ corner, startMouseX: e.clientX, startMouseY: e.clientY, startShape: { ...shape } });
                      }}
                      style={{
                        position: "absolute",
                        width: 14, height: 14,
                        background: "white",
                        border: "2px solid #ef4444",
                        borderRadius: 2,
                        cursor: corner === "se" || corner === "nw" ? "nwse-resize" : "nesw-resize",
                        zIndex: 9999,
                        pointerEvents: "auto",
                        ...(corner === "nw" ? { top: -5, left: -5 } :
                          corner === "ne" ? { top: -5, right: -5 } :
                            corner === "sw" ? { bottom: -5, left: -5 } :
                              { bottom: -5, right: -5 }),
                      }}
                    />
                  ))}
                </>
              )}

              {/* Delete button */}
              <button
                onClick={() => handleDelete(shape.id)}
                className={`absolute -top-10 left-1/2 -translate-x-1/2 p-1 rounded-full bg-red-500 text-white shadow-lg transition-opacity z-[10001] ${selectedId === shape.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <X className="size-3" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Preview shape while creating */}
        {renderPreviewShape()}
      </div>
    </>
  );
}
