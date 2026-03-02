# Game of Life (GOL) - Angular 21

Une implémentation haute performance du **Jeu de la Vie de John Conway**, développée avec **Angular 21**, les **Signals**, et le mode **Zoneless**.

![Angular Version](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🚀 Fonctionnalités

### 🎮 Simulation & Contrôles
- **Moteur Ultra-Rapide** : Rendu via l'API Canvas et représentation de la grille par un `Uint8Array` à plat pour des performances optimales (supporte des grilles jusqu'à 6000x6000px).
- **Interaction Intuitive** : Dessinez ou effacez sur la grille par simple clic-glissé (Drag & Draw).
- **Paramétrage Précis** : Ajustez la vitesse (1ms à 1000ms) et la taille des cellules (1px à 50px) en temps réel.
- **Presets Célèbres** : Chargez instantanément des motifs iconiques (Blinker, Glider, Pulsar, Spaceship).

### 📊 Statistiques & Monitoring
- **FPS Réel** : Compteur de fréquence de rafraîchissement lissé en temps réel.
- **Sparkline de Population** : Graphique SVG minimaliste affichant l'évolution du nombre de cellules vivantes sur les 50 dernières générations.

### 🎨 Personnalisation
- **Système de Thèmes** : Basculez entre plusieurs thèmes visuels (Classic, Matrix, Plasma, High Contrast, Sunset).
- **Full UI Integration** : Le thème s'applique dynamiquement à l'ensemble de l'interface (Header, boutons, entrées) via des variables CSS.
- **Mode Plein Écran** : Immersion totale dans la simulation.

### ⌨️ Raccourcis Clavier
- `Espace` : Play / Pause
- `S` ou `→` : Prochaine génération (Step)
- `R` : Réinitialiser la grille (Reset)
- `C` : Génération aléatoire (Chaos)
- `F` : Basculer le mode plein écran

## 🛠️ Stack Technique

- **Framework** : Angular 21 (Composants Standalone)
- **State Management** : Angular Signals
- **Change Detection** : Zoneless (sans `zone.js`) pour des performances accrues.
- **Styles** : SCSS avec variables CSS dynamiques.
- **Qualité** : ESLint (angular-eslint) & Tests unitaires (Jasmine/Karma).

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
