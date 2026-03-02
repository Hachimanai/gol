# Backlog des Tâches - Jeu de la Vie

## Phase 1 : Architecture & Fondations [MODE: ARCHITECT]

- [x] **Modèle de Données** : Définir l'interface `Cell` et la structure de la `Grid`.
- [x] **Interface du Service** : Définir le contrat du `GameEngineService` (start, stop, nextGeneration, toggleCell).
- [x] **Définition des Presets** : Créer un catalogue des structures célèbres (Glider, Pulsar, etc.) sous forme de coordonnées relatives.

## Phase 2 : Développement du Moteur [MODE: DEV]

- [x] **Implémentation du Service** : Développer la logique des 4 règles de Conway.
- [x] **Gestion de l'État** : Utiliser les Signals Angular pour une réactivité optimale de la grille.
- [x] **Générateur Aléatoire** : Implémenter la fonction de remplissage selon la densité initiale.

## Phase 3 : Interface Utilisateur & Interactions [MODE: DEV]

- [x] **Composant Grille** : Créer le rendu visuel (CSS Grid ou Canvas selon performance).
- [x] **Barre d'Outils** : Implémenter les contrôles (Lecture, Pause, Reset, Vitesse).
- [x] **Menu des Presets** : Ajouter une liste déroulante pour charger les modèles pré-définis.
- [x] **Mode Plein Écran** : Implémenter l'API Fullscreen pour la grille.
- [x] **Éditeur Manuel** : Permettre l'édition des cellules au clic/drag.

## Phase 4 : Validation & Qualité [MODE: QA / REVIEWER]

- [x] **Tests Unitaires** : Couvrir les règles de Conway (cas limites : bordures de grille).
- [x] **Tests de Performance** : Valider la fluidité (60 FPS) sur une grille 50x50.
- [x] **Audit Accessibilité** : Vérifier le contraste et la navigation clavier pour les contrôles.

## Phase 5 : Sécurité & Audit [MODE: WHITE HAT]

- [x] **Audit du Code** : Vérifier qu'aucune injection n'est possible via les paramètres de configuration.
- [x] **Dépendances** : Scanner les packages pour des vulnérabilités connues.

## Phase 6 : Évolutions & Expérience Utilisateur [MODE: PO]

- [ ] **Persistance** : Sauvegarder l'état de la grille et les réglages dans le LocalStorage.
- [x] **Thématisation** : Ajouter un sélecteur de thèmes de couleurs (Classique, Matrix, Plasma, High Contrast).
- [x] **Statistiques Avancées** : Afficher un graphique de la population au fil des générations.
- [ ] **Raccourcis Clavier** : Implémenter des contrôles rapides (Play/Pause, Reset, Next Step).
- [ ] **Export/Import** : Permettre de télécharger un motif au format JSON ou RLE.
