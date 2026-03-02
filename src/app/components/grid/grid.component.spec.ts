import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridComponent } from './grid.component';
import { GameEngineService } from '../../services/game-engine.service';

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
      cellSize: 10 
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
});
