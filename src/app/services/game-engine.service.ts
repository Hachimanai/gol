import {
  Injectable,
  signal,
  effect,
  OnDestroy,
  untracked,
} from '@angular/core';
import { GameConfig, GameTheme } from '../models/game.model';
import { PRESETS } from '../constants/presets';
import { THEMES } from '../constants/themes';
import { WorkerCommand, WorkerCommandType, WorkerResponse, WorkerResponseType } from '../models/worker-messages.model';

@Injectable({
  providedIn: 'root',
})
export class GameEngineService implements OnDestroy {
  // Signals exposés pour l'UI
  readonly grid = signal<Uint8Array>(new Uint8Array(0));
  readonly isRunning = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly generation = signal<number>(0);
  readonly fps = signal<number>(0);
  readonly populationHistory = signal<number[]>([0]);
  readonly config = signal<GameConfig>({
    rows: 60,
    columns: 80,
    speed: 16, // Proche de 60 FPS (1000/60)
    initialDensity: 0.3,
    resizeMode: 'fill',
    cellSize: 10,
    theme: THEMES[0],
  });

  private worker: Worker | null = null;
  private lastFrameTime = 0;
  private readonly maxHistory = 50;

  constructor() {
    this.initWorker();

    // Réaction aux changements de configuration (vitesse, thème)
    effect(() => {
      const config = this.config();
      this.updateWorkerSpeed(config.speed);
    });
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        // Création du Worker
        this.worker = new Worker(
          new URL('../workers/game.worker', import.meta.url)
        );

        // Gestion des messages reçus du Worker
        this.worker.onmessage = ({ data }: { data: WorkerResponse }) => {
          this.handleWorkerResponse(data);
        };

        // Gestion des erreurs critiques du Worker
        this.worker.onerror = (err) => {
          this.handleWorkerError(err);
        };

        this.worker.onmessageerror = (err) => {
          this.handleWorkerError(err);
        };

        // Initialisation technique : ON FORCE UNE GRILLE VIDE (initialDensity: 0)
        // même si la config par défaut est à 0.3 pour l'UI.
        const { rows, columns } = this.config();
        this.sendCommand('INITIALIZE', { rows, columns, initialDensity: 0 });
        this.error.set(null);
      } catch (e) {
        this.error.set('Failed to initialize Game Engine Worker.');
        console.error(e);
      }
    } else {
      this.error.set('Web Workers are not supported in this browser.');
      console.error('Web Workers are not supported in this environment.');
    }
  }

  private handleWorkerResponse(response: WorkerResponse) {
    const { type, payload } = response;

    switch (type) {
      case 'GEN_COMPLETED':
      case 'STATE_UPDATED':
        // Mise à jour de la grille et des stats
        this.grid.set(payload.grid);
        this.generation.set(payload.generation);
        this.updatePopulationHistory(payload.population);
        this.calculateFps();
        break;

      case 'INITIALIZED':
        this.grid.set(payload.grid);
        this.generation.set(0);
        this.populationHistory.set([payload.population]);
        break;
    }
  }

  private handleWorkerError(error: ErrorEvent | MessageEvent) {
    console.error('GameEngine Worker Error:', error);
    this.error.set('Game Engine encountered a critical error.');
    this.stop(); // Arrêt de sécurité
  }

  private calculateFps() {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime;
      const currentFps = 1000 / delta;
      this.fps.update((f) => (f === 0 ? currentFps : f * 0.9 + currentFps * 0.1));
    }
    this.lastFrameTime = now;
  }

  private updatePopulationHistory(newPop: number) {
    this.populationHistory.update((hist) => {
      const isNewGen = this.isRunning();
      if (isNewGen) {
        const newHist = [...hist, newPop];
        if (newHist.length > this.maxHistory) newHist.shift();
        return newHist;
      } else {
        // En mode édition, on remplace juste la dernière valeur
        const newHist = [...hist];
        newHist[newHist.length - 1] = newPop;
        return newHist;
      }
    });
  }

  private sendCommand(type: WorkerCommandType, payload?: any) {
    if (this.worker) {
      const command: WorkerCommand = { type, payload };
      this.worker.postMessage(command);
    }
  }

  ngOnDestroy() {
    this.stop();
    this.worker?.terminate();
  }

  start(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.lastFrameTime = 0;
    this.sendCommand('START', { speed: this.config().speed });
  }

  stop(): void {
    if (!this.isRunning()) return;
    this.isRunning.set(false);
    this.fps.set(0);
    this.sendCommand('STOP');
  }

  reset(): void {
    this.stop();
    const { rows, columns } = this.config();
    this.sendCommand('INITIALIZE', { rows, columns, initialDensity: 0 });
  }

  updateSpeed(speed: number): void {
    this.config.update((c) => ({ ...c, speed }));
  }

  private updateWorkerSpeed(speed: number) {
    this.sendCommand('SET_SPEED', { speed });
  }

  updateTheme(theme: GameTheme): void {
    this.config.update((c) => ({ ...c, theme }));
  }

  randomize(density?: number): void {
    const d = density !== undefined ? density : this.config().initialDensity;
    this.sendCommand('RANDOMIZE', { density: d });
  }

  toggleCell(x: number, y: number): void {
    this.sendCommand('TOGGLE_CELL', { x, y });
  }

  setCellState(x: number, y: number, isAlive: boolean): void {
    this.sendCommand('SET_CELL', { x, y, isAlive });
  }

  nextGeneration(): void {
    this.sendCommand('NEXT_GEN');
  }

  applyPreset(presetName: string): void {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (preset) {
      this.sendCommand('APPLY_PRESET', { cells: preset.cells });
    }
  }

  updateDimensions(newRows: number, newCols: number): void {
    const currentConfig = untracked(() => this.config());
    if (currentConfig.resizeMode !== 'fill') return;

    if (newRows === currentConfig.rows && newCols === currentConfig.columns)
      return;

    this.config.update((c) => ({ ...c, rows: newRows, columns: newCols }));
    this.sendCommand('RESIZE', { rows: newRows, columns: newCols });
  }
}
