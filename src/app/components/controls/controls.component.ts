import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../services/game-engine.service';
import { PRESETS } from '../../constants/presets';

import { THEMES } from '../../constants/themes';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.scss',
})
export class ControlsComponent {

  engine = inject(GameEngineService);
  presets = PRESETS;
  themes = THEMES;

  updateSpeed(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    
    // Validation de sécurité : Empêcher les valeurs absurdes ou négatives
    if (isNaN(val) || val < 1) val = 1;
    if (val > 1000) val = 1000;
    
    this.engine.config.update((c) => ({ ...c, speed: val }));
  }

  updateCellSize(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    
    // Validation de sécurité : Empêcher les tailles trop petites ou trop grandes
    if (isNaN(val) || val < 2) val = 2;
    if (val > 50) val = 50;

    this.engine.config.update((c) => ({ ...c, cellSize: val }));
  }

  applyPreset(event: Event) {
    const name = (event.target as HTMLSelectElement).value;
    if (name) this.engine.applyPreset(name);
  }

  applyTheme(event: Event) {
    const name = (event.target as HTMLSelectElement).value;
    const theme = THEMES.find(t => t.name === name);
    if (theme) this.engine.updateTheme(theme);
  }

  toggleFullscreen() {
    const elem = document.querySelector('.app-container');
    if (!document.fullscreenElement) {
      elem?.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  }
}
