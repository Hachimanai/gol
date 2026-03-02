import { Preset } from '../models/game.model';

export const PRESETS: Preset[] = [
  {
    name: 'Glider',
    description: 'Le plus petit vaisseau, se déplace en diagonale.',
    cells: [
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 }
    ]
  },
  {
    name: 'Blinker',
    description: 'Un oscillateur simple de période 2.',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ]
  },
  {
    name: 'Spaceship',
    description: 'Lightweight Spaceship (LWSS) - A small pattern that moves across the grid.',
    cells: [
      { x: -1, y: -1 }, { x: 2, y: -1 },
      { x: -2, y: 0 },
      { x: -2, y: 1 }, { x: 2, y: 1 },
      { x: -2, y: 2 }, { x: -1, y: 2 }, { x: 0, y: 2 }, { x: 1, y: 2 }
    ]
  }
];
