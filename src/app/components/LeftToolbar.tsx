import {
  Pen,
  Eraser,
  StickyNote,
  Square,
  Type,
  Image,
  Lasso,
  ArrowRight,
  MousePointer2,
  Highlighter,
  Pencil,
} from "lucide-react";
import { Tool, PenType } from "../types";
import { LiquidGlass } from "./LiquidGlass";
import * as Popover from "@radix-ui/react-popover";
import * as Slider from "@radix-ui/react-slider";

interface LeftToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  penType: PenType;
  onPenTypeChange: (penType: PenType) => void;
  penColor: string;
  onColorChange: (color: string) => void;
  penSize: number;
  onSizeChange: (size: number) => void;
}

const COLORS = [
  "#000000",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

export function LeftToolbar({
  currentTool,
  onToolChange,
  penType,
  onPenTypeChange,
  penColor,
  onColorChange,
  penSize,
  onSizeChange,
}: LeftToolbarProps) {
  const tools: { tool: Tool; icon: React.ReactNode; label: string }[] = [
    { tool: "select", icon: <MousePointer2 className="size-5" />, label: "Select" },
    { tool: "pen", icon: <Pen className="size-5" />, label: "Pen" },
    { tool: "eraser", icon: <Eraser className="size-5" />, label: "Eraser" },
    { tool: "sticky", icon: <StickyNote className="size-5" />, label: "Sticky Note" },
    { tool: "shape", icon: <Square className="size-5" />, label: "Shape" },
    { tool: "text", icon: <Type className="size-5" />, label: "Text" },
    { tool: "image", icon: <Image className="size-5" />, label: "Image" },
    { tool: "lasso", icon: <Lasso className="size-5" />, label: "Lasso" },
    { tool: "arrow", icon: <ArrowRight className="size-5" />, label: "Arrow" },
  ];

  return (
    <LiquidGlass className="absolute left-6 top-24 z-40 flex flex-col gap-2 p-3">
      {tools.map(({ tool, icon, label }) => (
        <button
          key={tool}
          onClick={() => onToolChange(tool)}
          className={`group relative p-3 rounded-xl transition-all ${
            currentTool === tool
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          title={label}
        >
          {icon}
          {/* Tooltip */}
          <span className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {label}
          </span>
        </button>
      ))}

      {/* Divider */}
      <div className="h-px bg-gray-200 my-1" />

      {/* Color Picker */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-colors"
            style={{ backgroundColor: penColor }}
            title="Color"
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="right"
            sideOffset={12}
            className="z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4"
          >
            <div className="space-y-3">
              {/* Pen Type Selector */}
              <div>
                <p className="text-sm text-gray-700 mb-2">Pen Type</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onPenTypeChange("pen")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                      penType === "pen"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Pen className="size-4" />
                    Pen
                  </button>
                  <button
                    onClick={() => onPenTypeChange("pencil")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                      penType === "pencil"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Pencil className="size-4" />
                    Pencil
                  </button>
                  <button
                    onClick={() => onPenTypeChange("marker")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                      penType === "marker"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Highlighter className="size-4" />
                    Marker
                  </button>
                  <button
                    onClick={() => onPenTypeChange("highlighter-yellow")}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                      penType === "highlighter-yellow"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Yellow
                  </button>
                  <button
                    onClick={() => onPenTypeChange("highlighter-green")}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                      penType === "highlighter-green"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Green
                  </button>
                  <button
                    onClick={() => onPenTypeChange("highlighter-blue")}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                      penType === "highlighter-blue"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Blue
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-200" />
              
              <p className="text-sm text-gray-700">Color</p>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      penColor === color
                        ? "border-blue-500 scale-110"
                        : "border-gray-300 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-2">Custom</p>
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-3">Size: {penSize}px</p>
                <Slider.Root
                  value={[penSize]}
                  onValueChange={([value]) => onSizeChange(value)}
                  min={1}
                  max={20}
                  step={1}
                  className="relative flex items-center w-48 h-5"
                >
                  <Slider.Track className="relative h-1 flex-grow bg-gray-200 rounded-full">
                    <Slider.Range className="absolute h-full bg-blue-600 rounded-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </Slider.Root>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </LiquidGlass>
  );
}