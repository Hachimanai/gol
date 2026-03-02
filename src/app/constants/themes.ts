import { GameTheme } from '../models/game.model';

export const THEMES: GameTheme[] = [
  {
    name: 'Classic',
    alive: '#00ff88',
    dead: '#1a1a1a',
    grid: '#333333'
  },
  {
    name: 'Matrix',
    alive: '#00FF41',
    dead: '#000000',
    grid: '#003B00'
  },
  {
    name: 'Plasma',
    alive: '#FF00CC',
    dead: '#120458',
    grid: '#240b36'
  },
  {
    name: 'High Contrast',
    alive: '#FFFFFF',
    dead: '#000000',
    grid: '#444444'
  },
  {
    name: 'Sunset',
    alive: '#FF5F6D',
    dead: '#2C3E50',
    grid: '#34495E'
  }
];
