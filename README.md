# Game of Life (GOL) - Angular 21

Une implémentation haute performance du **Jeu de la Vie de John Conway**, développée avec **Angular 21**, les **Signals**, et le mode **Zoneless**.

![Angular Version](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🚀 Fonctionnalités

### ⚡ Performance Extrême

- **Architecture Multi-Thread** : La logique de simulation et le rendu sont déportés dans un **Web Worker** pour libérer le thread principal.
- **Rendu WebGL 2.0 & Instancing** : Utilisation de shaders GLSL et de l'instanciation GPU pour dessiner **des millions de cellules** à 60 FPS.
- **Rendu Hybride** : Bascule automatique entre WebGL (haute performance) et Canvas 2D (fallback optimisé) selon les besoins.
- **Optimisation Mémoire** : Représentation de la grille par un `Uint8Array` à plat, minimisant le garbage collection.

### 🎮 Simulation & Contrôles

- **Grille Dynamique** : Support de grilles géantes (ex: 500x500+) sans ralentissement.
- **Interaction Intuitive** : Dessinez ou effacez sur la grille par simple clic-glissé (Drag & Draw).
- **Paramétrage Précis** : Ajustez la vitesse (1ms à 1000ms) et la taille des cellules en temps réel.
- **Presets Célèbres** : Chargez instantanément des motifs iconiques (Blinker, Glider, Pulsar, Spaceship, Gosper Glider Gun).

### 📊 Statistiques & Monitoring

- **FPS Réel** : Compteur de fréquence de rafraîchissement lissé en temps réel.
- **Sparkline de Population** : Graphique SVG minimaliste affichant l'évolution du nombre de cellules vivantes sur les dernières générations.

### 🎨 Personnalisation & Accessibilité

- **Système de Thèmes** : Basculez entre plusieurs thèmes visuels (Classic, Matrix, Plasma, High Contrast, Sunset).
- **Mode Plein Écran** : Immersion totale dans la simulation.
- **A11y** : Interface entièrement accessible, respectant les normes WCAG AA.

### ⌨️ Raccourcis Clavier

- `Espace` : Play / Pause
- `S` ou `→` : Prochaine génération (Step)
- `R` : Réinitialiser la grille (Reset)
- `C` : Génération aléatoire (Chaos)
- `F` : Basculer le mode plein écran

## 🛠️ Stack Technique

- **Framework** : Angular 21 (Composants Standalone)
- **State Management** : Angular Signals
- **Change Detection** : **Zoneless** (sans `zone.js`) pour des performances maximales.
- **Workers** : Web Workers + OffscreenCanvas.
- **Styles** : SCSS avec variables CSS dynamiques.

## 📦 Installation & Lancement

### Pré-requis

- Node.js (v20+)
- npm

### Installation

```bash
git clone https://github.com/Hachimanai/gol.git
cd gol
npm install
```

### Développement

Lancer le serveur de développement :

```bash
npm start
```

L'application sera disponible sur `http://localhost:4200`.

### Tests & Qualité

```bash
# Lancer les tests unitaires
npm test

# Lancer le linter
npm run lint
```

### Build

```bash
npm run build
```

## 📜 Licence

Ce projet est sous licence MIT.
