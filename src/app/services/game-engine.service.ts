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

@Injectable({
  providedIn: 'root',
})
export class GameEngineService implements OnDestroy {
  // On expose un Uint8Array pour le rendu Canvas (0 = mort, 1 = vivant)
  readonly grid = signal<Uint8Array>(new Uint8Array(0));
  readonly isRunning = signal<boolean>(false);
  readonly generation = signal<number>(0);
  readonly fps = signal<number>(0);
  readonly populationHistory = signal<number[]>([0]);
  readonly config = signal<GameConfig>({
    rows: 60,
    columns: 80,
    speed: 16, // Proche de 60 FPS (1000/60)
    initialDensity: 0.25,
    resizeMode: 'fill',
    cellSize: 10,
    theme: THEMES[0],
  });

  private bufferA!: Uint8Array;
  private bufferB!: Uint8Array;
  private frameId: number | null = null;
  private lastFrameTime = 0;
  private readonly maxHistory = 50;

  constructor() {
    this.initBuffers();

    effect(() => {
      this.config();
      if (untracked(() => this.isRunning())) {
        untracked(() => {
          this.stop();
          this.start();
        });
      }
    });
  }

  updateDimensions(newRows: number, newCols: number): void {
    const currentConfig = untracked(() => this.config());

    // Si on est en mode 'fixed' ou 'fit', on ne change pas le nombre de cellules
    if (currentConfig.resizeMode !== 'fill') return;

    // Validation de sécurité : Empêcher des tailles excessives
    const MAX_DIM = 6000;
    if (newRows < 1) newRows = 1;
    if (newCols < 1) newCols = 1;
    if (newRows > MAX_DIM) newRows = MAX_DIM;
    if (newCols > MAX_DIM) newCols = MAX_DIM;

    if (newRows === currentConfig.rows && newCols === currentConfig.columns)
      return;

    const oldGrid = untracked(() => this.grid());
    const oldRows = currentConfig.rows;
    const oldCols = currentConfig.columns;

    // Mettre à jour la config
    this.config.update((c) => ({ ...c, rows: newRows, columns: newCols }));

    // Recréer les buffers
    this.bufferA = new Uint8Array(newRows * newCols);
    this.bufferB = new Uint8Array(newRows * newCols);

    let currentPop = 0;
    // Tenter de copier l'ancien état au centre
    if (oldGrid.length > 0) {
      const rowOffset = Math.floor((newRows - oldRows) / 2);
      const colOffset = Math.floor((newCols - oldCols) / 2);

      for (let y = 0; y < oldRows; y++) {
        for (let x = 0; x < oldCols; x++) {
          const targetY = y + rowOffset;
          const targetX = x + colOffset;
          if (
            targetY >= 0 &&
            targetY < newRows &&
            targetX >= 0 &&
            targetX < newCols
          ) {
            const val = oldGrid[y * oldCols + x];
            this.bufferA[targetY * newCols + targetX] = val;
            if (val) currentPop++;
          }
        }
      }
    }

    this.grid.set(new Uint8Array(this.bufferA));
    this.populationHistory.update(h => {
      const newH = [...h];
      newH[newH.length - 1] = currentPop;
      return newH;
    });
  }

  private initBuffers() {
    const { rows, columns } = this.config();
    this.bufferA = new Uint8Array(rows * columns);
    this.bufferB = new Uint8Array(rows * columns);
    this.grid.set(this.bufferA);
  }

  ngOnDestroy() {
    this.stop();
  }

  start(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.lastFrameTime = 0; // Marqueur pour la première itération de loop()
    this.frameId = requestAnimationFrame(this.loop);
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning()) {
      this.fps.set(0);
      return;
    }

    // Si c'est la toute première frame après un start(), on initialise juste le temps
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
      this.frameId = requestAnimationFrame(this.loop);
      return;
    }

    const delta = timestamp - this.lastFrameTime;

    // Calcul du FPS avec lissage (exponential moving average)
    // On n'affiche que si le delta est réaliste (> 0)
    if (delta > 0) {
      const currentFps = 1000 / delta;
      // Lissage plus agressif au début pour stabiliser l'affichage
      this.fps.update(f => f === 0 ? currentFps : f * 0.95 + currentFps * 0.05);
    }

    // On ne calcule la génération que si le délai 'speed' est écoulé
    if (delta >= this.config().speed) {
      this.nextGeneration();
      // On ajuste lastFrameTime en fonction du timestamp réel pour garder la cadence
      this.lastFrameTime = timestamp - (delta % this.config().speed);
    }

    this.frameId = requestAnimationFrame(this.loop);
  };

  stop(): void {
    this.isRunning.set(false);
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  reset(): void {
    this.stop();
    this.generation.set(0);
    this.initBuffers();
    this.populationHistory.set([0]);
  }

  updateSpeed(speed: number): void {
    this.config.update((c) => ({ ...c, speed }));
  }

  updateTheme(theme: GameTheme): void {
    this.config.update((c) => ({ ...c, theme }));
  }

  randomize(): void {
    this.generation.set(0);
    const { initialDensity: density } = this.config();
    let pop = 0;
    for (let i = 0; i < this.bufferA.length; i++) {
      const isAlive = Math.random() < density ? 1 : 0;
      this.bufferA[i] = isAlive;
      if (isAlive) pop++;
    }
    this.grid.set(new Uint8Array(this.bufferA));
    this.populationHistory.set([pop]);
  }

  toggleCell(x: number, y: number): void {
    const { columns } = this.config();
    const index = y * columns + x;
    const newState = this.bufferA[index] ? 0 : 1;
    this.bufferA[index] = newState;
    this.grid.set(new Uint8Array(this.bufferA));
    
    this.populationHistory.update(hist => {
      const newHist = [...hist];
      newHist[newHist.length - 1] += newState ? 1 : -1;
      return newHist;
    });
  }

  setCellState(x: number, y: number, isAlive: boolean): void {
    const { columns } = this.config();
    const index = y * columns + x;
    const newState = isAlive ? 1 : 0;
    if (this.bufferA[index] !== newState) {
      this.bufferA[index] = newState;
      this.grid.set(new Uint8Array(this.bufferA));
      
      this.populationHistory.update(hist => {
        const newHist = [...hist];
        newHist[newHist.length - 1] += newState ? 1 : -1;
        return newHist;
      });
    }
  }

  nextGeneration(): void {
    const { rows, columns } = this.config();
    const current = this.bufferA;
    const next = this.bufferB;
    let newPop = 0;

    for (let y = 0; y < rows; y++) {
      const yCols = y * columns;
      for (let x = 0; x < columns; x++) {
        const index = yCols + x;
        const neighbors = this.countNeighbors(current, x, y, rows, columns);
        const isAlive = current[index] === 1;

        let willBeAlive = 0;
        if (isAlive) {
          willBeAlive = neighbors === 2 || neighbors === 3 ? 1 : 0;
        } else {
          willBeAlive = neighbors === 3 ? 1 : 0;
        }
        
        next[index] = willBeAlive;
        if (willBeAlive) newPop++;
      }
    }

    // Swap buffers sans réallocation
    this.bufferA.set(next);
    this.grid.set(new Uint8Array(this.bufferA));
    this.generation.update((g) => g + 1);
    
    this.populationHistory.update(hist => {
      const newHist = [...hist, newPop];
      if (newHist.length > this.maxHistory) newHist.shift();
      return newHist;
    });
  }

  applyPreset(presetName: string): void {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (!preset) return;

    this.reset();
    const { rows, columns } = this.config();
    const midX = Math.floor(columns / 2);
    const midY = Math.floor(rows / 2);

    let pop = 0;
    preset.cells.forEach((c) => {
      const targetX = midX + c.x;
      const targetY = midY + c.y;
      if (targetX >= 0 && targetX < columns && targetY >= 0 && targetY < rows) {
        this.bufferA[targetY * columns + targetX] = 1;
        pop++;
      }
    });
    this.grid.set(new Uint8Array(this.bufferA));
    this.populationHistory.set([pop]);
  }

  private countNeighbors(
    grid: Uint8Array,
    x: number,
    y: number,
    rows: number,
    cols: number,
  ): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      const ni = y + i;
      if (ni < 0 || ni >= rows) continue;
      const niCols = ni * cols;
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const nj = x + j;
        if (nj >= 0 && nj < cols) {
          if (grid[niCols + nj] === 1) count++;
        }
      }
    }
    return count;
  }
}
