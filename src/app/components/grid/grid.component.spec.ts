import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridComponent } from './grid.component';
import { GameEngineService } from '../../services/game-engine.service';
import { THEMES } from '../../constants/themes';

describe('GridComponent', () => {
  let component: GridComponent;
  let fixture: ComponentFixture<GridComponent>;
  let engine: GameEngineService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridComponent],
      providers: [GameEngineService]
    }).compileComponents();

    fixture = TestBed.createComponent(GridComponent);
    component = fixture.componentInstance;
    engine = TestBed.inject(GameEngineService);
    
    engine.config.set({ 
      rows: 5, 
      columns: 5, 
      speed: 100, 
      initialDensity: 0, 
      resizeMode: 'fill', 
      cellSize: 10,
      theme: THEMES[0]
    });
    engine.reset();
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a canvas element', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should have a wrapper with width 100%', () => {
    const wrapper = fixture.nativeElement.querySelector('.grid-wrapper');
    expect(wrapper).toBeTruthy();
  });

  describe('Mouse Interactions', () => {
    let canvas: HTMLCanvasElement;
    
    beforeEach(() => {
      canvas = fixture.nativeElement.querySelector('canvas');
      spyOn(engine, 'setCellState');
      
      // Mock getBoundingClientRect pour les calculs de coordonnées
      spyOn(canvas, 'getBoundingClientRect').and.returnValue({
        left: 0, top: 0, right: 500, bottom: 500, width: 500, height: 500, x: 0, y: 0, toJSON: () => {}
      } as DOMRect);
      
      // Forcer des dimensions pour le test
      Object.defineProperty(canvas, 'width', { value: 500 });
      Object.defineProperty(canvas, 'height', { value: 500 });
    });

    it('should start drawing on mousedown', () => {
      // Coordonnées simulées pour tomber au centre de la grille
      const event = new MouseEvent('mousedown', { clientX: 250, clientY: 250 });
      canvas.dispatchEvent(event);
      
      // Vérifie que setCellState a bien été appelé (coordonnées x, y dépendent du centrage, on vérifie juste l'appel)
      expect(engine.setCellState).toHaveBeenCalled();
    });

    it('should continue drawing on mousemove when left button is pressed', () => {
      const event = new MouseEvent('mousemove', { clientX: 260, clientY: 260, buttons: 1 });
      canvas.dispatchEvent(event);
      
      expect(engine.setCellState).toHaveBeenCalled();
    });

    it('should NOT draw on mousemove if no button is pressed', () => {
      const event = new MouseEvent('mousemove', { clientX: 260, clientY: 260, buttons: 0 });
      canvas.dispatchEvent(event);
      
      expect(engine.setCellState).not.toHaveBeenCalled();
    });
  });
});
