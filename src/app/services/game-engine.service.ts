import {
  Injectable,
  signal,
  effect,
  OnDestroy,
  untracked,
  computed,
} from '@angular/core';
import { GameConfig, GameTheme } from '../models/game.model';
import { PRESETS } from '../constants/presets';
import { THEMES } from '../constants/themes';
import {
  WorkerCommand,
  WorkerCommandType,
  WorkerResponse,
} from '../models/worker-messages.model';

import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameEngineService implements OnDestroy {
  // Signals exposés pour l'UI
  readonly grid = signal<Uint8Array>(new Uint8Array(0));
  readonly gridDiff$ = new Subject<{ added: number[]; removed: number[] }>();
  readonly fullRedraw$ = new Subject<void>();
  readonly isRunning = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly generation = signal<number>(0);
  readonly fps = signal<number>(0);
  readonly totalCells = computed(
    () => this.config().rows * this.config().columns,
  );
  readonly populationHistory = signal<number[]>([0]);
  readonly config = signal<GameConfig>({
    rows: 60,
    columns: 80,
    initialDensity: 0.3,
    resizeMode: 'fill',
    cellSize: 2,
    theme: THEMES[4],
  });

  private worker: Worker | null = null;
  private lastFrameTime = 0;
  private readonly maxHistory = 50;

  constructor() {
    this.initWorker();

    // Réaction aux changements de configuration (thème, cellSize)
    effect(() => {
      const config = this.config();
      this.updateWorkerTheme(config.theme);
    });
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        // Création du Worker
        this.worker = new Worker(
          new URL('../workers/game.worker', import.meta.url),
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
        const { rows, columns, cellSize } = this.config();
        this.sendCommand('INITIALIZE', {
          rows,
          columns,
          cellSize,
          initialDensity: 0,
        });
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

  transferCanvas(canvas: OffscreenCanvas, width: number, height: number) {
    if (this.worker) {
      const { theme } = this.config();
      const payload = {
        canvas,
        width,
        height,
        theme: { alive: theme.alive, dead: theme.dead },
      };
      this.worker.postMessage({ type: 'TRANSFER_CANVAS', payload }, [canvas]);
    }
  }

  private updateWorkerTheme(theme: GameTheme) {
    this.sendCommand('UPDATE_THEME', { alive: theme.alive, dead: theme.dead });
  }

  private handleWorkerResponse(response: WorkerResponse) {
    const { type, payload } = response;

    switch (type) {
      case 'GEN_COMPLETED':
        this.grid.set(payload.grid);
        this.generation.set(payload.generation);
        this.updatePopulationHistory(payload.population);
        this.calculateFps();

        // Notification chirurgicale uniquement pendant la simulation
        if (payload.added || payload.removed) {
          this.gridDiff$.next({
            added: payload.added || [],
            removed: payload.removed || [],
          });
        }
        break;

      case 'STATE_UPDATED':
        this.grid.set(payload.grid);
        this.generation.set(payload.generation);
        this.updatePopulationHistory(payload.population);
        // Force un rendu complet pour les actions manuelles, presets, etc.
        this.fullRedraw$.next();
        break;

      case 'INITIALIZED':
        this.grid.set(payload.grid);
        this.generation.set(0);
        this.populationHistory.set([payload.population]);
        // Force un rendu complet pour l'initialisation
        this.fullRedraw$.next();
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
      // On ignore les deltas nuls ou trop faibles (inférieurs à 1ms)
      // pour éviter l'affichage de "Infinity" ou des pics irréalistes.
      if (delta > 1) {
        const currentFps = 1000 / delta;
        this.fps.update((f) =>
          f === 0 ? currentFps : f * 0.9 + currentFps * 0.1,
        );
      }
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

  private sendCommand(type: WorkerCommandType, payload?: unknown) {
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
    this.sendCommand('START');
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

  updateDimensions(
    newRows: number,
    newCols: number,
    width?: number,
    height?: number,
  ): void {
    const currentConfig = untracked(() => this.config());
    if (currentConfig.resizeMode !== 'fill') return;

    const rowsChanged =
      newRows !== currentConfig.rows || newCols !== currentConfig.columns;

    if (rowsChanged) {
      this.config.update((c) => ({ ...c, rows: newRows, columns: newCols }));
    }

    // On envoie systématiquement la commande RESIZE au worker si on a des dimensions px,
    // car le canvas doit peut-être se redimensionner même si le nombre de cellules est identique.
    this.sendCommand('RESIZE', {
      rows: newRows,
      columns: newCols,
      width,
      height,
      cellSize: currentConfig.cellSize,
    });
  }
}
