import { Grid3x3 } from "lucide-react";
import { BackgroundType } from "../types";
import { LiquidGlass } from "./LiquidGlass";
import * as Popover from "@radix-ui/react-popover";

interface GridSelectorProps {
  backgroundType: BackgroundType;
  onBackgroundChange: (type: BackgroundType) => void;
  dark?: boolean;
}

export function GridSelector({ backgroundType, onBackgroundChange, dark = false }: GridSelectorProps) {
  return (
    <div className="absolute bottom-24 right-6 z-40">
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            className={`p-3 rounded-xl transition-colors ${dark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-white/20"}`}
            title="Grid options"
          >
            <LiquidGlass className="p-3" blurRadius={45} dark={dark}>
              <Grid3x3 className="size-5" />
            </LiquidGlass>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="left"
            sideOffset={12}
            className={`z-50 rounded-xl shadow-xl border p-4 w-64 ${
              dark ? "bg-gray-900 border-white/10 shadow-black/50" : "bg-white border-gray-200"
            }`}
          >
            <div className="space-y-3">
              <p className={`text-sm font-medium ${dark ? "text-gray-300" : "text-gray-700"}`}>Background</p>
              <div className="grid grid-cols-2 gap-2">
                <BackgroundOption
                  type="blank"
                  label="None"
                  isActive={backgroundType === "blank"}
                  onClick={() => onBackgroundChange("blank")}
                  dark={dark}
                />
                <BackgroundOption
                  type="dots"
                  label="Dots"
                  isActive={backgroundType === "dots"}
                  onClick={() => onBackgroundChange("dots")}
                  dark={dark}
                />
                <BackgroundOption
                  type="lines"
                  label="Lines"
                  isActive={backgroundType === "lines"}
                  onClick={() => onBackgroundChange("lines")}
                  dark={dark}
                />
                <BackgroundOption
                  type="graph"
                  label="Graph"
                  isActive={backgroundType === "graph"}
                  onClick={() => onBackgroundChange("graph")}
                  dark={dark}
                />
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

interface BackgroundOptionProps {
  type: BackgroundType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  dark?: boolean;
}

function BackgroundOption({ type, label, isActive, onClick, dark = false }: BackgroundOptionProps) {
  const dotColor = dark ? "#374151" : "#94a3b8";
  const lineColor = dark ? "#374151" : "#94a3b8";

  return (
    <button
      onClick={onClick}
      className={`relative h-20 rounded-lg border-2 transition-all overflow-hidden ${
        isActive
          ? dark ? "border-red-500 bg-red-900/20" : "border-blue-500 bg-blue-50"
          : dark ? "border-gray-700 hover:border-gray-600" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <div className={`absolute inset-0 ${dark ? "bg-gray-800" : "bg-gray-50"}`}>
        {type === "dots" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                `radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px)`,
              backgroundSize: "12px 12px",
            }}
          />
        )}
        {type === "lines" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
              backgroundSize: "12px 12px",
            }}
          />
        )}
        {type === "graph" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
              backgroundSize: "6px 6px",
            }}
          />
        )}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 ${dark ? "bg-gray-900/90" : "bg-white/90"}`}>
        <p className={`text-xs text-center ${dark ? "text-gray-300" : "text-gray-700"}`}>{label}</p>
      </div>
    </button>
  );
}
