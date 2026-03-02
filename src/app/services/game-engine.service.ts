import { Injectable, signal, effect, OnDestroy, untracked } from '@angular/core';
import { GameConfig } from '../models/game.model';
import { PRESETS } from '../constants/presets';

@Injectable({
  providedIn: 'root'
})
export class GameEngineService implements OnDestroy {
  // On expose un Uint8Array pour le rendu Canvas (0 = mort, 1 = vivant)
  readonly grid = signal<Uint8Array>(new Uint8Array(0));
  readonly isRunning = signal<boolean>(false);
  readonly generation = signal<number>(0);
  readonly config = signal<GameConfig>({
    rows: 60,
    columns: 80,
    speed: 16, // Proche de 60 FPS (1000/60)
    initialDensity: 0.25,
    resizeMode: 'fill',
    cellSize: 10
  });

  private bufferA!: Uint8Array;
  private bufferB!: Uint8Array;
  private frameId: number | null = null;
  private lastFrameTime = 0;

  constructor() {
    this.initBuffers();
    
    effect(() => {
      const { speed } = this.config();
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
    const MAX_DIM = 500;
    if (newRows < 1) newRows = 1;
    if (newCols < 1) newCols = 1;
    if (newRows > MAX_DIM) newRows = MAX_DIM;
    if (newCols > MAX_DIM) newCols = MAX_DIM;

    if (newRows === currentConfig.rows && newCols === currentConfig.columns) return;

    const oldGrid = untracked(() => this.grid());
    const oldRows = currentConfig.rows;
    const oldCols = currentConfig.columns;
    
    // Mettre à jour la config
    this.config.update(c => ({ ...c, rows: newRows, columns: newCols }));
    
    // Recréer les buffers
    this.bufferA = new Uint8Array(newRows * newCols);
    this.bufferB = new Uint8Array(newRows * newCols);

    // Tenter de copier l'ancien état au centre
    if (oldGrid.length > 0) {
      const rowOffset = Math.floor((newRows - oldRows) / 2);
      const colOffset = Math.floor((newCols - oldCols) / 2);

      for (let y = 0; y < oldRows; y++) {
        for (let x = 0; x < oldCols; x++) {
          const targetY = y + rowOffset;
          const targetX = x + colOffset;
          if (targetY >= 0 && targetY < newRows && targetX >= 0 && targetX < newCols) {
            this.bufferA[targetY * newCols + targetX] = oldGrid[y * oldCols + x];
          }
        }
      }
    }
    
    this.grid.set(new Uint8Array(this.bufferA));
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
    this.lastFrameTime = performance.now();
    this.loop();
  }

  private loop = () => {
    if (!this.isRunning()) return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;

    // On ne calcule la génération que si le délai 'speed' est écoulé
    // Pour du 60 FPS pur, 'speed' sera fixé à 16ms ou moins.
    if (delta >= this.config().speed) {
      this.nextGeneration();
      this.lastFrameTime = now - (delta % this.config().speed);
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
  }

  updateSpeed(speed: number): void {
    this.config.update(c => ({ ...c, speed }));
  }

  randomize(): void {
    this.generation.set(0);
    const { initialDensity: density } = this.config();
    for (let i = 0; i < this.bufferA.length; i++) {
      this.bufferA[i] = Math.random() < density ? 1 : 0;
    }
    this.grid.set(new Uint8Array(this.bufferA));
  }

  toggleCell(x: number, y: number): void {
    const { columns } = this.config();
    const index = y * columns + x;
    this.bufferA[index] = this.bufferA[index] ? 0 : 1;
    this.grid.set(new Uint8Array(this.bufferA));
  }

  nextGeneration(): void {
    const { rows, columns } = this.config();
    const current = this.bufferA;
    const next = this.bufferB;

    for (let y = 0; y < rows; y++) {
      const yCols = y * columns;
      for (let x = 0; x < columns; x++) {
        const index = yCols + x;
        const neighbors = this.countNeighbors(current, x, y, rows, columns);
        const isAlive = current[index] === 1;

        if (isAlive) {
          next[index] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          next[index] = (neighbors === 3) ? 1 : 0;
        }
      }
    }

    // Swap buffers sans réallocation
    this.bufferA.set(next);
    this.grid.set(new Uint8Array(this.bufferA));
    this.generation.update(g => g + 1);
  }

  applyPreset(presetName: string): void {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    this.reset();
    const { rows, columns } = this.config();
    const midX = Math.floor(columns / 2);
    const midY = Math.floor(rows / 2);

    preset.cells.forEach(c => {
      const targetX = midX + c.x;
      const targetY = midY + c.y;
      if (targetX >= 0 && targetX < columns && targetY >= 0 && targetY < rows) {
        this.bufferA[targetY * columns + targetX] = 1;
      }
    });
    this.grid.set(new Uint8Array(this.bufferA));
  }

  private countNeighbors(grid: Uint8Array, x: number, y: number, rows: number, cols: number): number {
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
