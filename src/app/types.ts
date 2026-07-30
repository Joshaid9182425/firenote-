export type Tool = 
  | 'pen' 
  | 'eraser' 
  | 'sticky' 
  | 'shape' 
  | 'text' 
  | 'image' 
  | 'lasso' 
  | 'arrow'
  | 'pan'
  | 'select'
  | 'table';

export type PenType = 'pen' | 'pencil' | 'marker' | 'highlighter-yellow' | 'highlighter-green' | 'highlighter-blue' | 'chalk' | 'calligraphy';

export type ShapeType = 'rectangle' | 'circle' | 'rounded-rect' | 'diamond' | 'cloud' | 'image';

export type BackgroundType = 'dots' | 'lines' | 'blank' | 'graph';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  penType: PenType;
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
  zIndex: number;
  headerText?: string;
  headerBold?: boolean;
  headerColor?: string;
  textColor?: string;
  textSize?: number;
}

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeColor: string;
  zIndex: number;
  imageUrl?: string;
}

export interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  zIndex: number;
}

export interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  zIndex: number;
}

export interface TableCell {
  content: string;
  width: number;
  height: number;
}

export interface Table {
  id: string;
  x: number;
  y: number;
  rows: number;
  cols: number;
  cells: TableCell[][];
  zIndex: number;
}

export interface Board {
  id: string;
  name: string;
  thumbnail?: string;
  lastEdited: Date;
  strokes: Stroke[];
  stickyNotes: StickyNote[];
  shapes: Shape[];
  textElements: TextElement[];
  arrows: Arrow[];
  tables: Table[];
  background: BackgroundType;
  darkMode: boolean;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}
