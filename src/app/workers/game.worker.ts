/// <reference lib="webworker" />

import { GameLogic } from './game-logic';
import { GameRenderer } from './game-renderer';
import { WorkerCommand, WorkerResponse, WorkerResponseType } from '../models/worker-messages.model';

const engine = new GameLogic();
const renderer = new GameRenderer();

let isRunning = false;
let timeoutId: any = null;

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
    case 'INITIALIZE':
      stopLoop();
      rows = payload.rows;
      columns = payload.columns;
      if (payload.cellSize) cellSize = payload.cellSize;
      engine.initialize(rows, columns, payload.initialDensity);
      sendResponse('INITIALIZED', true); // Force UI update
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      break;

    case 'START':
      startLoop();
      break;

    case 'STOP':
      stopLoop();
      break;

    case 'NEXT_GEN':
      engine.computeNextGeneration();
      const state = engine.getState();
      renderer.drawDiff(state.added, state.removed, rows, columns, cellSize);
      sendResponse('GEN_COMPLETED', true); // Force UI update
      break;

    case 'TOGGLE_CELL':
      engine.toggleCell(payload.x, payload.y);
      const isNowAlive = engine.getState().grid[payload.y * columns + payload.x] === 1;
      renderer.drawCell(payload.x, payload.y, isNowAlive, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;

    case 'SET_CELL':
      engine.setCell(payload.x, payload.y, payload.isAlive);
      renderer.drawCell(payload.x, payload.y, payload.isAlive, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;

    case 'RANDOMIZE':
      engine.randomize(payload.density);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;

    case 'APPLY_PRESET':
      engine.applyPreset(payload.cells);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;

    case 'RESIZE':
      rows = payload.rows;
      columns = payload.columns;
      if (payload.cellSize) cellSize = payload.cellSize;
      if (payload.width && payload.height) {
        renderer.resize(payload.width, payload.height);
      }
      engine.resize(rows, columns);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED', true);
      break;

    case 'TRANSFER_CANVAS':
      renderer.setCanvas(payload.canvas, payload.width, payload.height, payload.theme);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      break;

    case 'UPDATE_THEME':
      renderer.updateTheme(payload);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      break;
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

function sendResponse(type: WorkerResponseType, force: boolean = false) {
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

  postMessage(response, [gridCopy.buffer] as any);
  lastUiUpdateTime = now;
}
