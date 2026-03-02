import { GOL_VERTEX_SHADER, GOL_FRAGMENT_SHADER } from '../constants/shaders';

export class WebGLGameRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private instanceBuffer: WebGLBuffer | null = null;
  private stateBuffer: WebGLBuffer | null = null;

  private aliveColor: number[] = [0, 1, 0.5]; // Normalisé 0-1
  private deadColor: number[] = [0.1, 0.1, 0.1];

  private gridWidth = 0;
  private gridHeight = 0;
  private cellSize = 2;

  setCanvas(canvas: OffscreenCanvas, width: number, height: number, theme: { alive: string, dead: string }) {
    this.gl = canvas.getContext('webgl2', { 
      alpha: false, 
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false
    }) as WebGL2RenderingContext;

    if (!this.gl) {
      throw new Error('WebGL2 non supporté');
    }

    this.initShaders();
    this.updateTheme(theme);
    this.resize(width, height);
  }

  updateCellSize(size: number) {
    this.cellSize = size;
  }

  private initShaders() {
    const gl = this.gl!;
    const vs = this.compileShader(gl.VERTEX_SHADER, GOL_VERTEX_SHADER);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, GOL_FRAGMENT_SHADER);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program)!);
    }

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // 1. Buffer de géométrie (un simple carré unité)
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // 2. Buffer de positions des instances (X, Y dans la grille)
    this.instanceBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(1);
    // On configurera les données lors du resize

    // 3. Buffer d'états des instances (0.0 ou 1.0)
    this.stateBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(2);
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl!;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(info!);
    }
    return shader;
  }

  private hexToRgb(hex: string): number[] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  updateTheme(theme: { alive: string, dead: string }) {
    this.aliveColor = this.hexToRgb(theme.alive);
    this.deadColor = this.hexToRgb(theme.dead);
  }

  resize(width: number, height: number) {
    if (this.gl) {
      this.gl.canvas.width = width;
      this.gl.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  /**
   * Initialise les données de la grille (positions des instances)
   */
  setupGrid(columns: number, rows: number) {
    const gl = this.gl!;
    this.gridWidth = columns;
    this.gridHeight = rows;

    const instancePositions = new Float32Array(columns * rows * 2);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const idx = (y * columns + x) * 2;
        // On centre la grille si nécessaire via le shader, 
        // ici on envoie simplement les coordonnées brutes.
        instancePositions[idx] = x;
        instancePositions[idx + 1] = y;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instancePositions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);
  }

  render(grid: Uint8Array) {
    if (!this.gl || !this.program || !this.vao || this.gridWidth === 0) return;

    const gl = this.gl;
    gl.clearColor(this.deadColor[0], this.deadColor[1], this.deadColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Mise à jour critique des uniformes de dimension
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_grid_size'), this.gridWidth, this.gridHeight);
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_resolution'), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_cell_size'), this.cellSize);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_cell_spacing'), 0.1); 
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_alive_color'), this.aliveColor);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_dead_color'), this.deadColor);

    // Mise à jour des états (0.0 ou 1.0)
    // On convertit Uint8Array en Float32Array car le shader attend des floats
    const states = new Float32Array(grid.length);
    for (let i = 0; i < grid.length; i++) {
      states[i] = grid[i];
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, states, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1); // Un état par instance

    // Draw call instancié
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, grid.length);
  }
}
