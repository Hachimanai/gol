export interface Cell {
  x: number;
  y: number;
  isAlive: boolean;
}

export type ResizeMode = 'fit' | 'fill' | 'fixed';

export interface Viewport {
  x: number; // Offset horizontal (pan)
  y: number; // Offset vertical (pan)
  zoom: number; // Facteur d'échelle
}

/**
 * Grid est maintenant représenté par un tableau à plat de booleans
 * pour des performances optimales lors des itérations et du rendu.
 */
export type GridState = Uint8Array;

export interface GameTheme {
  name: string;
  alive: string;
  dead: string;
  grid: string;
  // UI Colors
  primary: string;    /* Accent color (buttons, Gen count) */
  background: string; /* Global background */
  surface: string;    /* Header background */
  text: string;       /* Main text color */
}

export interface GameConfig {
  rows: number;
  columns: number;
  speed: number;
  initialDensity: number;
  resizeMode: ResizeMode;
  cellSize: number;
  theme: GameTheme;
}

export interface Preset {
  name: string;
  description: string;
  cells: { x: number; y: number }[];
}
