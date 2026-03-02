export type WorkerCommandType = 
  | 'INITIALIZE' 
  | 'START'
  | 'STOP'
  | 'SET_SPEED'
  | 'NEXT_GEN' 
  | 'TOGGLE_CELL' 
  | 'SET_CELL'
  | 'RANDOMIZE'
  | 'APPLY_PRESET'
  | 'RESIZE'
  | 'TRANSFER_CANVAS'
  | 'UPDATE_THEME';

  export interface WorkerCommand {
  type: WorkerCommandType;
  payload?: any;
  }

  export interface TransferCanvasPayload {
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  theme: { alive: string, dead: string };
  }

  export interface UpdateThemePayload {
  alive: string;
  dead: string;
  }


export interface InitializePayload {
  rows: number;
  columns: number;
  initialDensity?: number;
}

export interface ResizePayload {
  rows: number;
  columns: number;
}

export interface CellPayload {
  x: number;
  y: number;
  isAlive?: boolean;
}

export interface PresetPayload {
  cells: { x: number; y: number }[];
}

export type WorkerResponseType = 
  | 'GEN_COMPLETED' 
  | 'INITIALIZED' 
  | 'STATE_UPDATED';

export interface WorkerResponse {
  type: WorkerResponseType;
  payload: {
    grid: Uint8Array;
    generation: number;
    population: number;
    added?: number[];   // Indices des cellules nées
    removed?: number[]; // Indices des cellules mortes
  };
}
