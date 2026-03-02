import { Component, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GridComponent } from './components/grid/grid.component';
import { ControlsComponent } from './components/controls/controls.component';
import { GameEngineService } from './services/game-engine.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridComponent, ControlsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private engine = inject(GameEngineService);
  private document = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const { theme } = this.engine.config();
      const root = this.document.documentElement;

      root.style.setProperty('--primary-color', theme.primary);
      root.style.setProperty('--bg-color', theme.background);
      root.style.setProperty('--surface-color', theme.surface);
      root.style.setProperty('--text-color', theme.text);
    });
  }
}

