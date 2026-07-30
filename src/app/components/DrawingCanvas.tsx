import { useRef, useEffect, useState } from "react";
import { Board, Tool, CanvasState, Point, Stroke, PenType, Arrow } from "../types";

interface DrawingCanvasProps {
  board: Board;
  onBoardUpdate: (updates: Partial<Board>) => void;
  currentTool: Tool;
  penType: PenType;
  penColor: string;
  penSize: number;
  canvasState: CanvasState;
  onCanvasStateChange: (state: CanvasState) => void;
  selectedElementIds?: string[];
  onSelectedElementsChange?: (ids: string[]) => void;
  dark?: boolean;
}

export function DrawingCanvas({
  board,
  onBoardUpdate,
  currentTool,
  penType,
  penColor,
  penSize,
  canvasState,
  onCanvasStateChange,
  selectedElementIds = [],
  onSelectedElementsChange,
  dark = false,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [lassoPath, setLassoPath] = useState<Point[]>([]);
  const [arrowStart, setArrowStart] = useState<Point | null>(null);
  const [lassoMenu, setLassoMenu] = useState<{ x: number; y: number } | null>(null);
  const [copiedStrokes, setCopiedStrokes] = useState<Stroke[]>([]);
  const [isLassoDragging, setIsLassoDragging] = useState(false);
  const [lassoDragStart, setLassoDragStart] = useState<Point | null>(null);
  const [lassoBoundingBox, setLassoBoundingBox] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // --- Helpers ---
  const getCanvasPoint = (e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - canvasState.panX) / canvasState.zoom,
      y: (e.clientY - rect.top - canvasState.panY) / canvasState.zoom,
      pressure: 0.5,
    };
  };

  const getEffectiveColor = (): string => {
    if (penType === "highlighter-yellow") return "#FEF08A";
    if (penType === "highlighter-green") return "#86EFAC";
    if (penType === "highlighter-blue") return "#93C5FD";
    return penColor;
  };

  const smoothPath = (points: Point[]): Point[] => {
    if (points.length < 3) return points;
    const smoothed: Point[] = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      smoothed.push({
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2,
      });
    }
    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  const updateLassoMenu = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      const selectedStrokes = board.strokes.filter((s) => selectedIds.includes(s.id));
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      selectedStrokes.forEach((s) => s.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }));
      setLassoBoundingBox({ minX, minY, maxX, maxY });
      const screenX = canvasState.panX + ((minX + maxX) / 2) * canvasState.zoom;
      const screenY = canvasState.panY + minY * canvasState.zoom - 60;
      setLassoMenu({ x: screenX, y: Math.max(16, screenY) });
    } else {
      setLassoMenu(null);
      setLassoBoundingBox(null);
    }
  };

  const selectWithLasso = (path: Point[]) => {
    if (path.length < 3) return;
    const check = (point: Point): boolean => {
      let inside = false;
      for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
        const xi = path[i].x, yi = path[i].y;
        const xj = path[j].x, yj = path[j].y;
        if ((yi > point.y) !== (yj > point.y) &&
          point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    };
    const selected: string[] = [];
    board.strokes.forEach((stroke) => {
      if (stroke.points.some((p) => check(p))) selected.push(stroke.id);
    });
    onSelectedElementsChange?.(selected);
    updateLassoMenu(selected);
  };

  const eraseAt = (position: Point) => {
    const eraserRadius = penSize * 5;
    const remaining = board.strokes.filter((stroke) =>
      !stroke.points.some((p) => {
        const dx = p.x - position.x;
        const dy = p.y - position.y;
        return Math.sqrt(dx * dx + dy * dy) < eraserRadius;
      })
    );
    if (remaining.length !== board.strokes.length) onBoardUpdate({ strokes: remaining });
  };

  // --- Rendering ---
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, isSelected: boolean) => {
    if (stroke.points.length < 2) return;
    const smoothedPoints = smoothPath(stroke.points);
    const isHighlighter = stroke.penType.startsWith("highlighter");
    const inkColor = (stroke.color === "#000000" && dark) ? "#ffffff" : stroke.color;

    ctx.save();
    if (isHighlighter) {
      ctx.globalAlpha = 0.38;
      ctx.globalCompositeOperation = "multiply";
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = stroke.size * 10;
      ctx.lineCap = "square";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
      for (let i = 1; i < smoothedPoints.length - 1; i++) {
        const mid = { x: (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2, y: (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2 };
        ctx.quadraticCurveTo(smoothedPoints[i].x, smoothedPoints[i].y, mid.x, mid.y);
      }
      ctx.lineTo(smoothedPoints[smoothedPoints.length - 1].x, smoothedPoints[smoothedPoints.length - 1].y);
      ctx.stroke();
    } else if (stroke.penType === "pencil") {
      ctx.globalCompositeOperation = "source-over";
      for (let grain = 0; grain < 3; grain++) {
        ctx.globalAlpha = 0.25 + Math.random() * 0.15;
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = stroke.size * 0.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([2, grain * 2]);
        ctx.beginPath();
        const offsetX = (grain - 1) * 0.8;
        const offsetY = (grain - 1) * 0.4;
        ctx.moveTo(smoothedPoints[0].x + offsetX, smoothedPoints[0].y + offsetY);
        for (let i = 1; i < smoothedPoints.length - 1; i++) {
          const mid = { x: (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2 + offsetX, y: (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2 + offsetY };
          ctx.quadraticCurveTo(smoothedPoints[i].x + offsetX, smoothedPoints[i].y + offsetY, mid.x, mid.y);
        }
        ctx.lineTo(smoothedPoints[smoothedPoints.length - 1].x + offsetX, smoothedPoints[smoothedPoints.length - 1].y + offsetY);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    } else if (stroke.penType === "marker") {
      ctx.globalAlpha = 0.82;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = stroke.size * 3;
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";
      ctx.beginPath();
      ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
      smoothedPoints.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.97;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
      for (let i = 1; i < smoothedPoints.length - 1; i++) {
        const mid = { x: (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2, y: (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2 };
        ctx.quadraticCurveTo(smoothedPoints[i].x, smoothedPoints[i].y, mid.x, mid.y);
      }
      ctx.lineTo(smoothedPoints[smoothedPoints.length - 1].x, smoothedPoints[smoothedPoints.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = (isHighlighter ? stroke.size * 10 : stroke.size) + 6;
      ctx.globalAlpha = 0.3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
      for (let i = 1; i < smoothedPoints.length - 1; i++) {
        const mid = { x: (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2, y: (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2 };
        ctx.quadraticCurveTo(smoothedPoints[i].x, smoothedPoints[i].y, mid.x, mid.y);
      }
      ctx.lineTo(smoothedPoints[smoothedPoints.length - 1].x, smoothedPoints[smoothedPoints.length - 1].y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, arrow: Arrow) => {
    const { startX, startY, endX, endY, color } = arrow;
    const arrowColor = (color === "#000000" && dark) ? "#ffffff" : color;
    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveAmount = Math.min(dist * 0.2, 80);
    const nx = -dy / dist;
    const ny = dx / dist;
    const cpX = midX + nx * curveAmount;
    const cpY = midY + ny * curveAmount;
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();
    const tipDx = endX - cpX;
    const tipDy = endY - cpY;
    const angle = Math.atan2(tipDy, tipDx);
    const len = 20;
    [[Math.PI / 6], [-Math.PI / 6]].forEach(([offset]) => {
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - len * Math.cos(angle - offset), endY - len * Math.sin(angle - offset));
      ctx.stroke();
    });
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvasState.panX, canvasState.panY);
    ctx.scale(canvasState.zoom, canvasState.zoom);
    board.strokes.forEach((stroke) => drawStroke(ctx, stroke, selectedElementIds.includes(stroke.id)));
    board.arrows.forEach((arrow) => drawArrow(ctx, arrow));
    if (currentPoints.length > 0 && currentTool === "pen") {
      drawStroke(ctx, { id: "preview", points: currentPoints, color: getEffectiveColor(), size: penSize, penType }, false);
    }
    if ((lassoPath.length > 1 || selectedElementIds.length > 0) && currentTool === "lasso") {
      ctx.save();
      if (selectedElementIds.length > 0 && !isDrawing && lassoBoundingBox) {
        const { minX, minY, maxX, maxY } = lassoBoundingBox;
        ctx.beginPath();
        ctx.rect(minX - 5, minY - 5, (maxX - minX) + 10, (maxY - minY) + 10);
      } else if (lassoPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(lassoPath[0].x, lassoPath[0].y);
        lassoPath.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.closePath();
      }
      ctx.fillStyle = isLassoDragging ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.08)";
      ctx.fill();
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 2 / canvasState.zoom;
      ctx.setLineDash([6 / canvasState.zoom, 4 / canvasState.zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (arrowStart && currentPoints.length > 0 && currentTool === "arrow") {
      const end = currentPoints[currentPoints.length - 1];
      drawArrow(ctx, { id: "preview", startX: arrowStart.x, startY: arrowStart.y, endX: end.x, endY: end.y, color: penColor, zIndex: 0 });
    }
    ctx.restore();
  };

  // --- Effects ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [canvasState, board, currentPoints, lassoPath, selectedElementIds]); // Re-run if these change

  useEffect(() => {
    redrawCanvas();
  }, [board.strokes, board.arrows, canvasState, lassoPath, selectedElementIds, arrowStart, currentPoints]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      
      // Spacebar for panning (only when not editing text)
      if (e.code === "Space" && !isInput && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      if (e.key === "Delete" && !isInput && selectedElementIds.length > 0) {
        onBoardUpdate({ strokes: board.strokes.filter((s) => !selectedElementIds.includes(s.id)) });
        onSelectedElementsChange?.([]);
        setLassoMenu(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedElementIds, board.strokes, onBoardUpdate, isSpacePressed]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const src = ev.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const maxW = 600;
              const scale = img.width > maxW ? maxW / img.width : 1;
              const width = img.width * scale;
              const height = img.height * scale;
              const x = (window.innerWidth / 2 - canvasState.panX) / canvasState.zoom - width / 2;
              const y = (window.innerHeight / 2 - canvasState.panY) / canvasState.zoom - height / 2;
              onBoardUpdate({
                shapes: [...board.shapes, {
                  id: Date.now().toString(),
                  type: "image",
                  x, y, width, height,
                  color: "transparent",
                  strokeColor: "transparent",
                  zIndex: board.shapes.length,
                  imageUrl: src
                }]
              });
            };
            img.src = src;
          };
          reader.readAsDataURL(blob);
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [canvasState, board.shapes, onBoardUpdate]);

  // --- Handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
      return;
    }
    const point = getCanvasPoint(e);
    if (e.button !== 0) return;

    if (currentTool === "pen") {
      setIsDrawing(true);
      setCurrentPoints([point]);
    } else if (currentTool === "eraser") {
      setIsDrawing(true);
      eraseAt(point);
    } else if (currentTool === "lasso") {
      if (lassoBoundingBox &&
        point.x >= lassoBoundingBox.minX && point.x <= lassoBoundingBox.maxX &&
        point.y >= lassoBoundingBox.minY && point.y <= lassoBoundingBox.maxY) {
        setIsLassoDragging(true);
        setLassoDragStart(point);
        setLassoMenu(null);
      } else {
        setIsDrawing(true);
        setLassoPath([point]);
        setLassoMenu(null);
        onSelectedElementsChange?.([]);
      }
    } else if (currentTool === "arrow") {
      setIsDrawing(true);
      setArrowStart(point);
      setCurrentPoints([point]);
    } else if (currentTool === "pan") {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.x;
      const dy = e.clientY - lastPanPos.y;
      onCanvasStateChange({ ...canvasState, panX: canvasState.panX + dx, panY: canvasState.panY + dy });
      setLastPanPos({ x: e.clientX, y: e.clientY });
      return;
    }
    if (!isDrawing) return;
    const point = getCanvasPoint(e);

    if (currentTool === "pen") {
      setCurrentPoints((prev) => [...prev, point]);
    } else if (currentTool === "eraser") {
      eraseAt(point);
    } else if (currentTool === "lasso") {
      if (isLassoDragging && lassoDragStart) {
        const dx = point.x - lassoDragStart.x;
        const dy = point.y - lassoDragStart.y;
        const updatedStrokes = board.strokes.map(s => {
          if (selectedElementIds.includes(s.id)) {
            return { ...s, points: s.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy })) };
          }
          return s;
        });
        onBoardUpdate({ strokes: updatedStrokes });
        setLassoDragStart(point);
        if (lassoBoundingBox) {
          setLassoBoundingBox({
            minX: lassoBoundingBox.minX + dx,
            minY: lassoBoundingBox.minY + dy,
            maxX: lassoBoundingBox.maxX + dx,
            maxY: lassoBoundingBox.maxY + dy,
          });
        }
      } else {
        setLassoPath((prev) => [...prev, point]);
      }
    } else if (currentTool === "arrow") {
      setCurrentPoints([point]);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); return; }
    if (!isDrawing) return;

    if (currentTool === "pen" && currentPoints.length > 1) {
      onBoardUpdate({
        strokes: [...board.strokes, {
          id: Date.now().toString(),
          points: currentPoints,
          color: getEffectiveColor(),
          size: penSize,
          penType,
        }],
      });
      setCurrentPoints([]);
    } else if (currentTool === "lasso") {
      if (isLassoDragging) {
        setIsLassoDragging(false);
        setLassoDragStart(null);
        updateLassoMenu(selectedElementIds);
      } else {
        setLassoPath((prev) => {
          selectWithLasso(prev);
          return [];
        });
      }
    } else if (currentTool === "arrow" && arrowStart && currentPoints.length > 0) {
      const end = currentPoints[currentPoints.length - 1];
      onBoardUpdate({
        arrows: [...board.arrows, {
          id: Date.now().toString(),
          startX: arrowStart.x,
          startY: arrowStart.y,
          endX: end.x,
          endY: end.y,
          color: (penColor === "#000000" && dark) ? "#ffffff" : penColor,
          zIndex: board.arrows.length,
        }],
      });
      setArrowStart(null);
      setCurrentPoints([]);
    }
    setIsDrawing(false);
  };


  // ─── Wheel zoom/pan ───────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, canvasState.zoom * delta));
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - canvasState.panX) / canvasState.zoom;
      const worldY = (mouseY - canvasState.panY) / canvasState.zoom;
      onCanvasStateChange({ zoom: newZoom, panX: mouseX - worldX * newZoom, panY: mouseY - worldY * newZoom });
    } else {
      onCanvasStateChange({ ...canvasState, panX: canvasState.panX - e.deltaX, panY: canvasState.panY - e.deltaY });
    }
  };

  const handleLassoDelete = () => {
    onBoardUpdate({ strokes: board.strokes.filter((s) => !selectedElementIds.includes(s.id)) });
    onSelectedElementsChange?.([]);
    setLassoMenu(null);
  };

  const handleLassoDuplicate = () => {
    const offset = 24 / canvasState.zoom;
    const dupes = board.strokes
      .filter((s) => selectedElementIds.includes(s.id))
      .map((s) => ({
        ...s,
        id: Date.now().toString() + Math.random(),
        points: s.points.map((p) => ({ ...p, x: p.x + offset, y: p.y + offset })),
      }));
    onBoardUpdate({ strokes: [...board.strokes, ...dupes] });
    onSelectedElementsChange?.(dupes.map((d) => d.id));
    setLassoMenu(null);
  };

  const handleLassoCopy = () => {
    const copied = board.strokes.filter((s) => selectedElementIds.includes(s.id));
    setCopiedStrokes(copied);
    setLassoMenu(null);
    onSelectedElementsChange?.([]);
  };

  const handleLassoPaste = () => {
    if (copiedStrokes.length === 0) return;
    const centerX = (window.innerWidth / 2 - canvasState.panX) / canvasState.zoom;
    const centerY = (window.innerHeight / 2 - canvasState.panY) / canvasState.zoom;
    let minX = Infinity, minY = Infinity;
    copiedStrokes.forEach(s => s.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
    }));
    const pasted = copiedStrokes.map((s) => ({
      ...s,
      id: Date.now().toString() + Math.random(),
      points: s.points.map((p) => ({ ...p, x: p.x - minX + centerX - 50, y: p.y - minY + centerY - 50 })),
    }));
    onBoardUpdate({ strokes: [...board.strokes, ...pasted] });
    const newIds = pasted.map(p => p.id);
    onSelectedElementsChange?.(newIds);
    setTimeout(() => updateLassoMenu(newIds), 0);
  };

  const handleLassoDeselect = () => {
    onSelectedElementsChange?.([]);
    setLassoMenu(null);
  };

  const getCursor = () => {
    if (isPanning || isSpacePressed) return "grabbing";
    if (currentTool === "pan") return "grab";
    if (currentTool === "shape") return "crosshair";
    if (currentTool === "eraser") {
      const radius = penSize * 5;
      const size = radius * 2 + 4;
      const strokeColor = dark ? "white" : "black";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="1.5" /></svg>`;
      return `url('data:image/svg+xml;base64,${btoa(svg)}') ${size / 2} ${size / 2}, auto`;
    }
    return "crosshair";
  };

  return (
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="absolute inset-0"
        style={{
          touchAction: "none",
          cursor: getCursor(),
          zIndex: 20,
          pointerEvents: (["pen", "eraser", "lasso", "arrow", "pan"].includes(currentTool) || isSpacePressed || isPanning) ? "auto" : "none"
        }}
      />
      {lassoMenu && selectedElementIds.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: lassoMenu.x,
            top: lassoMenu.y,
            transform: "translateX(-50%)",
            zIndex: 100,
            display: "flex",
            gap: 6,
            padding: "8px 10px",
            borderRadius: 16,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: dark ? "rgba(20,20,30,0.85)" : "rgba(255,255,255,0.85)",
            border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            pointerEvents: "auto",
          }}
        >
          {[
            { label: "✕ Delete", color: "#ef4444", action: handleLassoDelete },
            { label: "⊕ Duplicate", color: dark ? "#f1f1f3" : "#111118", action: handleLassoDuplicate },
            { label: "⎘ Copy", color: dark ? "#f1f1f3" : "#111118", action: handleLassoCopy },
            { label: "✕ Deselect", color: dark ? "#6b7280" : "#9ca3af", action: handleLassoDeselect },
          ].map(({ label, color, action }) => (
            <button
              key={label}
              onClick={action}
              style={{ padding: "5px 11px", borderRadius: 10, border: "none", background: "transparent", color, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {label}
            </button>
          ))}
          {copiedStrokes.length > 0 && (
            <button
              onClick={handleLassoPaste}
              style={{ padding: "5px 11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              ⎘ Paste
            </button>
          )}
        </div>
      )}
    </div>
  );
}
