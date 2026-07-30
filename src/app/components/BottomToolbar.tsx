import { Plus, Minus } from "lucide-react";
import { LiquidGlass } from "./LiquidGlass";
import { BackgroundType } from "../types";

interface BottomToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  backgroundType: BackgroundType;
  onBackgroundChange: (type: BackgroundType) => void;
}

export function BottomToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  backgroundType,
  onBackgroundChange,
}: BottomToolbarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%]">
      <LiquidGlass 
        className="flex items-center justify-between px-8 py-6"
        blurRadius={55}
      >
        {/* Zoom Controls - Left Side */}
        <div className="flex items-center gap-5">
          <button
            onClick={onZoomOut}
            className="p-2.5 rounded-lg text-gray-700 hover:bg-white/20 transition-colors"
            title="Zoom out"
          >
            <Minus className="size-5" />
          </button>

          <button
            onClick={onResetZoom}
            className="px-4 py-2 text-lg font-medium text-gray-700 hover:bg-white/20 rounded-lg transition-colors min-w-[80px] text-center"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={onZoomIn}
            className="p-2.5 rounded-lg text-gray-700 hover:bg-white/20 transition-colors"
            title="Zoom in"
          >
            <Plus className="size-5" />
          </button>
        </div>

        {/* Grid Selector - Right Side */}
        <div className="flex items-center gap-3">
          <GridOption
            label="None"
            type="blank"
            selected={backgroundType}
            onSelect={onBackgroundChange}
          />
          <GridOption
            label="Dots"
            type="dots"
            selected={backgroundType}
            onSelect={onBackgroundChange}
          />
          <GridOption
            label="Lines"
            type="lines"
            selected={backgroundType}
            onSelect={onBackgroundChange}
          />
          <GridOption
            label="Graph"
            type="graph"
            selected={backgroundType}
            onSelect={onBackgroundChange}
          />
        </div>
      </LiquidGlass>
    </div>
  );
}

interface GridOptionProps {
  label: string;
  type: BackgroundType;
  selected: BackgroundType;
  onSelect: (type: BackgroundType) => void;
}

function GridOption({ label, type, selected, onSelect }: GridOptionProps) {
  const isSelected = type === selected;

  return (
    <button
      onClick={() => onSelect(type)}
      className={`rounded-2xl px-4 py-2 transition-all ${
        isSelected
          ? "bg-white/35 text-gray-900"
          : "bg-transparent text-gray-700 hover:bg-white/15"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
