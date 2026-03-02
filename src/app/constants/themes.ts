import { GameTheme } from '../models/game.model';

export const THEMES: GameTheme[] = [
  {
    name: 'Classic',
    alive: '#00ff88',
    dead: '#1a1a1a',
    grid: '#333333',
    primary: '#00ff88',
    background: '#121212',
    surface: '#1a1a1a',
    text: '#ffffff'
  },
  {
    name: 'Matrix',
    alive: '#00FF41',
    dead: '#000000',
    grid: '#003B00',
    primary: '#00FF41',
    background: '#000000',
    surface: '#001100',
    text: '#00FF41'
  },
  {
    name: 'Plasma',
    alive: '#FF00CC',
    dead: '#120458',
    grid: '#240b36',
    primary: '#3300FF',
    background: '#120458',
    surface: '#240b36',
    text: '#FFFFFF'
  },
  {
    name: 'High Contrast',
    alive: '#FFFFFF',
    dead: '#000000',
    grid: '#444444',
    primary: '#FFFFFF',
    background: '#000000',
    surface: '#222222',
    text: '#FFFFFF'
  },
  {
    name: 'Sunset',
    alive: '#FF5F6D',
    dead: '#2C3E50',
    grid: '#34495E',
    primary: '#FFC371',
    background: '#2C3E50',
    surface: '#34495E',
    text: '#FFFFFF'
  }
];
