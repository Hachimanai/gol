import { Component, inject, viewChild, ElementRef, effect, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../services/game-engine.service';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid-wrapper" #wrapper>
      <canvas #gridCanvas 
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        class="game-canvas">
      </canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .grid-wrapper {
      width: 100%;
      height: 100%;
      background: #121212;
      display: block; /* Simplifié */
    }
    .game-canvas {
      display: block; /* Empêche l'espace blanc en bas des images/inline */
      background-color: #1a1a1a;
      cursor: crosshair;
      image-rendering: pixelated;
    }
  `]
})
export class GridComponent implements AfterViewInit, OnDestroy {
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gridCanvas');
  private wrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('wrapper');
  engine = inject(GameEngineService);

  private readonly GAP = 1;
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
      const step = config.cellSize + this.GAP;
      const columns = Math.floor(width / step);
      const rows = Math.floor(height / step);
      this.dynamicCellSize = config.cellSize;

      if (columns > 0 && rows > 0) {
        this.engine.updateDimensions(rows, columns);
      }
      this.setupCanvasDimensions(width, height);
    } else if (config.resizeMode === 'fit') {
      const { rows, columns } = config;
      const cellW = (width - (columns * this.GAP)) / columns;
      const cellH = (height - (rows * this.GAP)) / rows;
      
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
    const { rows, columns } = this.engine.config();
    const step = this.dynamicCellSize + this.GAP;

    // Calcul du centrage pour que la grille soit au milieu si elle ne remplit pas tout parfaitement
    const offsetX = Math.floor((canvas.width - (columns * step - this.GAP)) / 2);
    const offsetY = Math.floor((canvas.height - (rows * step - this.GAP)) / 2);

    // Fond
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cellules vivantes
    ctx.fillStyle = '#00ff88';
    for (let y = 0; y < rows; y++) {
      const yOffset = y * columns;
      const py = offsetY + y * step;
      for (let x = 0; x < columns; x++) {
        if (grid[yOffset + x] === 1) {
          ctx.fillRect(offsetX + x * step, py, this.dynamicCellSize, this.dynamicCellSize);
        }
      }
    }
  }

  onMouseDown(event: MouseEvent) {
    this.handleInteract(event);
  }

  onMouseMove(event: MouseEvent) {
    if (event.buttons === 1) {
      this.handleInteract(event);
    }
  }

  private handleInteract(event: MouseEvent) {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const step = this.dynamicCellSize + this.GAP;
    const x = Math.floor((event.clientX - rect.left) / step);
    const y = Math.floor((event.clientY - rect.top) / step);
    
    const { rows, columns } = this.engine.config();
    if (x >= 0 && x < columns && y >= 0 && y < rows) {
      this.engine.toggleCell(x, y);
    }
  }
}
