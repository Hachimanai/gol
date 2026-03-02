/// <reference lib="webworker" />

import { GameLogic } from './game-logic';
import { GameRenderer } from './game-renderer';
import { WebGLGameRenderer } from './webgl-renderer';
import { 
  WorkerCommand, 
  WorkerResponse, 
  WorkerResponseType, 
  InitializePayload, 
  CellPayload, 
  PresetPayload, 
  ResizePayload, 
  TransferCanvasPayload, 
  UpdateThemePayload 
} from '../models/worker-messages.model';

const engine = new GameLogic();
let renderer2d: GameRenderer | null = null;
let rendererWebGL: WebGLGameRenderer | null = null;
let currentRendererType: '2d' | 'webgl' = '2d';

let isRunning = false;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

// Configuration de la grille
let rows = 0;
let columns = 0;
let cellSize = 2;

// Throttling pour l'UI (60 FPS max pour les stats)
let lastUiUpdateTime = 0;
const UI_UPDATE_INTERVAL = 1000 / 60; // 16.6ms

addEventListener('message', ({ data }: { data: WorkerCommand }) => {
  const { type, payload } = data;

  switch (type) {
    case 'TRANSFER_CANVAS': {
      const p = payload as TransferCanvasPayload;
      currentRendererType = p.rendererType;
      
      if (currentRendererType === 'webgl') {
        rendererWebGL = new WebGLGameRenderer();
        rendererWebGL.setCanvas(p.canvas, p.width, p.height, p.theme);
        if (columns > 0 && rows > 0) {
          rendererWebGL.setupGrid(columns, rows);
        }
      } else {
        renderer2d = new GameRenderer();
        renderer2d.setCanvas(p.canvas, p.width, p.height, p.theme);
      }
      
      renderAll();
      break;
    }

    case 'INITIALIZE': {
      stopLoop();
      const p = payload as InitializePayload & { cellSize?: number };
      rows = p.rows;
      columns = p.columns;
      if (p.cellSize) {
        cellSize = p.cellSize;
        if (currentRendererType === 'webgl' && rendererWebGL) {
          rendererWebGL.updateCellSize(cellSize);
        }
      }
      
      engine.initialize(rows, columns, p.initialDensity);
      
      if (currentRendererType === 'webgl' && rendererWebGL) {
        rendererWebGL.setupGrid(columns, rows);
      }
      
      sendResponse('INITIALIZED', true);
      renderAll();
      break;
    }

    case 'START':
      startLoop();
      break;

    case 'STOP':
      stopLoop();
      break;

    case 'NEXT_GEN': {
      engine.computeNextGeneration();
      renderFrame();
      sendResponse('GEN_COMPLETED', true);
      break;
    }

    case 'TOGGLE_CELL': {
      const p = payload as { x: number, y: number };
      engine.toggleCell(p.x, p.y);
      renderAll(); // Pour simplifier, on redessine tout
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'SET_CELL': {
      const p = payload as CellPayload;
      engine.setCell(p.x, p.y, !!p.isAlive);
      renderAll();
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'RANDOMIZE': {
      const p = payload as { density: number };
      engine.randomize(p.density);
      renderAll();
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'APPLY_PRESET': {
      const p = payload as PresetPayload;
      engine.applyPreset(p.cells);
      renderAll();
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'RESIZE': {
      const p = payload as ResizePayload & { cellSize?: number, width?: number, height?: number };
      rows = p.rows;
      columns = p.columns;
      if (p.cellSize) {
        cellSize = p.cellSize;
        if (currentRendererType === 'webgl' && rendererWebGL) {
          rendererWebGL.updateCellSize(cellSize);
        }
      }
      
      if (p.width && p.height) {
        if (currentRendererType === 'webgl' && rendererWebGL) {
          rendererWebGL.resize(p.width, p.height);
        } else if (renderer2d) {
          renderer2d.resize(p.width, p.height);
        }
      }
      
      engine.resize(rows, columns);
      
      if (currentRendererType === 'webgl' && rendererWebGL) {
        rendererWebGL.setupGrid(columns, rows);
      }
      
      renderAll();
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'UPDATE_THEME': {
      const p = payload as UpdateThemePayload;
      if (currentRendererType === 'webgl' && rendererWebGL) {
        rendererWebGL.updateTheme(p);
      } else if (renderer2d) {
        renderer2d.updateTheme(p);
      }
      renderAll();
      break;
    }
  }
});

function renderAll() {
  const state = engine.getState();
  if (currentRendererType === 'webgl' && rendererWebGL) {
    rendererWebGL.render(state.grid);
  } else if (renderer2d) {
    renderer2d.drawFull(state.grid, rows, columns, cellSize);
  }
}

function renderFrame() {
  const state = engine.getState();
  
  if (currentRendererType === 'webgl' && rendererWebGL) {
    rendererWebGL.render(state.grid);
  } else if (renderer2d) {
    const totalCellsCount = rows * columns;
    const changesCount = state.added.length + state.removed.length;
    
    // Stratégie hybride pour le Canvas 2D
    if (changesCount > totalCellsCount * 0.15) {
      renderer2d.drawFull(state.grid, rows, columns, cellSize);
    } else {
      renderer2d.drawDiff(state.added, state.removed, rows, columns, cellSize);
    }
  }
}

function startLoop() {
  if (isRunning) return;
  isRunning = true;
  tick();
}

function stopLoop() {
  isRunning = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function tick() {
  if (!isRunning) return;

  engine.computeNextGeneration();
  renderFrame();
  
  sendResponse('GEN_COMPLETED');
  timeoutId = setTimeout(tick, 0);
}

function sendResponse(type: WorkerResponseType, force = false) {
  const now = performance.now();
  
  if (!force && (now - lastUiUpdateTime < UI_UPDATE_INTERVAL)) {
    return;
  }

  const state = engine.getState();
  const gridCopy = new Uint8Array(state.grid);
  
  const response: WorkerResponse = {
    type,
    payload: {
      grid: gridCopy,
      generation: state.generation,
      population: state.population,
      added: state.added,
      removed: state.removed
    }
  };

  postMessage(response, [gridCopy.buffer] as unknown as Transferable[]);
  lastUiUpdateTime = now;
}
