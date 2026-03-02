import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlsComponent } from './controls.component';
import { GameEngineService } from '../../services/game-engine.service';
import { PRESETS } from '../../constants/presets';
import { signal } from '@angular/core';

describe('ControlsComponent', () => {
  let component: ControlsComponent;
  let fixture: ComponentFixture<ControlsComponent>;
  let mockEngine: jasmine.SpyObj<GameEngineService>;

  beforeEach(async () => {
    mockEngine = jasmine.createSpyObj('GameEngineService', ['start', 'stop', 'nextGeneration', 'reset', 'randomize', 'applyPreset']);
    
    // Configurer les signaux simulés
    (mockEngine as any).isRunning = signal(false);
    (mockEngine as any).generation = signal(0);
    (mockEngine as any).config = signal({ 
      rows: 40, 
      columns: 60, 
      speed: 100, 
      initialDensity: 0.25, 
      resizeMode: 'fill', 
      cellSize: 10 
    });
    (mockEngine as any).grid = signal(new Uint8Array(0));

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

    (mockEngine as any).isRunning.set(true);
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
    (mockEngine as any).generation.set(10);
    fixture.detectChanges();
    const stats = fixture.nativeElement.querySelector('.stats');
    expect(stats.textContent).toContain('Gen: 10');
  });
});
