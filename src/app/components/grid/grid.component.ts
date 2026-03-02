import { Component, inject, viewChild, ElementRef, effect, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../services/game-engine.service';

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

  constructor() {
    // Redessiner à chaque changement de grille ou de config
    effect(() => {
      this.drawGrid();
    });

    // Déclencher un redimensionnement si la taille des cellules change
    effect(() => {
      this.engine.config();
      const wrapper = this.wrapperRef()?.nativeElement;
      if (wrapper) {
        this.onResize(wrapper.clientWidth, wrapper.clientHeight);
      }
    });
  }

  ngAfterViewInit() {
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        // On utilise borderBoxSize ou contentRect
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
      const step = config.cellSize; // GAP est 0
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
    this.drawGrid();
  }

  private drawGrid() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const grid = this.engine.grid();
    const { rows, columns, cellSize, theme } = this.engine.config();
    const step = cellSize; // GAP est 0

    // Calcul du centrage
    const offsetX = Math.floor((canvas.width - (columns * step)) / 2);
    const offsetY = Math.floor((canvas.height - (rows * step)) / 2);

    // Fond (couleur des cellules mortes)
    ctx.fillStyle = theme.dead;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cellules vivantes
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

  onMouseDown(event: MouseEvent) {
    this.startInteract(event);
  }

  onMouseMove(event: MouseEvent) {
    if (event.buttons === 1) {
      this.continueInteract(event);
    }
  }

  private lastInteractedCell: { x: number, y: number } | null = null;
  private isDrawingMode = true; // true = drawing alive, false = erasing

  private startInteract(event: MouseEvent) {
    const coords = this.getCellCoords(event);
    if (!coords) return;

    const { x, y } = coords;
    const { columns } = this.engine.config();
    const currentGrid = this.engine.grid();
    
    // Déterminer le mode basé sur la cellule cliquée en premier
    // Si on clique sur une vivante, on passe en mode "gomme"
    this.isDrawingMode = currentGrid[y * columns + x] === 0;
    
    this.engine.setCellState(x, y, this.isDrawingMode);
    this.lastInteractedCell = { x, y };
  }

  private continueInteract(event: MouseEvent) {
    const coords = this.getCellCoords(event);
    if (!coords) return;

    const { x, y } = coords;
    
    // Éviter de traiter plusieurs fois la même cellule lors du mouvement
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
    const step = cellSize + this.GAP;

    // Calcul du centrage (identique au drawGrid)
    const offsetX = Math.floor((canvas.width - (columns * step - this.GAP)) / 2);
    const offsetY = Math.floor((canvas.height - (rows * step - this.GAP)) / 2);

    const x = Math.floor((event.clientX - rect.left - offsetX) / step);
    const y = Math.floor((event.clientY - rect.top - offsetY) / step);
    
    if (x >= 0 && x < columns && y >= 0 && y < rows) {
      return { x, y };
    }
    return null;
  }
}
