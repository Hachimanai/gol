import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlsComponent } from './controls.component';
import { GameEngineService } from '../../services/game-engine.service';
import { signal, WritableSignal } from '@angular/core';
import { GameConfig } from '../../models/game.model';

describe('ControlsComponent', () => {
  let component: ControlsComponent;
  let fixture: ComponentFixture<ControlsComponent>;
  let mockEngine: jasmine.SpyObj<GameEngineService> & {
    isRunning: WritableSignal<boolean>;
    generation: WritableSignal<number>;
    config: WritableSignal<GameConfig>;
    grid: WritableSignal<Uint8Array>;
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('GameEngineService', ['start', 'stop', 'nextGeneration', 'reset', 'randomize', 'applyPreset']);
    mockEngine = spy as unknown as typeof mockEngine;
    
    mockEngine.isRunning = signal(false);
    mockEngine.generation = signal(0);
    mockEngine.config = signal({ 
      rows: 40, 
      columns: 60, 
      speed: 100, 
      initialDensity: 0.25, 
      resizeMode: 'fill', 
      cellSize: 10 
    });
    mockEngine.grid = signal(new Uint8Array(0));

    await TestBed.configureTestingModule({
      imports: [ControlsComponent],
      providers: [
        { provide: GameEngineService, useValue: mockEngine }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle start/stop', () => {
    const startBtn = fixture.nativeElement.querySelector('button');
    expect(startBtn.textContent).toContain('Start');
    
    startBtn.click();
    expect(mockEngine.start).toHaveBeenCalled();

    mockEngine.isRunning.set(true);
    fixture.detectChanges();
    
    expect(startBtn.textContent).toContain('Pause');
    expect(startBtn.classList).toContain('running');

    startBtn.click();
    expect(mockEngine.stop).toHaveBeenCalled();
  });

  it('should update speed when number input changes', () => {
    const numberInput = fixture.nativeElement.querySelector('input[type="number"]#speed-input');
    numberInput.value = '500';
    numberInput.dispatchEvent(new Event('input'));
    expect(mockEngine.config().speed).toBe(500);
  });

  it('should display the current generation', () => {
    mockEngine.generation.set(10);
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelector('.stats');
    expect(stats.textContent).toContain('Gen: 10');
  });
});
