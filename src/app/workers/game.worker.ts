/// <reference lib="webworker" />

import { GameLogic } from './game-logic';
import { GameRenderer } from './game-renderer';
import { WorkerCommand, WorkerResponse, WorkerResponseType, InitializePayload, CellPayload, PresetPayload, ResizePayload, TransferCanvasPayload, UpdateThemePayload } from '../models/worker-messages.model';

const engine = new GameLogic();
const renderer = new GameRenderer();

let isRunning = false;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

// On garde une trace de la config pour le rendu
let rows = 0;
let columns = 0;
let cellSize = 2;

// Throttling pour l'UI (60 FPS max pour les stats)
let lastUiUpdateTime = 0;
const UI_UPDATE_INTERVAL = 1000 / 60; // 16.6ms

addEventListener('message', ({ data }: { data: WorkerCommand }) => {
  const { type, payload } = data;

  switch (type) {
    case 'INITIALIZE': {
      stopLoop();
      const p = payload as InitializePayload & { cellSize?: number };
      rows = p.rows;
      columns = p.columns;
      if (p.cellSize) cellSize = p.cellSize;
      engine.initialize(rows, columns, p.initialDensity);
      sendResponse('INITIALIZED', true); // Force UI update
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
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
      const state = engine.getState();
      renderer.drawDiff(state.added, state.removed, rows, columns, cellSize);
      sendResponse('GEN_COMPLETED', true); // Force UI update
      break;
    }

    case 'TOGGLE_CELL': {
      const p = payload as { x: number, y: number };
      engine.toggleCell(p.x, p.y);
      const isNowAlive = engine.getState().grid[p.y * columns + p.x] === 1;
      renderer.drawCell(p.x, p.y, isNowAlive, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'SET_CELL': {
      const p = payload as CellPayload;
      const isAlive = !!p.isAlive;
      engine.setCell(p.x, p.y, isAlive);
      renderer.drawCell(p.x, p.y, isAlive, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'RANDOMIZE': {
      const p = payload as { density: number };
      engine.randomize(p.density);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'APPLY_PRESET': {
      const p = payload as PresetPayload;
      engine.applyPreset(p.cells);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'RESIZE': {
      const p = payload as ResizePayload & { cellSize?: number, width?: number, height?: number };
      rows = p.rows;
      columns = p.columns;
      if (p.cellSize) cellSize = p.cellSize;
      if (p.width && p.height) {
        renderer.resize(p.width, p.height);
      }
      engine.resize(rows, columns);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;
    }

    case 'TRANSFER_CANVAS': {
      const p = payload as TransferCanvasPayload;
      renderer.setCanvas(p.canvas, p.width, p.height, p.theme);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      break;
    }

    case 'UPDATE_THEME': {
      const p = payload as UpdateThemePayload;
      renderer.updateTheme(p);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      break;
    }
  }
});

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

  // Calcul et rendu direct (vitesse maximale)
  engine.computeNextGeneration();
  const state = engine.getState();
  renderer.drawDiff(state.added, state.removed, rows, columns, cellSize);
  
  // Notification UI avec throttling (60Hz)
  sendResponse('GEN_COMPLETED');

  // Relance immédiate
  timeoutId = setTimeout(tick, 0);
}

function sendResponse(type: WorkerResponseType, force = false) {
  const now = performance.now();
  
  // On ne s'envoie à l'UI que si forcé (action manuelle) ou si l'intervalle est respecté
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
