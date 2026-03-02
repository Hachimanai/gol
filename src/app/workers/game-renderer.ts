export class GameRenderer {
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private canvas: OffscreenCanvas | null = null;
  private aliveColor = '#00ff88';
  private deadColor = '#1a1a1a';

  setCanvas(canvas: OffscreenCanvas, width: number, height: number, theme: { alive: string, dead: string }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }) as OffscreenCanvasRenderingContext2D;
    this.canvas.width = width;
    this.canvas.height = height;
    this.updateTheme(theme);
  }

  updateTheme(theme: { alive: string, dead: string }) {
    this.aliveColor = theme.alive;
    this.deadColor = theme.dead;
  }

  resize(width: number, height: number) {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  drawFull(grid: Uint8Array, rows: number, columns: number, cellSize: number) {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const step = cellSize;
    const offsetX = Math.floor((this.canvas.width - (columns * step)) / 2);
    const offsetY = Math.floor((this.canvas.height - (rows * step)) / 2);

    ctx.fillStyle = this.deadColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = this.aliveColor;
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

  drawDiff(added: number[], removed: number[], rows: number, columns: number, cellSize: number) {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const step = cellSize;
    const offsetX = Math.floor((this.canvas.width - (columns * step)) / 2);
    const offsetY = Math.floor((this.canvas.height - (rows * step)) / 2);

    // Nouvelles cellules vivantes
    ctx.fillStyle = this.aliveColor;
    for (const index of added) {
      const x = index % columns;
      const y = Math.floor(index / columns);
      ctx.fillRect(offsetX + x * step, offsetY + y * step, cellSize, cellSize);
    }

    // Cellules mortes
    ctx.fillStyle = this.deadColor;
    for (const index of removed) {
      const x = index % columns;
      const y = Math.floor(index / columns);
      ctx.fillRect(offsetX + x * step, offsetY + y * step, cellSize, cellSize);
    }
  }

  drawCell(x: number, y: number, isAlive: boolean, rows: number, columns: number, cellSize: number) {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const step = cellSize;
    const offsetX = Math.floor((this.canvas.width - (columns * step)) / 2);
    const offsetY = Math.floor((this.canvas.height - (rows * step)) / 2);

    ctx.fillStyle = isAlive ? this.aliveColor : this.deadColor;
    ctx.fillRect(offsetX + x * step, offsetY + y * step, cellSize, cellSize);
  }
}
