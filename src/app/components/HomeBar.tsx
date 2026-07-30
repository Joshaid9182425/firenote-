import { Home, Download, Sparkles, PenLine, Table2 } from "lucide-react";
import { LiquidGlass } from "./LiquidGlass";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";

interface HomeBarProps {
  boardName: string;
  onBack: () => void;
  onExport: () => void;
  onAIImprove?: () => void;
  onNameChange?: (name: string) => void;
  dark?: boolean;
  onInsertTable?: () => void;
}

export function HomeBar({ boardName, onBack, onExport, onAIImprove, onNameChange, dark = false, onInsertTable }: HomeBarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(boardName);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameValue.trim() && onNameChange) onNameChange(nameValue.trim());
  };

  const iconColor = dark ? "text-gray-300" : "text-gray-700";
  const hoverBg = dark ? "hover:bg-white/10" : "hover:bg-white/25";

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4">
      <LiquidGlass className="flex items-center justify-between px-5 py-3" blurRadius={55} dark={dark}>

        {/* Left: Home + Board Name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className={`flex-shrink-0 p-2 rounded-xl transition-all active:bg-white/40 ${hoverBg}`}
            title="Back to Dashboard"
          >
            <Home className={`size-5 ${iconColor}`} />
          </button>

          <div className={`w-px h-5 flex-shrink-0 ${dark ? "bg-white/10" : "bg-gray-300/60"}`} />

          {isEditingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSubmit();
                if (e.key === "Escape") { setNameValue(boardName); setIsEditingName(false); }
              }}
              className={`text-base font-semibold bg-white/10 border border-red-400 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-red-400/40 max-w-[200px] ${dark ? "text-gray-100" : "text-gray-900"}`}
              style={{ fontFamily: "inherit" }}
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="group flex items-center gap-1.5 min-w-0"
              title="Click to rename"
            >
              <h1 className={`text-base font-semibold truncate max-w-[160px] ${dark ? "text-gray-100" : "text-gray-900"}`}>
                {boardName}
              </h1>
              <PenLine className={`size-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${dark ? "text-gray-500" : "text-gray-400"}`} />
            </button>
          )}
        </div>

        {/* Right: AI + Export */}
        <div className="flex items-center gap-2">
          {onAIImprove && (
            <button
              onClick={onAIImprove}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-md"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                boxShadow: "0 2px 12px rgba(239,68,68,0.35)",
              }}
            >
              <Sparkles className="size-4" />
              <span>AI Improve</span>
            </button>
          )}

          {onInsertTable && (
            <button
              onClick={onInsertTable}
              className={`p-2 rounded-xl transition-all ${hoverBg}`}
              title="Insert Table"
            >
              <Table2 className={`size-4 ${iconColor}`} />
            </button>
          )}

          <div className={`w-px h-5 ${dark ? "bg-white/10" : "bg-gray-300/60"}`} />

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className={`p-2 rounded-xl transition-all ${hoverBg}`} title="Export">
                <Download className={`size-4 ${iconColor}`} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className={`z-50 min-w-[180px] rounded-2xl shadow-2xl border p-2 backdrop-blur-xl ${dark
                  ? "bg-gray-900/90 border-white/10"
                  : "bg-white/90 border-white/60"
                  }`}
                sideOffset={8}
                align="end"
              >
                <DropdownMenu.Item
                  onClick={onExport}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer outline-none transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"
                    }`}
                >
                  <div className="p-1.5 rounded-lg bg-red-500/20">
                    <Download className="size-3.5 text-red-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${dark ? "text-gray-100" : "text-gray-900"}`}>Export as PNG</p>
                    <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}>Save to your device</p>
                  </div>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </LiquidGlass>
    </div>
  );
}
