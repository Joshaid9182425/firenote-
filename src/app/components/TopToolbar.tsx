import { Home, Undo, Redo, Download, Sparkles } from "lucide-react";
import { LiquidGlass } from "./LiquidGlass";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface TopToolbarProps {
  boardName: string;
  onBack: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport: () => void;
  onAIImprove: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onNameChange?: (name: string) => void;
}

export function TopToolbar({
  boardName,
  onBack,
  onUndo,
  onRedo,
  onExport,
  onAIImprove,
  canUndo = false,
  canRedo = false,
}: TopToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-6">
      <LiquidGlass
        className="flex items-center justify-between px-6 py-4"
        blurRadius={50}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            title="Back to Dashboard"
          >
            <Home className="size-5 text-gray-800" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{boardName}</h1>
        </div>

        <div className="flex items-center gap-2">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="size-5 text-gray-800" />
            </button>
          )}
          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="size-5 text-gray-800" />
            </button>
          )}

          <div className="w-px h-6 bg-gray-300/50 mx-2" />

          <button
            onClick={onAIImprove}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg"
          >
            <Sparkles className="size-5" />
            <span>AI Improve</span>
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                title="Export"
              >
                <Download className="size-5 text-gray-800" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[200px] bg-white rounded-xl shadow-xl border border-gray-200 p-2"
                sideOffset={8}
              >
                <DropdownMenu.Item
                  onClick={onExport}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-100 cursor-pointer outline-none"
                >
                  <Download className="size-4 text-gray-700" />
                  <span className="text-sm text-gray-900">Export as PNG</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </LiquidGlass>
    </div>
  );
}