import { TestBed } from '@angular/core/testing';
import { GameEngineService } from './game-engine.service';
import { WorkerCommand, WorkerResponse } from '../models/worker-messages.model';

describe('GameEngineService (Worker Proxy)', () => {
  let service: GameEngineService;
  let mockWorker: {
    postMessage: jasmine.Spy;
    terminate: jasmine.Spy;
    onmessage: ((ev: MessageEvent) => void) | null;
    onerror: ((ev: ErrorEvent) => void) | null;
  };

  beforeEach(() => {
    // Mock global du Worker
    mockWorker = {
      postMessage: jasmine.createSpy('postMessage'),
      terminate: jasmine.createSpy('terminate'),
      onmessage: null,
      onerror: null
    };

    // On remplace le constructeur global Worker
    (window as unknown as { Worker: jasmine.Spy }).Worker = jasmine.createSpy('Worker').and.returnValue(mockWorker);

    TestBed.configureTestingModule({});
    
    service = TestBed.inject(GameEngineService);
    
    // On force l'exécution des effets initiaux
    TestBed.flushEffects();
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created and initialize worker', () => {
    expect(service).toBeTruthy();
    expect(window.Worker).toHaveBeenCalled();
    // On vérifie que INITIALIZE a bien été envoyé au début
    const initializeCall = mockWorker.postMessage.calls.all().find((c) => (c.args[0] as WorkerCommand).type === 'INITIALIZE');
    expect(initializeCall).toBeDefined();
  });

  it('should send START command when start() is called', () => {
    service.start();
    expect(service.isRunning()).toBeTrue();
    const startCall = mockWorker.postMessage.calls.all().find((c) => (c.args[0] as WorkerCommand).type === 'START');
    expect(startCall).toBeDefined();
  });

  it('should send STOP command when stop() is called', () => {
    service.start(); // S'assurer qu'il tourne
    service.stop();
    expect(service.isRunning()).toBeFalse();
    const stopCall = mockWorker.postMessage.calls.all().find((c) => (c.args[0] as WorkerCommand).type === 'STOP');
    expect(stopCall).toBeDefined();
  });

  it('should send INITIALIZE when reset() is called', () => {
    service.reset();
    const initCall = mockWorker.postMessage.calls.all().find((c) => {
      const cmd = c.args[0] as WorkerCommand;
      const payload = cmd.payload as { initialDensity: number };
      return cmd.type === 'INITIALIZE' && payload.initialDensity === 0;
    });
    expect(initCall).toBeDefined();
  });

  it('should send SET_SPEED when speed is updated (Note: speed was removed, testing remaining reactivity)', () => {
    // Ce test pourrait être supprimé ou adapté car la vitesse est retirée
    // On garde la structure pour la réactivité du thème par exemple
    service.updateTheme({ name: 'Test', alive: '#000', dead: '#000', grid: '#000', primary: '#000', background: '#000', surface: '#000', text: '#000' });
    TestBed.flushEffects();
    const themeCall = mockWorker.postMessage.calls.all().find((c) => (c.args[0] as WorkerCommand).type === 'UPDATE_THEME');
    expect(themeCall).toBeDefined();
  });

  it('should send TOGGLE_CELL command', () => {
    service.toggleCell(10, 20);
    const toggleCall = mockWorker.postMessage.calls.all().find((c) => (c.args[0] as WorkerCommand).type === 'TOGGLE_CELL');
    expect(toggleCall).toBeDefined();
    expect((toggleCall?.args[0] as WorkerCommand).payload).toEqual({ x: 10, y: 20 });
  });

  it('should send APPLY_PRESET command', () => {
    service.applyPreset('Blinker');
    const presetCall = mockWorker.postMessage.calls.all().find((c) => (c.args[0] as WorkerCommand).type === 'APPLY_PRESET');
    expect(presetCall).toBeDefined();
    expect(((presetCall?.args[0] as WorkerCommand).payload as { cells: unknown[] }).cells).toBeDefined();
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
    if (mockWorker.onmessage) {
      mockWorker.onmessage({ data: response } as MessageEvent);
    }

    expect(service.grid()).toEqual(grid);
    expect(service.generation()).toBe(42);
    expect(service.populationHistory()[service.populationHistory().length - 1]).toBe(2);
  });

  it('should limit population history to 50 entries', () => {
    // Simuler 60 messages du worker
    service.start(); // isRunning = true
    for (let i = 0; i < 60; i++) {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({ 
          data: { 
            type: 'GEN_COMPLETED', 
            payload: { grid: new Uint8Array(0), generation: i, population: i } 
          } 
        } as MessageEvent);
      }
    }
    
    expect(service.populationHistory().length).toBe(50);
    expect(service.populationHistory()[0]).toBe(10);
  });

  it('should send RESIZE command when dimensions change', () => {
    // Mode fill par défaut
    service.updateDimensions(100, 150, 800, 600);
    const resizeCall = mockWorker.postMessage.calls.all().find((c) => (c.args[0] as WorkerCommand).type === 'RESIZE');
    expect(resizeCall).toBeDefined();
    const payload = (resizeCall?.args[0] as WorkerCommand).payload;
    expect(payload).toEqual({ rows: 100, columns: 150, width: 800, height: 600, cellSize: 2 });
  });
});
