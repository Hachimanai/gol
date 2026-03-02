import { Component, effect, inject, HostListener } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { GridComponent } from './components/grid/grid.component';
import { ControlsComponent } from './components/controls/controls.component';
import { GameEngineService } from './services/game-engine.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GridComponent, ControlsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
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

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ne pas déclencher si on est dans un champ de saisie
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (this.engine.isRunning()) {
          this.engine.stop();
        } else {
          this.engine.start();
        }
        break;
      case 'KeyS':
      case 'ArrowRight':
        this.engine.nextGeneration();
        break;
      case 'KeyR':
        this.engine.reset();
        break;
      case 'KeyC':
        this.engine.randomize();
        break;
      case 'KeyF':
        this.toggleFullscreen();
        break;
    }
  }

  private toggleFullscreen() {
    const elem = this.document.querySelector('.app-container');
    if (!this.document.fullscreenElement) {
      elem?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      this.document.exitFullscreen();
    }
  }
}
