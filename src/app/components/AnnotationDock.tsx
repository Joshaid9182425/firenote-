import { StickyNote, Square, Lasso, Eraser, Hand, ImagePlus } from "lucide-react";
import { Tool } from "../types";
import { LiquidGlass } from "./LiquidGlass";

interface AnnotationDockProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  dark?: boolean;
  onInsertImage?: () => void;
}

export function AnnotationDock({ currentTool, onToolChange, dark = false, onInsertImage }: AnnotationDockProps) {
  const tools: { tool: Tool; icon: any; label: string }[] = [
    { tool: "sticky", icon: StickyNote, label: "Sticky Note" },
    { tool: "shape", icon: Square, label: "Shapes" },
    { tool: "lasso", icon: Lasso, label: "Lasso" },
    { tool: "eraser", icon: Eraser, label: "Eraser" },
    { tool: "pan", icon: Hand, label: "Pan Board" },
  ];

  return (
    <div className="absolute left-4 bottom-32 z-40">
      <LiquidGlass className="flex flex-col items-center gap-4 p-4 w-[72px]" dark={dark}>
        {tools.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className={`p-3 rounded-xl transition-all ${currentTool === tool
              ? "bg-blue-500 text-white shadow-lg"
              : dark
                ? "text-gray-300 hover:bg-white/10"
                : "text-gray-700 hover:bg-white/20"
              }`}
            title={label}
          >
            <Icon className="size-6" />
          </button>
        ))}
        {onInsertImage && (
          <button
            onClick={onInsertImage}
            className={`p-3 rounded-xl transition-all ${dark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-white/20"}`}
            title="Insert Image"
          >
            <ImagePlus className="size-6" />
          </button>
        )}
      </LiquidGlass>
    </div>
  );
}
