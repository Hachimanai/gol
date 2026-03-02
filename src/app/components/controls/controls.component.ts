import { Component, inject, computed } from '@angular/core';
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

  sparklinePoints = computed(() => {
    const history = this.engine.populationHistory();
    if (history.length === 0) return '';
    
    const maxVal = Math.max(...history, 1);
    const minVal = 0;
    
    return history.map((val, index) => {
      const x = (index / Math.max(history.length - 1, 1)) * 100;
      const y = 20 - ((val - minVal) / maxVal) * 20;
      return `${x},${y}`;
    }).join(' ');
  });

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
    if (isNaN(val) || val < 1) val = 1;
    if (val > 50) val = 50;

    this.engine.config.update((c) => ({ ...c, cellSize: val }));
  }

  updateDensity(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = parseFloat(input.value);
    
    // Conversion pourcentage -> 0.0-1.0
    if (isNaN(val) || val < 0) val = 0;
    if (val > 100) val = 100;
    
    this.engine.config.update((c) => ({ ...c, initialDensity: val / 100 }));
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
