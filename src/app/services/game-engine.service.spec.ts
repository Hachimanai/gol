import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { THEMES } from '../constants/themes';
import { WorkerCommand, WorkerResponse } from '../models/worker-messages.model';

describe('GameEngineService (Worker Proxy)', () => {
  let service: GameEngineService;
  let mockWorker: any;
  let lastSentCommand: WorkerCommand | null = null;

  beforeEach(() => {
    // Mock global du Worker
    mockWorker = {
      postMessage: jasmine.createSpy('postMessage').and.callFake((command: WorkerCommand) => {
        lastSentCommand = command;
      }),
      terminate: jasmine.createSpy('terminate'),
      onmessage: null as any
    };

    // On remplace le constructeur global Worker
    (window as any).Worker = jasmine.createSpy('Worker').and.returnValue(mockWorker);

    TestBed.configureTestingModule({});
    
    // On réinitialise l'état AVANT l'injection
    lastSentCommand = null;
    service = TestBed.inject(GameEngineService);
    
    // On force l'exécution des effets initiaux (comme SET_SPEED du premier rendu)
    TestBed.flushEffects();
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created and initialize worker', () => {
    expect(service).toBeTruthy();
    expect(window.Worker).toHaveBeenCalled();
    // On vérifie que INITIALIZE a bien été envoyé au début
    const initializeCall = mockWorker.postMessage.calls.all().find((c: any) => c.args[0].type === 'INITIALIZE');
    expect(initializeCall).toBeDefined();
  });

  it('should send START command when start() is called', () => {
    service.start();
    expect(service.isRunning()).toBeTrue();
    expect(lastSentCommand?.type).toBe('START');
    expect(lastSentCommand?.payload.speed).toBe(service.config().speed);
  });

  it('should send STOP command when stop() is called', () => {
    service.start(); // S'assurer qu'il tourne
    service.stop();
    expect(service.isRunning()).toBeFalse();
    expect(lastSentCommand?.type).toBe('STOP');
  });

  it('should send INITIALIZE when reset() is called', () => {
    service.reset();
    expect(lastSentCommand?.type).toBe('INITIALIZE');
    expect(lastSentCommand?.payload.initialDensity).toBe(0);
  });

  it('should send SET_SPEED when speed is updated', () => {
    service.updateSpeed(50);
    TestBed.flushEffects();
    expect(lastSentCommand?.type).toBe('SET_SPEED');
    expect(lastSentCommand?.payload.speed).toBe(50);
  });

  it('should send TOGGLE_CELL command', () => {
    service.toggleCell(10, 20);
    expect(lastSentCommand?.type).toBe('TOGGLE_CELL');
    expect(lastSentCommand?.payload).toEqual({ x: 10, y: 20 });
  });

  it('should send APPLY_PRESET command', () => {
    service.applyPreset('Blinker');
    expect(lastSentCommand?.type).toBe('APPLY_PRESET');
    expect(lastSentCommand?.payload.cells).toBeDefined();
  });

  it('should update signals when receiving Worker message', () => {
    const grid = new Uint8Array([1, 0, 1]);
    const response: WorkerResponse = {
      type: 'GEN_COMPLETED',
      payload: {
        grid,
        generation: 42,
        population: 2
      }
    };

    // Simuler le message du worker
    mockWorker.onmessage({ data: response });

    expect(service.grid()).toEqual(grid);
    expect(service.generation()).toBe(42);
    expect(service.populationHistory()[service.populationHistory().length - 1]).toBe(2);
  });

  it('should limit population history to 50 entries', () => {
    // Simuler 60 messages du worker
    service.start(); // isRunning = true
    for (let i = 0; i < 60; i++) {
      mockWorker.onmessage({ 
        data: { 
          type: 'GEN_COMPLETED', 
          payload: { grid: new Uint8Array(0), generation: i, population: i } 
        } 
      });
    }
    
    expect(service.populationHistory().length).toBe(50);
    // Le premier élément doit être le 11ème (index 10) car on a shifté 10 fois
    expect(service.populationHistory()[0]).toBe(10);
  });

  it('should send RESIZE command when dimensions change', () => {
    // Mode fill par défaut
    service.updateDimensions(100, 150);
    expect(lastSentCommand?.type).toBe('RESIZE');
    expect(lastSentCommand?.payload).toEqual({ rows: 100, columns: 150 });
  });
});
