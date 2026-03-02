import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from './components/grid/grid.component';
import { ControlsComponent } from './components/controls/controls.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GridComponent, ControlsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Game of Life';
}
