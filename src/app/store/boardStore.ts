import { Board } from "../types";

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
      boards[index] = { ...boards[index], ...updates, lastEdited: new Date() };
      this.saveBoards(boards);
    }
  },

  // Accept optional template data when creating a board
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
    return newBoard;
  },

  deleteBoard(id: string) {
    const boards = this.getBoards().filter((b) => b.id !== id);
    this.saveBoards(boards);
  },
};
