import { Board } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const STORAGE_KEY = "fluidboard_boards";

const defaultBoards: Board[] = [
  { id: "1", name: "Product Brainstorm", lastEdited: new Date("2026-03-01"), strokes: [], stickyNotes: [], shapes: [], textElements: [], arrows: [], tables: [], background: "dots", darkMode: false },
  { id: "2", name: "UX Research Notes", lastEdited: new Date("2026-02-28"), strokes: [], stickyNotes: [], shapes: [], textElements: [], arrows: [], tables: [], background: "dots", darkMode: false },
  { id: "3", name: "MUN Preparation", lastEdited: new Date("2026-02-27"), strokes: [], stickyNotes: [], shapes: [], textElements: [], arrows: [], tables: [], background: "lines", darkMode: false },
];

export const boardStore = {
  getBoards(): Board[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const boards = JSON.parse(stored);
        return boards.map((b: any) => ({ ...b, lastEdited: new Date(b.lastEdited) }));
      } catch (e) {
        console.error("Failed to parse stored boards:", e);
      }
    }
    this.saveBoards(defaultBoards);
    return defaultBoards;
  },

  async fetchRemoteBoards(): Promise<Board[] | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return null;

    try {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!data) return null;

      const remoteBoards: Board[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        background: row.background || "dots",
        darkMode: Boolean(row.dark_mode),
        thumbnail: row.thumbnail,
        lastEdited: new Date(row.updated_at),
        strokes: row.strokes || [],
        stickyNotes: row.sticky_notes || [],
        shapes: row.shapes || [],
        textElements: row.text_elements || [],
        arrows: row.arrows || [],
        tables: row.tables || [],
      }));

      this.saveBoards(remoteBoards);
      return remoteBoards;
    } catch (err) {
      console.error("Failed to fetch remote boards:", err);
      return null;
    }
  },

  saveBoards(boards: Board[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
  },

  getBoard(id: string): Board | undefined {
    return this.getBoards().find((b) => b.id === id);
  },

  updateBoard(id: string, updates: Partial<Board>) {
    const boards = this.getBoards();
    const index = boards.findIndex((b) => b.id === id);
    if (index !== -1) {
      const updatedBoard = { ...boards[index], ...updates, lastEdited: new Date() };
      boards[index] = updatedBoard;
      this.saveBoards(boards);
      this.syncBoardToRemote(updatedBoard);
    }
  },

  async syncBoardToRemote(board: Board) {
    if (!supabase || !isSupabaseConfigured) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    try {
      await supabase.from("boards").upsert({
        id: board.id,
        user_id: userId,
        name: board.name,
        background: board.background,
        dark_mode: board.darkMode,
        thumbnail: board.thumbnail,
        strokes: board.strokes,
        sticky_notes: board.stickyNotes,
        shapes: board.shapes,
        text_elements: board.textElements,
        arrows: board.arrows,
        tables: board.tables,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to sync board to Supabase:", err);
    }
  },

  createBoard(name: string, templateData: Partial<Board> = {}): Board {
    const boards = this.getBoards();
    const newBoard: Board = {
      id: Date.now().toString(),
      name,
      lastEdited: new Date(),
      strokes: [],
      stickyNotes: [],
      shapes: [],
      textElements: [],
      arrows: [],
      tables: [],
      background: "dots",
      darkMode: false,
      ...templateData,
    };
    boards.unshift(newBoard);
    this.saveBoards(boards);
    this.syncBoardToRemote(newBoard);
    return newBoard;
  },

  deleteBoard(id: string) {
    const boards = this.getBoards().filter((b) => b.id !== id);
    this.saveBoards(boards);
    this.deleteRemoteBoard(id);
  },

  async deleteRemoteBoard(id: string) {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from("boards").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to delete remote board:", err);
    }
  },
};
