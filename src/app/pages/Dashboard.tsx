import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Grid3x3, MoreVertical, Trash2, Edit, Moon, Sun, Flame, Layout, Brain, Lightbulb, GitBranch, Columns } from "lucide-react";
import { boardStore } from "../store/boardStore";
import { Board } from "../types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// ── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "blank",
    name: "Blank Board",
    icon: Layout,
    description: "Start from scratch",
    color: "#6b7280",
    data: {},
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    icon: Brain,
    description: "Sticky notes ready to go",
    color: "#ef4444",
    data: {
      stickyNotes: [
        { id: "t1", x: 120, y: 80, width: 200, height: 160, color: "#FEF3C7", text: "💡 Main Idea", zIndex: 1 },
        { id: "t2", x: 360, y: 80, width: 200, height: 160, color: "#DBEAFE", text: "🔍 Research", zIndex: 2 },
        { id: "t3", x: 600, y: 80, width: 200, height: 160, color: "#D1FAE5", text: "✅ Action Items", zIndex: 3 },
        { id: "t4", x: 120, y: 280, width: 200, height: 160, color: "#FCE7F3", text: "🚧 Blockers", zIndex: 4 },
        { id: "t5", x: 360, y: 280, width: 200, height: 160, color: "#E0E7FF", text: "🎯 Goals", zIndex: 5 },
        { id: "t6", x: 600, y: 280, width: 200, height: 160, color: "#FED7AA", text: "📅 Timeline", zIndex: 6 },
      ],
    },
  },
  {
    id: "moodboard",
    name: "Mood Board",
    icon: Lightbulb,
    description: "Visual inspiration layout",
    color: "#f97316",
    data: {
      stickyNotes: [
        { id: "m1", x: 80, y: 60, width: 220, height: 120, color: "#FCE7F3", text: "🎨 Colour Palette", zIndex: 1 },
        { id: "m2", x: 340, y: 60, width: 220, height: 120, color: "#DBEAFE", text: "✍️ Typography", zIndex: 2 },
        { id: "m3", x: 600, y: 60, width: 220, height: 120, color: "#FEF3C7", text: "📸 Imagery", zIndex: 3 },
        { id: "m4", x: 80, y: 220, width: 460, height: 120, color: "#D1FAE5", text: "🌟 Overall Vibe & Direction", zIndex: 4 },
      ],
    },
  },
  {
    id: "mindmap",
    name: "Mind Map",
    icon: GitBranch,
    description: "Central idea with branches",
    color: "#8b5cf6",
    data: {
      stickyNotes: [
        { id: "mm1", x: 340, y: 180, width: 200, height: 100, color: "#E0E7FF", text: "🧠 Central Topic", zIndex: 1 },
        { id: "mm2", x: 80, y: 80, width: 160, height: 80, color: "#FEF3C7", text: "Branch 1", zIndex: 2 },
        { id: "mm3", x: 620, y: 80, width: 160, height: 80, color: "#DBEAFE", text: "Branch 2", zIndex: 3 },
        { id: "mm4", x: 80, y: 300, width: 160, height: 80, color: "#D1FAE5", text: "Branch 3", zIndex: 4 },
        { id: "mm5", x: 620, y: 300, width: 160, height: 80, color: "#FCE7F3", text: "Branch 4", zIndex: 5 },
      ],
    },
  },
  {
    id: "kanban",
    name: "Kanban Board",
    icon: Columns,
    description: "To Do / In Progress / Done",
    color: "#10b981",
    data: {
      stickyNotes: [
        { id: "k1", x: 60, y: 40, width: 200, height: 50, color: "#FEF3C7", text: "📋 TO DO", zIndex: 1 },
        { id: "k2", x: 300, y: 40, width: 200, height: 50, color: "#DBEAFE", text: "⚙️ IN PROGRESS", zIndex: 2 },
        { id: "k3", x: 540, y: 40, width: 200, height: 50, color: "#D1FAE5", text: "✅ DONE", zIndex: 3 },
        { id: "k4", x: 60, y: 120, width: 200, height: 100, color: "#FEF3C7", text: "Task 1", zIndex: 4 },
        { id: "k5", x: 60, y: 240, width: 200, height: 100, color: "#FEF3C7", text: "Task 2", zIndex: 5 },
        { id: "k6", x: 300, y: 120, width: 200, height: 100, color: "#DBEAFE", text: "Task 3", zIndex: 6 },
        { id: "k7", x: 540, y: 120, width: 200, height: 100, color: "#D1FAE5", text: "Task 4", zIndex: 7 },
      ],
    },
  },
];

export function Dashboard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [promptData, setPromptData] = useState<{title: string; value: string; onConfirm: (val: string) => void} | null>(null);
  const [confirmData, setConfirmData] = useState<{title: string; onConfirm: () => void} | null>(null);
  const [dark, setDark] = useState(() => localStorage.getItem("flaimboard-theme") === "dark");
  const navigate = useNavigate();

  useEffect(() => { localStorage.setItem("flaimboard-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { setBoards(boardStore.getBoards()); }, []);

  const handleCreateBoard = () => setShowTemplateModal(true);

  const handleSelectTemplate = (templateId: string) => {
    setShowTemplateModal(false);
    setPromptData({
      title: "Enter board name:",
      value: "",
      onConfirm: (name) => {
        if (!name) return;
        const template = TEMPLATES.find((t) => t.id === templateId);
        // Deep-clone template data and assign fresh unique IDs so multiple boards don't clash
        let templateData: any = {};
        if (template && template.data) {
          const base = Date.now();
          templateData = JSON.parse(JSON.stringify(template.data));
          if (Array.isArray(templateData.stickyNotes)) {
            templateData.stickyNotes = templateData.stickyNotes.map((n: any, i: number) => ({
              ...n,
              id: `${base}_${i}`,
            }));
          }
          if (Array.isArray(templateData.shapes)) {
            templateData.shapes = templateData.shapes.map((sh: any, i: number) => ({
              ...sh,
              id: `${base}_sh_${i}`,
            }));
          }
        }
        const newBoard = boardStore.createBoard(name, templateData);
        setBoards(boardStore.getBoards());
        const msg = template?.id !== "blank" ? `Board created from ${template?.name} template!` : "Board created!";
        toast.success(msg);
        navigate(`/board/${newBoard.id}`);
      }
    });
  };

  const handleDeleteBoard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmData({
      title: "Delete this board?",
      onConfirm: () => {
        boardStore.deleteBoard(id);
        setBoards(boardStore.getBoards());
        toast.success("Board deleted");
      }
    });
  };

  const handleRenameBoard = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromptData({
      title: "Enter new name:",
      value: board.name,
      onConfirm: (name) => {
        if (name && name !== board.name) {
          boardStore.updateBoard(board.id, { name });
          setBoards(boardStore.getBoards());
          toast.success("Board renamed");
        }
      }
    });
  };

  const filteredBoards = boards.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const t = {
    bg: dark ? "bg-gray-950" : "bg-gradient-to-br from-red-50 via-rose-50 to-orange-50",
    header: dark ? "bg-gray-900/80 border-gray-800" : "bg-white/80 border-white/50",
    title: dark ? "text-white" : "text-gray-900",
    subtitle: dark ? "text-gray-400" : "text-gray-600",
    searchBg: dark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-red-400",
    sectionTitle: dark ? "text-gray-200" : "text-gray-900",
    count: dark ? "text-gray-500" : "text-gray-500",
    cardBg: dark ? "bg-gray-900 hover:bg-gray-800 border border-gray-800" : "bg-white hover:shadow-xl",
    cardTitle: dark ? "text-gray-100" : "text-gray-900",
    cardSub: dark ? "text-gray-500" : "text-gray-500",
    thumbBg: dark ? "from-gray-800 to-gray-700" : "from-gray-50 to-gray-100",
    thumbText: dark ? "text-gray-500" : "text-gray-400",
    menuBg: dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
    menuItem: dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50",
    emptyText: dark ? "text-gray-600" : "text-gray-500",
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.bg}`}>

      {/* Header */}
      <header className={`border-b backdrop-blur-lg transition-colors duration-300 ${t.header}`}>
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="size-7" style={{ color: "#ef4444" }} />
                  <h1 className={`text-3xl tracking-tight font-bold ${t.title}`}>Flame Board</h1>
                </div>
                <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #ef4444, #f97316)" }} />
              </div>
              <p className={`text-sm mt-1 ${t.subtitle}`}>Your infinite AI-powered whiteboard</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <div onClick={() => setDark(!dark)} className="cursor-pointer select-none"
                style={{ position: "relative", width: 64, height: 32, borderRadius: 999, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: dark ? "rgba(30,20,60,0.55)" : "rgba(255,255,255,0.35)", border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.7)", boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08)" : "0 4px 16px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.8)", transition: "all 0.3s ease" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 999, pointerEvents: "none", background: "linear-gradient(to bottom,rgba(255,255,255,0.25) 0%,transparent 60%)" }} />
                <div style={{ position: "absolute", inset: 3, borderRadius: 999, background: dark ? "linear-gradient(135deg,#ef444455,#f9731655)" : "linear-gradient(135deg,#f9731655,#ec489955)", transition: "background 0.3s ease" }} />
                <div style={{ position: "absolute", top: 4, left: dark ? "calc(100% - 28px)" : "4px", width: 24, height: 24, borderRadius: "50%", background: dark ? "linear-gradient(135deg,#f87171,#fb923c)" : "linear-gradient(135deg,#fb923c,#f472b6)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1),background 0.3s ease" }}>
                  {dark ? <Moon style={{ width: 12, height: 12, color: "white" }} /> : <Sun style={{ width: 12, height: 12, color: "white" }} />}
                </div>
              </div>

              <button onClick={handleCreateBoard}
                className="flex items-center gap-2 rounded-full px-6 py-3 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm font-medium"
                style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}>
                <Plus className="size-4" /> New Board
              </button>
            </div>
          </div>

          <div className="mt-6 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 ${dark ? "text-gray-500" : "text-gray-400"}`} />
            <input type="text" placeholder="Search boards..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-2xl border pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400/20 transition-colors ${t.searchBg}`} />
          </div>
        </div>
      </header>

      {/* Board Grid */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <h2 className={`text-xl font-semibold ${t.sectionTitle}`}>All Boards</h2>
          <span className={`text-sm ${t.count}`}>({filteredBoards.length})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBoards.map((board) => (
            <BoardCard key={board.id} board={board} dark={dark} t={t}
              onClick={() => navigate(`/board/${board.id}`)}
              onDelete={(e) => handleDeleteBoard(board.id, e)}
              onRename={(e) => handleRenameBoard(board, e)} />
          ))}

          {filteredBoards.length === 0 && (
            <div className={`col-span-full flex flex-col items-center justify-center py-20 ${t.emptyText}`}>
              <Flame className="size-16 mb-4 opacity-30" style={{ color: "#ef4444" }} />
              <p className="text-lg mb-2 font-medium">No boards yet</p>
              <p className="text-sm">Create your first board to start brainstorming</p>
              <button onClick={handleCreateBoard} className="mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-white text-sm font-medium hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}>
                <Plus className="size-4" /> Create your first board
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Prompt Modal */}
      {promptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPromptData(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className={`relative w-[400px] max-w-full rounded-2xl shadow-2xl p-6 z-10 ${dark ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>
            <h2 className={`text-lg font-semibold mb-4 ${dark ? "text-white" : "text-gray-900"}`}>{promptData.title}</h2>
            <input autoFocus type="text" defaultValue={promptData.value} placeholder="..." className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-colors ${dark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setPromptData(null); promptData.onConfirm(e.currentTarget.value); }
                if (e.key === "Escape") setPromptData(null);
              }}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setPromptData(null)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dark ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}>Cancel</button>
              <button onClick={(e) => { const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement; setPromptData(null); promptData.onConfirm(input.value); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md hover:scale-105 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #ef4444, #f97316)" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmData(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()} className={`relative w-[400px] max-w-full rounded-2xl shadow-2xl p-6 z-10 ${dark ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>
            <h2 className={`text-lg font-semibold mb-6 ${dark ? "text-white" : "text-gray-900"}`}>{confirmData.title}</h2>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmData(null)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dark ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}>Cancel</button>
              <button onClick={() => { setConfirmData(null); confirmData.onConfirm(); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md hover:scale-105 active:scale-95 transition-all bg-red-500 hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowTemplateModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
            className={`relative w-[600px] max-w-[95vw] rounded-3xl shadow-2xl p-8 z-10 ${dark ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>
            <h2 className={`text-2xl font-bold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>Choose a Template</h2>
            <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>Start with a pre-built layout or a blank canvas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                return (
                  <button key={tmpl.id} onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${dark ? "border-gray-700 hover:border-gray-500 bg-gray-800" : "border-gray-100 hover:border-red-200 bg-gray-50"}`}>
                    <div className="p-2 rounded-xl" style={{ background: tmpl.color + "22" }}>
                      <Icon className="size-5" style={{ color: tmpl.color }} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{tmpl.name}</p>
                      <p className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>{tmpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BoardCardProps {
  board: Board; dark: boolean; t: Record<string, string>;
  onClick: () => void; onDelete: (e: React.MouseEvent) => void; onRename: (e: React.MouseEvent) => void;
}

function BoardCard({ board, dark, t, onClick, onDelete, onRename }: BoardCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const elementCount = board.strokes.length + board.stickyNotes.length + board.shapes.length + board.textElements.length + board.arrows.length;

  return (
    <div onClick={onClick} className={`group relative cursor-pointer rounded-2xl p-5 shadow-md transition-all hover:-translate-y-1 ${t.cardBg}`}>
      <div className={`aspect-video rounded-xl bg-gradient-to-br mb-4 flex items-center justify-center relative overflow-hidden ${t.thumbBg}`}>
        {(board as any).thumbnail ? (
          <img src={(board as any).thumbnail} alt="Board preview" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            {board.background === "dots" && (
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle, ${dark ? "#4b5563" : "#94a3b8"} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
            )}
            {board.background === "lines" && (
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(${dark ? "#4b5563" : "#94a3b8"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "#4b5563" : "#94a3b8"} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
            )}
            <span className={`text-sm ${t.thumbText}`}>{elementCount === 0 ? "Empty board" : `${elementCount} elements`}</span>
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-60" style={{ background: "linear-gradient(to right,#ef4444,#f97316,#fbbf24)" }} />
      </div>
      <div className="space-y-1">
        <h3 className={`text-base font-semibold truncate ${t.cardTitle}`}>{board.name}</h3>
        <p className={`text-xs ${t.cardSub}`}>Edited {formatDistanceToNow(board.lastEdited, { addSuffix: true })}</p>
      </div>
      <div className="absolute top-4 right-4">
        <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className={`opacity-0 group-hover:opacity-100 rounded-lg p-2 shadow-md transition-opacity ${dark ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50"}`}>
          <MoreVertical className={`size-4 ${dark ? "text-gray-300" : "text-gray-600"}`} />
        </button>
        {showMenu && (
          <div className={`absolute right-0 top-12 w-48 rounded-xl shadow-xl border py-2 z-10 ${t.menuBg}`}>
            <button onClick={onRename} className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${t.menuItem}`}><Edit className="size-4" />Rename</button>
            <button onClick={onDelete} className={`flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 ${dark ? "hover:bg-gray-700" : "hover:bg-red-50"}`}><Trash2 className="size-4" />Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
