import { Plus, Minus } from "lucide-react";
import { LiquidGlass } from "./LiquidGlass";

interface ZoomPillProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  dark?: boolean;
}

export function ZoomPill({ zoom, onZoomIn, onZoomOut, dark = false }: ZoomPillProps) {
  return (
    <div className="absolute bottom-6 right-6 z-40">
      <LiquidGlass className="flex items-center gap-3 px-4 py-3 w-[170px]" blurRadius={45} dark={dark}>
        <button
          onClick={onZoomOut}
          className={`p-1.5 rounded-lg transition-colors ${dark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-white/20"}`}
          title="Zoom out"
        >
          <Minus className="size-4" />
        </button>

        <span className={`text-sm font-medium flex-1 text-center ${dark ? "text-gray-200" : "text-gray-900"}`}>
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={onZoomIn}
          className={`p-1.5 rounded-lg transition-colors ${dark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-white/20"}`}
          title="Zoom in"
        >
          <Plus className="size-4" />
        </button>
      </LiquidGlass>
    </div>
  );
}
