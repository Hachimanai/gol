import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameEngineService } from '../../services/game-engine.service';
import { PRESETS } from '../../constants/presets';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="controls-header">
      <div class="brand">
        <h1>Game Of Life</h1>
        <div class="stats">
          <span
            >Gen: <strong>{{ engine.generation() }}</strong></span
          >
        </div>
      </div>

      <div class="main-actions">
        <button
          [class.running]="engine.isRunning()"
          (click)="engine.isRunning() ? engine.stop() : engine.start()"
          [title]="engine.isRunning() ? 'Pause' : 'Start'"
        >
          {{ engine.isRunning() ? 'Pause' : 'Start' }}
        </button>
        <button (click)="engine.nextGeneration()" title="Next Generation">
          Step
        </button>
        <button (click)="engine.reset()" title="Clear Grid">Reset</button>
        <button (click)="engine.randomize()" title="Randomize Grid">
          Random
        </button>
      </div>

      <div class="settings">
        <div class="setting-item">
          <label for="size-input">Cell Size</label>
          <div class="input-with-unit">
            <input type="number" id="size-input" min="2" max="50" step="1" 
              [value]="engine.config().cellSize" 
              (input)="updateCellSize($event)">
            <span>px</span>
          </div>
        </div>

        <div class="setting-item">
          <label for="speed-input">Speed</label>
          <div class="input-with-unit">
            <input type="number" id="speed-input" min="1" max="1000" step="1" 
              [value]="engine.config().speed" 
              (input)="updateSpeed($event)">
            <span>ms</span>
          </div>
        </div>

        <div class="setting-item">
          <select (change)="applyPreset($event)">
            <option value="">-- Preset --</option>
            @for (preset of presets; track preset.name) {
              <option [value]="preset.name">{{ preset.name }}</option>
            }
          </select>
        </div>

        <button
          class="secondary btn-icon"
          (click)="toggleFullscreen()"
          title="Toggle Fullscreen"
        >
          ⛶
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .controls-header {
        padding: 0.5rem 1rem;
        background: #1a1a1a;
        color: #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        border-bottom: 1px solid #333;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        width: 100%;
        flex-wrap: wrap;
      }
      .brand {
        display: flex;
        align-items: baseline;
        gap: 1rem;
        h1 {
          margin: 0;
          font-size: 1.2rem;
          color: #00ff88;
          letter-spacing: 1px;
        }
        .stats {
          font-size: 0.85rem;
          color: #888;
          strong {
            color: #00ff88;
          }
        }
      }
      .main-actions,
      .settings {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .setting-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        label {
          color: #aaa;
          white-space: nowrap;
        }
      }
      button {
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        border: none;
        background: #333;
        color: #00ff88;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid #444;
      }
      button:hover {
        background: #444;
        transform: translateY(-1px);
      }
      button[title='Start'],
      button[title='Pause'] {
        min-width: 70px;
      }
      button.running {
        background: #ff4444;
        color: white;
        border-color: #ff4444;
      }
      button.running:hover {
        background: #cc3333;
      }

      .btn-icon {
        font-size: 1.1rem;
        padding: 0.3rem 0.6rem;
      }

      input[type="number"] { 
        background: #252525;
        border: 1px solid #444;
        color: #00ff88;
        padding: 0.3rem 0.5rem;
        border-radius: 4px;
        width: 60px;
        font-size: 0.85rem;
        font-family: inherit;
        outline: none;
        -moz-appearance: textfield;
      }
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"]:focus {
        border-color: #00ff88;
      }

      .input-with-unit {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        span { color: #666; font-size: 0.8rem; }
      }

      select { 

        padding: 0.35rem;
        border-radius: 4px;
        background: #252525;
        color: white;
        border: 1px solid #444;
        cursor: pointer;
        font-size: 0.85rem;
      }

      @media (max-width: 800px) {
        .controls-header {
          justify-content: center;
        }
      }
    `,
  ],
})
export class ControlsComponent {
  engine = inject(GameEngineService);
  presets = PRESETS;

  updateSpeed(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.engine.config.update((c) => ({ ...c, speed: +val }));
  }

  updateCellSize(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.engine.config.update((c) => ({ ...c, cellSize: +val }));
  }

  applyPreset(event: Event) {
    const name = (event.target as HTMLSelectElement).value;
    if (name) this.engine.applyPreset(name);
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
