import { Component, inject, viewChild, ElementRef, effect, AfterViewInit, OnDestroy, untracked } from '@angular/core';
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

  private resizeObserver?: ResizeObserver;
  private isOffscreenTransferred = false;

  constructor() {
    // Déclencher un redimensionnement si la configuration change (cellSize, resizeMode)
    effect(() => {
      this.engine.config();
      const wrapper = this.wrapperRef()?.nativeElement;
      if (wrapper) {
        untracked(() => this.onResize(wrapper.clientWidth, wrapper.clientHeight));
      }
    });
  }

  ngAfterViewInit() {
    this.tryTransferCanvas();
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private tryTransferCanvas() {
    const canvas = this.canvasRef().nativeElement;
    
    // Vérification du support et si déjà transféré
    if ('transferControlToOffscreen' in canvas && !this.isOffscreenTransferred) {
      try {
        const offscreen = canvas.transferControlToOffscreen();
        const { clientWidth, clientHeight } = this.wrapperRef().nativeElement;
        
        this.engine.transferCanvas(offscreen, clientWidth, clientHeight);
        this.isOffscreenTransferred = true;
      } catch (e) {
        console.warn('Could not transfer canvas control. Falling back to main thread rendering (not implemented).', e);
      }
    } else {
      console.error('OffscreenCanvas is not supported in this browser.');
    }
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

      if (columns > 0 && rows > 0) {
        this.engine.updateDimensions(rows, columns, width, height);
      }
    } else {
      // Pour les autres modes, on notifie quand même les dimensions px au worker
      const { rows, columns } = config;
      this.engine.updateDimensions(rows, columns, width, height);
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
    // Note: Comme on n'a plus de contexte sur le thread principal, 
    // on utilise les dimensions théoriques pour le calcul des coordonnées.
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const { rows, columns, cellSize } = this.engine.config();
    const step = cellSize;

    const offsetX = Math.floor((canvas.clientWidth - (columns * step)) / 2);
    const offsetY = Math.floor((canvas.clientHeight - (rows * step)) / 2);

    const x = Math.floor((event.clientX - rect.left - offsetX) / step);
    const y = Math.floor((event.clientY - rect.top - offsetY) / step);
    
    if (x >= 0 && x < columns && y >= 0 && y < rows) {
      return { x, y };
    }
    return null;
  }
}
