import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';

describe('GameEngineService', () => {
  let service: GameEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameEngineService);
    service.config.set({ rows: 5, columns: 5, speed: 16, initialDensity: 0 });
    service.reset();
    
    try { jasmine.clock().uninstall(); } catch (e) {}
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
    ];

    testCases.forEach(tc => {
      it(`should follow rule: ${tc.name}`, () => {
        service.reset();
        const { columns } = service.config();
        
        if (tc.initialAlive) {
          service.toggleCell(2, 2);
        }

        const neighborOffsets = [
          [-1, -1], [0, -1], [1, -1],
          [-1, 0],           [1, 0],
          [-1, 1],  [0, 1],  [1, 1]
        ];

        for (let i = 0; i < tc.neighbors; i++) {
          const [dx, dy] = neighborOffsets[i];
          service.toggleCell(2 + dx, 2 + dy);
        }

        service.nextGeneration();
        expect(service.grid()[2 * columns + 2]).toBe(tc.expectedAlive ? 1 : 0);
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
      service.config.set({ rows: 3, columns: 3, speed: 100, initialDensity: 0 });
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
  });
});
