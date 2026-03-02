import { Component, inject, viewChild, ElementRef, effect, AfterViewInit, OnDestroy, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../services/game-engine.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
})
export class GridComponent implements AfterViewInit, OnDestroy {
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gridCanvas');
  private wrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('wrapper');
  engine = inject(GameEngineService);

  private readonly GAP = 0;
  private dynamicCellSize = 10;
  private resizeObserver?: ResizeObserver;
  private diffSubscription?: Subscription;
  private fullRedrawSubscription?: Subscription;

  constructor() {
    // Déclencher un redimensionnement si la taille des cellules change
    effect(() => {
      this.engine.config();
      const wrapper = this.wrapperRef()?.nativeElement;
      if (wrapper) {
        untracked(() => this.onResize(wrapper.clientWidth, wrapper.clientHeight));
      }
    });

    // Redessiner uniquement si la configuration structurelle change (Thème)
    // On ne s'abonne PLUS à engine.grid() ici pour éviter les rendus complets à chaque frame.
    effect(() => {
      const config = this.engine.config();
      untracked(() => this.drawFullGrid());
    });
  }

  ngAfterViewInit() {
    this.setupResizeObserver();
    
    // Abonnement au rendu différentiel chirurgical
    this.diffSubscription = this.engine.gridDiff$.subscribe(diff => {
      this.updateGridSurgically(diff.added, diff.removed);
    });

    // Abonnement aux demandes de rendu complet (Init, Reset, Manual Edits)
    this.fullRedrawSubscription = this.engine.fullRedraw$.subscribe(() => {
      this.drawFullGrid();
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.diffSubscription?.unsubscribe();
    this.fullRedrawSubscription?.unsubscribe();
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width || this.wrapperRef().nativeElement.clientWidth;
        const height = entry.contentRect.height || this.wrapperRef().nativeElement.clientHeight;
        
        if (width > 0 && height > 0) {
          this.onResize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.wrapperRef().nativeElement);
  }

  private onResize(width: number, height: number) {
    const config = this.engine.config();
    
    if (config.resizeMode === 'fill') {
      const step = config.cellSize;
      const columns = Math.floor(width / step);
      const rows = Math.floor(height / step);
      this.dynamicCellSize = config.cellSize;

      if (columns > 0 && rows > 0) {
        this.engine.updateDimensions(rows, columns);
      }
      this.setupCanvasDimensions(width, height);
    } else if (config.resizeMode === 'fit') {
      const { rows, columns } = config;
      const cellW = width / columns;
      const cellH = height / rows;
      
      this.dynamicCellSize = Math.max(1, Math.floor(Math.min(cellW, cellH)));
      this.setupCanvasDimensions(width, height);
    }
  }

  private setupCanvasDimensions(width: number, height: number) {
    const canvas = this.canvasRef().nativeElement;
    canvas.width = width;
    canvas.height = height;
    this.drawFullGrid();
  }

  private drawFullGrid() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const grid = this.engine.grid();
    const { rows, columns, cellSize, theme } = this.engine.config();
    const step = cellSize;

    const offsetX = Math.floor((canvas.width - (columns * step)) / 2);
    const offsetY = Math.floor((canvas.height - (rows * step)) / 2);

    ctx.fillStyle = theme.dead;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = theme.alive;
    for (let y = 0; y < rows; y++) {
      const yOffset = y * columns;
      const py = offsetY + y * step;
      for (let x = 0; x < columns; x++) {
        if (grid[yOffset + x] === 1) {
          ctx.fillRect(offsetX + x * step, py, cellSize, cellSize);
        }
      }
    }
  }

  private updateGridSurgically(added: number[], removed: number[]) {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { rows, columns, cellSize, theme } = this.engine.config();
    const step = cellSize;

    const offsetX = Math.floor((canvas.width - (columns * step)) / 2);
    const offsetY = Math.floor((canvas.height - (rows * step)) / 2);

    ctx.fillStyle = theme.alive;
    for (const index of added) {
      const x = index % columns;
      const y = Math.floor(index / columns);
      ctx.fillRect(offsetX + x * step, offsetY + y * step, cellSize, cellSize);
    }

    ctx.fillStyle = theme.dead;
    for (const index of removed) {
      const x = index % columns;
      const y = Math.floor(index / columns);
      ctx.fillRect(offsetX + x * step, offsetY + y * step, cellSize, cellSize);
    }
  }

  onMouseDown(event: MouseEvent) {
    this.startInteract(event);
  }

  onMouseMove(event: MouseEvent) {
    if (event.buttons === 1) {
      this.continueInteract(event);
    }
  }

  private lastInteractedCell: { x: number, y: number } | null = null;
  private isDrawingMode = true;

  private startInteract(event: MouseEvent) {
    const coords = this.getCellCoords(event);
    if (!coords) return;

    const { x, y } = coords;
    const { columns } = this.engine.config();
    const currentGrid = this.engine.grid();
    
    this.isDrawingMode = currentGrid[y * columns + x] === 0;
    
    this.engine.setCellState(x, y, this.isDrawingMode);
    this.lastInteractedCell = { x, y };
  }

  private continueInteract(event: MouseEvent) {
    const coords = this.getCellCoords(event);
    if (!coords) return;

    const { x, y } = coords;
    
    if (this.lastInteractedCell?.x === x && this.lastInteractedCell?.y === y) {
      return;
    }

    this.engine.setCellState(x, y, this.isDrawingMode);
    this.lastInteractedCell = { x, y };
  }

  private getCellCoords(event: MouseEvent): { x: number, y: number } | null {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const { rows, columns, cellSize } = this.engine.config();
    const step = cellSize;

    const offsetX = Math.floor((canvas.width - (columns * step)) / 2);
    const offsetY = Math.floor((canvas.height - (rows * step)) / 2);

    const x = Math.floor((event.clientX - rect.left - offsetX) / step);
    const y = Math.floor((event.clientY - rect.top - offsetY) / step);
    
    if (x >= 0 && x < columns && y >= 0 && y < rows) {
      return { x, y };
    }
    return null;
  }
}
