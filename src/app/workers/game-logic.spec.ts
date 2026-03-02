import { GameLogic } from './game-logic';

describe('GameLogic', () => {
  let engine: GameLogic;

  beforeEach(() => {
    engine = new GameLogic();
  });

  it('should initialize correctly', () => {
    engine.initialize(10, 20);
    const state = engine.getState();
    expect(state.grid.length).toBe(200);
    expect(state.generation).toBe(0);
    expect(state.population).toBe(0);
  });

  describe('Conway Rules', () => {
    it('should follow rule: Solitude (1 neighbor death)', () => {
      engine.initialize(3, 3);
      engine.setCell(1, 1, true); // Cellule centrale vivante
      engine.setCell(0, 0, true); // Un seul voisin
      
      engine.computeNextGeneration();
      
      const state = engine.getState();
      expect(state.grid[1 * 3 + 1]).toBe(0); // Doit mourir
    });

    it('should follow rule: Survival (2 neighbors)', () => {
      engine.initialize(3, 3);
      engine.setCell(1, 1, true);
      engine.setCell(0, 0, true);
      engine.setCell(0, 1, true);
      
      engine.computeNextGeneration();
      
      const state = engine.getState();
      expect(state.grid[1 * 3 + 1]).toBe(1); // Doit survivre
    });

    it('should follow rule: Overpopulation (4 neighbors death)', () => {
      engine.initialize(3, 3);
      engine.setCell(1, 1, true);
      engine.setCell(0, 0, true);
      engine.setCell(0, 1, true);
      engine.setCell(0, 2, true);
      engine.setCell(1, 0, true);
      
      engine.computeNextGeneration();
      
      const state = engine.getState();
      expect(state.grid[1 * 3 + 1]).toBe(0); // Doit mourir
    });

    it('should follow rule: Reproduction (3 neighbors)', () => {
      engine.initialize(3, 3);
      engine.setCell(1, 1, false); // Morte
      engine.setCell(0, 0, true);
      engine.setCell(0, 1, true);
      engine.setCell(0, 2, true);
      
      engine.computeNextGeneration();
      
      const state = engine.getState();
      expect(state.grid[1 * 3 + 1]).toBe(1); // Doit naître
    });
  });

  describe('Grid Operations', () => {
    it('should toggle cells correctly', () => {
      engine.initialize(3, 3);
      engine.toggleCell(1, 1);
      expect(engine.getState().grid[1 * 3 + 1]).toBe(1);
      expect(engine.getState().population).toBe(1);
      
      engine.toggleCell(1, 1);
      expect(engine.getState().grid[1 * 3 + 1]).toBe(0);
      expect(engine.getState().population).toBe(0);
    });

    it('should resize and preserve centered state', () => {
      engine.initialize(3, 3);
      engine.setCell(1, 1, true); // Centre (1,1)
      
      engine.resize(5, 5); // 5x5
      
      const state = engine.getState();
      // rowOffset = floor(5-3/2) = 1, colOffset = floor(5-3/2) = 1
      // (1,1) devient (1+1, 1+1) = (2,2)
      expect(state.grid[2 * 5 + 2]).toBe(1);
      expect(state.population).toBe(1);
    });

    it('should apply presets correctly', () => {
      engine.initialize(10, 10);
      const cells = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]; // Blinker horizontal
      engine.applyPreset(cells);
      
      const state = engine.getState();
      expect(state.population).toBe(3);
      expect(state.generation).toBe(0);
    });

    it('should randomize the grid', () => {
      engine.initialize(10, 10);
      engine.randomize(0.5); // 50%
      
      const state = engine.getState();
      expect(state.population).toBeGreaterThan(0);
    });

    it('should have 0 population when randomized with 0 density', () => {
      engine.initialize(10, 10);
      engine.setCell(0, 0, true);
      engine.randomize(0);
      expect(engine.getState().population).toBe(0);
    });

    it('should have full population when randomized with 1 density', () => {
      engine.initialize(5, 5);
      engine.randomize(1);
      expect(engine.getState().population).toBe(25);
    });
  });

  describe('Pattern Evolution (Known Structures)', () => {
    it('should keep a "Block" (2x2) stable', () => {
      engine.initialize(4, 4);
      // Block at (1,1)
      engine.setCell(1, 1, true);
      engine.setCell(1, 2, true);
      engine.setCell(2, 1, true);
      engine.setCell(2, 2, true);
      
      const initialPop = engine.getState().population;
      engine.computeNextGeneration();
      
      expect(engine.getState().population).toBe(initialPop);
      expect(engine.getState().grid[1 * 4 + 1]).toBe(1);
      expect(engine.getState().grid[2 * 4 + 2]).toBe(1);
    });

    it('should oscillate a "Blinker" (3x1) correctly', () => {
      engine.initialize(5, 5);
      // Blinker horizontal at line y=2 (x=1, 2, 3)
      engine.setCell(1, 2, true);
      engine.setCell(2, 2, true);
      engine.setCell(3, 2, true);
      
      // Gen 1 -> Vertical at column x=2 (y=1, 2, 3)
      engine.computeNextGeneration();
      let state = engine.getState();
      expect(state.grid[1 * 5 + 2]).toBe(1); // (2,1)
      expect(state.grid[2 * 5 + 2]).toBe(1); // (2,2)
      expect(state.grid[3 * 5 + 2]).toBe(1); // (2,3)
      expect(state.grid[2 * 5 + 1]).toBe(0); // Old horizontal wing (1,2)
      
      // Gen 2 -> Horizontal again at line y=2 (x=1, 2, 3)
      engine.computeNextGeneration();
      state = engine.getState();
      expect(state.grid[2 * 5 + 1]).toBe(1); // (1,2)
      expect(state.grid[2 * 5 + 2]).toBe(1); // (2,2)
      expect(state.grid[2 * 5 + 3]).toBe(1); // (3,2)
      expect(state.grid[1 * 5 + 2]).toBe(0); // Old vertical wing (2,1)
    });
  });
});
