import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { GridComponent } from './components/grid/grid.component';
import { ControlsComponent } from './components/controls/controls.component';
import { GameEngineService } from './services/game-engine.service';
import { THEMES } from './constants/themes';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let engine: GameEngineService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, GridComponent, ControlsComponent],
      providers: [GameEngineService]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    engine = TestBed.inject(GameEngineService);
    
    // Configurer un état minimal pour le moteur
    engine.config.set({ 
      rows: 5, columns: 5, speed: 100, initialDensity: 0, 
      resizeMode: 'fill', cellSize: 10, theme: THEMES[0] 
    });
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should handle keyboard shortcuts', () => {
    spyOn(engine, 'start');
    spyOn(engine, 'stop');
    spyOn(engine, 'nextGeneration');
    spyOn(engine, 'reset');
    spyOn(engine, 'randomize');

    // Test Espace (Start)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(engine.start).toHaveBeenCalled();

    // Test S (Next Gen)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
    expect(engine.nextGeneration).toHaveBeenCalled();

    // Test ArrowRight (Next Gen)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(engine.nextGeneration).toHaveBeenCalledTimes(2);

    // Test R (Reset)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
    expect(engine.reset).toHaveBeenCalled();

    // Test C (Randomize)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC' }));
    expect(engine.randomize).toHaveBeenCalled();
  });

  it('should NOT trigger shortcuts when typing in inputs', () => {
    spyOn(engine, 'reset');
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR', bubbles: true }));
    expect(engine.reset).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should render components', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-controls')).toBeTruthy();
    expect(compiled.querySelector('app-grid')).toBeTruthy();
  });
});
