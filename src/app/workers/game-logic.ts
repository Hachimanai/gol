export class GameLogic {
  private bufferA: Uint8Array = new Uint8Array(0);
  private bufferB: Uint8Array = new Uint8Array(0);
  private rows = 0;
  private columns = 0;
  private generation = 0;
  private population = 0;

  initialize(rows: number, columns: number, density = 0): void {
    this.rows = rows;
    this.columns = columns;
    this.bufferA = new Uint8Array(rows * columns);
    this.bufferB = new Uint8Array(rows * columns);
    this.generation = 0;
    this.population = 0;

    if (density > 0) {
      this.randomize(density);
    }
  }

  randomize(density: number): void {
    let pop = 0;
    for (let i = 0; i < this.bufferA.length; i++) {
      const isAlive = Math.random() < density ? 1 : 0;
      this.bufferA[i] = isAlive;
      if (isAlive) pop++;
    }
    this.population = pop;
    this.generation = 0;
  }

  resize(newRows: number, newCols: number): void {
    const oldGrid = this.bufferA;
    const oldRows = this.rows;
    const oldCols = this.columns;

    this.rows = newRows;
    this.columns = newCols;
    this.bufferA = new Uint8Array(newRows * newCols);
    this.bufferB = new Uint8Array(newRows * newCols);

    let currentPop = 0;
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
    this.population = currentPop;
  }

  toggleCell(x: number, y: number): void {
    const index = y * this.columns + x;
    const newState = this.bufferA[index] ? 0 : 1;
    this.bufferA[index] = newState;
    this.population += newState ? 1 : -1;
  }

  setCell(x: number, y: number, isAlive: boolean): void {
    const index = y * this.columns + x;
    const newState = isAlive ? 1 : 0;
    if (this.bufferA[index] !== newState) {
      this.bufferA[index] = newState;
      this.population += newState ? 1 : -1;
    }
  }

  applyPreset(cells: { x: number; y: number }[]): void {
    this.bufferA.fill(0);
    const midX = Math.floor(this.columns / 2);
    const midY = Math.floor(this.rows / 2);

    let pop = 0;
    cells.forEach((c) => {
      const targetX = midX + c.x;
      const targetY = midY + c.y;
      if (
        targetX >= 0 &&
        targetX < this.columns &&
        targetY >= 0 &&
        targetY < this.rows
      ) {
        this.bufferA[targetY * this.columns + targetX] = 1;
        pop++;
      }
    });
    this.population = pop;
    this.generation = 0;
  }

  private added: number[] = [];
  private removed: number[] = [];

  computeNextGeneration(): void {
    const current = this.bufferA;
    const next = this.bufferB;
    let newPop = 0;
    this.added = [];
    this.removed = [];

    for (let y = 0; y < this.rows; y++) {
      const yCols = y * this.columns;
      for (let x = 0; x < this.columns; x++) {
        const index = yCols + x;
        const neighbors = this.countNeighbors(current, x, y);
        const isAlive = current[index] === 1;

        let willBeAlive = 0;
        if (isAlive) {
          willBeAlive = neighbors === 2 || neighbors === 3 ? 1 : 0;
        } else {
          willBeAlive = neighbors === 3 ? 1 : 0;
        }

        next[index] = willBeAlive;
        if (willBeAlive) newPop++;

        // Tracking changes
        if (isAlive && willBeAlive === 0) {
          this.removed.push(index);
        } else if (!isAlive && willBeAlive === 1) {
          this.added.push(index);
        }
      }
    }

    // Swap buffers
    this.bufferA.set(next);
    this.population = newPop;
    this.generation++;
  }

  getState() {
    return {
      grid: this.bufferA,
      generation: this.generation,
      population: this.population,
      added: this.added,
      removed: this.removed
    };
  }

  private countNeighbors(grid: Uint8Array, x: number, y: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      const ni = y + i;
      if (ni < 0 || ni >= this.rows) continue;
      const niCols = ni * this.columns;
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const nj = x + j;
        if (nj >= 0 && nj < this.columns) {
          if (grid[niCols + nj] === 1) count++;
        }
      }
    }
    return count;
  }
}
