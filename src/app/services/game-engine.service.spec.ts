import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { THEMES } from '../constants/themes';

describe('GameEngineService', () => {
  let service: GameEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameEngineService);
    service.config.set({ 
      rows: 5, 
      columns: 5, 
      speed: 16, 
      initialDensity: 0, 
      resizeMode: 'fill', 
      cellSize: 10,
      theme: THEMES[0]
    });
    service.reset();
    
    try { jasmine.clock().uninstall(); } catch { /* Ignore if not installed */ }
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Conway Rules (Table-Driven)', () => {
    interface TestCase {
      name: string;
      initialAlive: boolean;
      neighbors: number;
      expectedAlive: boolean;
    }

    const testCases: TestCase[] = [
      { name: 'Solitude (0 neighbor)', initialAlive: true, neighbors: 0, expectedAlive: false },
      { name: 'Survival (2 neighbors)', initialAlive: true, neighbors: 2, expectedAlive: true },
      { name: 'Overpopulation (4 neighbors)', initialAlive: true, neighbors: 4, expectedAlive: false },
      { name: 'Reproduction (3 neighbors)', initialAlive: false, neighbors: 3, expectedAlive: true },
      { name: 'Boundary - Top Left corner survival', initialAlive: true, neighbors: 2, expectedAlive: true },
    ];

    testCases.forEach(tc => {
      it(`should follow rule: ${tc.name}`, () => {
        service.reset();
        const { columns } = service.config();
        
        const centerX = tc.name.includes('Boundary') ? 0 : 2;
        const centerY = tc.name.includes('Boundary') ? 0 : 2;

        if (tc.initialAlive) {
          service.toggleCell(centerX, centerY);
        }

        const neighborOffsets = [
          [-1, -1], [0, -1], [1, -1],
          [-1, 0],           [1, 0],
          [-1, 1],  [0, 1],  [1, 1]
        ];

        let neighborsAdded = 0;
        for (let i = 0; i < neighborOffsets.length && neighborsAdded < tc.neighbors; i++) {
          const [dx, dy] = neighborOffsets[i];
          const nx = centerX + dx;
          const ny = centerY + dy;
          if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
            service.toggleCell(nx, ny);
            neighborsAdded++;
          }
        }

        service.nextGeneration();
        expect(service.grid()[centerY * columns + centerX]).toBe(tc.expectedAlive ? 1 : 0);
      });
    });
  });

  describe('60 FPS Control', () => {
    it('should start and stop correctly', () => {
      // Pour requestAnimationFrame, jasmine.clock().tick() peut ne pas déclencher 
      // automatiquement le callback. Dans un environnement de test pur, nextGeneration() 
      // peut être appelée manuellement ou via tick si polyfilled.
      service.start();
      expect(service.isRunning()).toBeTrue();
      service.stop();
      expect(service.isRunning()).toBeFalse();
    });

    it('should reset correctly', () => {
      service.toggleCell(0, 0);
      service.reset();
      expect(service.generation()).toBe(0);
      expect(service.grid().every(v => v === 0)).toBeTrue();
    });

    it('should update speed correctly', () => {
      service.updateSpeed(32);
      expect(service.config().speed).toBe(32);
    });

    it('should update dimensions and preserve centered state', () => {
      service.config.set({ 
        rows: 3, 
        columns: 3, 
        speed: 100, 
        initialDensity: 0, 
        resizeMode: 'fill', 
        cellSize: 10,
        theme: THEMES[0]
      });
      service.reset();
      
      // Placer une cellule au centre (1, 1)
      service.toggleCell(1, 1);
      
      // Agrandir à 5x5
      service.updateDimensions(5, 5);
      
      const grid = service.grid();
      const cols = service.config().columns;
      
      // La cellule (1,1) de la grille 3x3 doit se retrouver à (2,2) dans la grille 5x5
      // rowOffset = floor(5-3/2) = 1, colOffset = floor(5-3/2) = 1
      expect(grid[2 * cols + 2]).toBe(1);
    });

    it('should update theme correctly', () => {
      service.updateTheme(THEMES[1]);
      expect(service.config().theme.name).toBe(THEMES[1].name);
    });

    it('should stay empty when no cells are alive', () => {
      service.reset();
      service.nextGeneration();
      expect(service.grid().every(v => v === 0)).toBeTrue();
    });

    it('should apply presets correctly', () => {
      service.reset();
      service.applyPreset('Blinker');
      const grid = service.grid();
      expect(grid.some(v => v === 1)).toBeTrue();
      // Blinker has 3 cells
      expect(grid.filter(v => v === 1).length).toBe(3);
    });

    it('should randomize the grid', () => {
      service.reset();
      service.config.update(c => ({ ...c, initialDensity: 0.5 }));
      service.randomize();
      const grid = service.grid();
      // Statistically, with 50% density on 25 cells, it's very unlikely to be empty
      expect(grid.some(v => v === 1)).toBeTrue();
    });
  });
});
