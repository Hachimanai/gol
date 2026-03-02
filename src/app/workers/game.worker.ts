/// <reference lib="webworker" />

import { GameLogic } from './game-logic';
import { GameRenderer } from './game-renderer';
import { WorkerCommand, WorkerResponse, WorkerResponseType } from '../models/worker-messages.model';

const engine = new GameLogic();
const renderer = new GameRenderer();

let isRunning = false;
let speed = 16;
let timeoutId: any = null;

// On garde une trace de la config pour le rendu
let rows = 0;
let columns = 0;
let cellSize = 2;

addEventListener('message', ({ data }: { data: WorkerCommand }) => {
  const { type, payload } = data;

  switch (type) {
    case 'INITIALIZE':
      stopLoop();
      rows = payload.rows;
      columns = payload.columns;
      if (payload.cellSize) cellSize = payload.cellSize;
      engine.initialize(rows, columns, payload.initialDensity);
      sendResponse('INITIALIZED');
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      break;

    case 'START':
      if (payload?.speed) speed = payload.speed;
      startLoop();
      break;

    case 'STOP':
      stopLoop();
      break;

    case 'SET_SPEED':
      speed = payload.speed;
      break;

    case 'NEXT_GEN':
      engine.computeNextGeneration();
      const state = engine.getState();
      renderer.drawDiff(state.added, state.removed, rows, columns, cellSize);
      sendResponse('GEN_COMPLETED');
      break;

    case 'TOGGLE_CELL':
      engine.toggleCell(payload.x, payload.y);
      const isNowAlive = engine.getState().grid[payload.y * columns + payload.x] === 1;
      renderer.drawCell(payload.x, payload.y, isNowAlive, rows, columns, cellSize);
      sendResponse('STATE_UPDATED');
      break;

    case 'SET_CELL':
      engine.setCell(payload.x, payload.y, payload.isAlive);
      renderer.drawCell(payload.x, payload.y, payload.isAlive, rows, columns, cellSize);
      sendResponse('STATE_UPDATED');
      break;

    case 'RANDOMIZE':
      engine.randomize(payload.density);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED');
      break;

    case 'APPLY_PRESET':
      engine.applyPreset(payload.cells);
      renderer.drawFull(engine.getState().grid, rows, columns, cellSize);
      sendResponse('STATE_UPDATED');
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
      sendResponse('STATE_UPDATED');
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

  const start = performance.now();
  engine.computeNextGeneration();
  
  const state = engine.getState();
  renderer.drawDiff(state.added, state.removed, rows, columns, cellSize);
  
  sendResponse('GEN_COMPLETED');
  const end = performance.now();

  const workTime = end - start;
  const nextDelay = Math.max(0, speed - workTime);

  timeoutId = setTimeout(tick, nextDelay);
}

function sendResponse(type: WorkerResponseType) {
  const state = engine.getState();
  
  // Note: On continue d'envoyer la grille pour que le service garde son état (stats, populationHistory)
  // Même si le rendu est déporté.
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
}
