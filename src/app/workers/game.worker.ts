/// <reference lib="webworker" />

import { GameLogic } from './game-logic';
import { WorkerCommand, WorkerResponse, WorkerResponseType } from '../models/worker-messages.model';

const engine = new GameLogic();
let isRunning = false;
let speed = 16; // ms entre chaque génération (60 FPS)
let timeoutId: any = null;

addEventListener('message', ({ data }: { data: WorkerCommand }) => {
  const { type, payload } = data;

  switch (type) {
    case 'INITIALIZE':
      stopLoop();
      engine.initialize(payload.rows, payload.columns, payload.initialDensity);
      sendResponse('INITIALIZED');
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
      // Si la boucle tourne, on ne fait rien, elle s'adaptera au prochain tick
      break;

    case 'NEXT_GEN':
      // Calcul forcé d'une seule étape (manuel)
      engine.computeNextGeneration();
      sendResponse('GEN_COMPLETED');
      break;

    case 'TOGGLE_CELL':
      engine.toggleCell(payload.x, payload.y);
      sendResponse('STATE_UPDATED');
      break;

    case 'SET_CELL':
      engine.setCell(payload.x, payload.y, payload.isAlive);
      sendResponse('STATE_UPDATED');
      break;

    case 'RANDOMIZE':
      engine.randomize(payload.density);
      sendResponse('STATE_UPDATED');
      break;

    case 'APPLY_PRESET':
      engine.applyPreset(payload.cells);
      sendResponse('STATE_UPDATED');
      break;

    case 'RESIZE':
      engine.resize(payload.rows, payload.columns);
      sendResponse('STATE_UPDATED');
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
  sendResponse('GEN_COMPLETED');
  const end = performance.now();

  // On ajuste le prochain timeout pour compenser le temps de calcul
  const workTime = end - start;
  const nextDelay = Math.max(0, speed - workTime);

  timeoutId = setTimeout(tick, nextDelay);
}

function sendResponse(type: WorkerResponseType) {
  const state = engine.getState();
  
  // On crée une copie pour le transfert (Transferable)
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
