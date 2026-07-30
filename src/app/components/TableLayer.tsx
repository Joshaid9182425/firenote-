import { useState, useRef } from "react";
import { Table, CanvasState } from "../types";
import { X, Plus } from "lucide-react";

interface TableLayerProps {
    tables: Table[];
    onUpdate: (tables: Table[]) => void;
    canvasState: CanvasState;
    currentTool?: string;
}

export function TableLayer({ tables, onUpdate, canvasState, currentTool }: TableLayerProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const dragRef = useRef<{ tableId: string; startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);
    const resizeCellRef = useRef<{ tableId: string; type: "col" | "row"; idx: number; startMouse: number; startSize: number } | null>(null);
    const isDrawing = ["pen", "eraser", "lasso", "arrow"].includes(currentTool ?? "");

    const handleDelete = (id: string) => {
        onUpdate(tables.filter((t) => t.id !== id));
        setSelectedId(null);
    };

    const addRow = (tableId: string) => {
        onUpdate(tables.map((t) => {
            if (t.id !== tableId) return t;
            const newRow = Array.from({ length: t.cols }, (_, ci) => ({ content: "", width: t.cells[0][ci].width, height: 40 }));
            return { ...t, rows: t.rows + 1, cells: [...t.cells, newRow] };
        }));
    };

    const addCol = (tableId: string) => {
        onUpdate(tables.map((t) => {
            if (t.id !== tableId) return t;
            return {
                ...t, cols: t.cols + 1,
                cells: t.cells.map((row) => [...row, { content: "", width: 100, height: row[0].height }])
            };
        }));
    };

    const handleCellChange = (tableId: string, ri: number, ci: number, value: string) => {
        onUpdate(tables.map((t) => {
            if (t.id !== tableId) return t;
            const cells = t.cells.map((row, r) => row.map((cell, c) => r === ri && c === ci ? { ...cell, content: value } : cell));
            return { ...t, cells };
        }));
    };

    const tablesRef = useRef(tables);
    tablesRef.current = tables;

    // Global mouse for drag + resize
    const onWindowMouseMove = (e: MouseEvent) => {
        if (dragRef.current) {
            const { tableId, startMouseX, startMouseY, startX, startY } = dragRef.current;
            const dx = (e.clientX - startMouseX) / canvasState.zoom;
            const dy = (e.clientY - startMouseY) / canvasState.zoom;
            onUpdate(tablesRef.current.map((t) => t.id === tableId ? { ...t, x: startX + dx, y: startY + dy } : t));
        }
        if (resizeCellRef.current) {
            const { tableId, type, idx, startMouse, startSize } = resizeCellRef.current;
            const delta = ((type === "col" ? e.clientX : e.clientY) - startMouse) / canvasState.zoom;
            onUpdate(tablesRef.current.map((t) => {
                if (t.id !== tableId) return t;
                const cells = t.cells.map((row, ri) => row.map((cell, ci) => {
                    if (type === "col" && ci === idx) return { ...cell, width: Math.max(40, startSize + delta) };
                    if (type === "row" && ri === idx) return { ...cell, height: Math.max(24, startSize + delta) };
                    return cell;
                }));
                return { ...t, cells };
            }));
        }
    };

    const onWindowMouseUp = () => {
        dragRef.current = null;
        resizeCellRef.current = null;
        window.removeEventListener("mousemove", onWindowMouseMove);
        window.removeEventListener("mouseup", onWindowMouseUp);
    };

    // Attach/detach global listeners
    const startDrag = (e: React.MouseEvent, table: Table) => {
        if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "BUTTON") return;
        e.stopPropagation();
        setSelectedId(table.id);
        dragRef.current = { tableId: table.id, startMouseX: e.clientX, startMouseY: e.clientY, startX: table.x, startY: table.y };
        window.addEventListener("mousemove", onWindowMouseMove);
        window.addEventListener("mouseup", onWindowMouseUp);
    };

    const startResizeCol = (e: React.MouseEvent, tableId: string, ci: number, currentWidth: number) => {
        e.stopPropagation();
        resizeCellRef.current = { tableId, type: "col", idx: ci, startMouse: e.clientX, startSize: currentWidth };
        window.addEventListener("mousemove", onWindowMouseMove);
        window.addEventListener("mouseup", onWindowMouseUp);
    };

    const startResizeRow = (e: React.MouseEvent, tableId: string, ri: number, currentHeight: number) => {
        e.stopPropagation();
        resizeCellRef.current = { tableId, type: "row", idx: ri, startMouse: e.clientY, startSize: currentHeight };
        window.addEventListener("mousemove", onWindowMouseMove);
        window.addEventListener("mouseup", onWindowMouseUp);
    };

    return (
        <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
            {tables.map((table) => {
                const screenX = canvasState.panX + table.x * canvasState.zoom;
                const screenY = canvasState.panY + table.y * canvasState.zoom;
                const isSelected = selectedId === table.id;
                const totalW = table.cells[0]?.reduce((s, c) => s + c.width, 0) ?? 0;

                return (
                    <div
                        key={table.id}
                        style={{
                            position: "absolute",
                            left: screenX,
                            top: screenY,
                            zIndex: table.zIndex + 10,
                            pointerEvents: isDrawing ? "none" : "auto",
                            userSelect: "none",
                        }}
                        onMouseDown={(e) => startDrag(e, table)}
                    >
                        {/* Table grid */}
                        <table style={{ borderCollapse: "collapse", cursor: "move", boxShadow: isSelected ? "0 0 0 2px #3B82F6" : "0 2px 12px rgba(0,0,0,0.12)", borderRadius: 4, overflow: "hidden" }}>
                            <tbody>
                                {table.cells.map((row, ri) => (
                                    <tr key={ri} style={{ position: "relative" }}>
                                        {row.map((cell, ci) => (
                                            <td key={ci} style={{ position: "relative", width: cell.width * canvasState.zoom, height: cell.height * canvasState.zoom, border: "1px solid #d1d5db", background: ri === 0 ? "#f3f4f6" : "white", padding: 0, minWidth: 40 }}>
                                                <input
                                                    value={cell.content}
                                                    onChange={(e) => handleCellChange(table.id, ri, ci, e.target.value)}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    style={{ width: "100%", height: "100%", border: "none", outline: "none", background: "transparent", padding: "4px 6px", fontSize: Math.max(10, 12 * canvasState.zoom), fontWeight: ri === 0 ? 600 : 400, cursor: "text", fontFamily: "'Segoe UI',system-ui,sans-serif" }}
                                                />
                                                {/* Col resize handle */}
                                                <div
                                                    onMouseDown={(e) => startResizeCol(e, table.id, ci, cell.width)}
                                                    style={{ position: "absolute", top: 0, right: -3, width: 6, height: "100%", cursor: "col-resize", zIndex: 10, background: "transparent" }}
                                                />
                                                {/* Row resize handle */}
                                                <div
                                                    onMouseDown={(e) => startResizeRow(e, table.id, ri, cell.height)}
                                                    style={{ position: "absolute", bottom: -3, left: 0, width: "100%", height: 6, cursor: "row-resize", zIndex: 10, background: "transparent" }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Controls when selected */}
                        {isSelected && (
                            <>
                                {/* Delete */}
                                <button onClick={() => handleDelete(table.id)}
                                    style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
                                    <X style={{ width: 11, height: 11, color: "white" }} />
                                </button>
                                {/* Add row */}
                                <button onClick={() => addRow(table.id)}
                                    title="Add row"
                                    style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, background: "#3B82F6", border: "none", cursor: "pointer", fontSize: 10, color: "white", fontWeight: 600 }}>
                                    <Plus style={{ width: 9, height: 9 }} /> Row
                                </button>
                                {/* Add col */}
                                <button onClick={() => addCol(table.id)}
                                    title="Add column"
                                    style={{ position: "absolute", top: "50%", right: -50, transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, background: "#3B82F6", border: "none", cursor: "pointer", fontSize: 10, color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>
                                    <Plus style={{ width: 9, height: 9 }} /> Col
                                </button>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
