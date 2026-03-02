# Projet : Jeu de la Vie (Conway's Game of Life)

## 1. Vision du Produit

L'objectif est de créer une application web interactive et visuellement attrayante permettant de simuler le "Jeu de la Vie" de John Conway. L'application doit servir d'outil pédagogique et de démonstration technique de la puissance d'Angular pour la manipulation d'états complexes et de rendus fluides.

## 2. Besoins Utilisateurs (User Stories)

- **Visualisation** : En tant qu'utilisateur, je veux voir une grille de cellules qui évoluent selon les règles de Conway.
- **Interaction** : En tant qu'utilisateur, je veux pouvoir cliquer sur des cellules pour les activer/désactiver avant ou pendant la simulation.
- **Contrôle** : En tant qu'utilisateur, je veux pouvoir démarrer, mettre en pause et réinitialiser la simulation.
- **Configuration** : En tant qu'utilisateur, je veux pouvoir ajuster la vitesse de simulation et la taille de la grille.
- **Presets** : En tant qu'utilisateur, je veux pouvoir charger des modèles de démonstration (ex: Gliders, Pulsars, Spaceships) pour observer des comportements célèbres du Jeu de la Vie.
- **Fullscreen** : En tant qu'utilisateur, je veux pouvoir passer la grille en plein écran pour une immersion totale dans la simulation.

## 3. Paramètres Configurables (Backlog Technique)

Les paramètres suivants doivent être exposés dans l'interface :

- **Vitesse (ms)** : Délai entre chaque génération.
- **Taille de la Grille** : Nombre de colonnes et de lignes (ou dimension carrée).
- **Densité Initiale** : Pourcentage de cellules vivantes lors d'une génération aléatoire.
- **Couleurs** : Thème visuel (cellules vivantes vs mortes).

## 4. Critères d'Acceptation (MVP)

- La grille doit être responsive.
- Les 4 règles de base de Conway doivent être respectées.
- Performance : La simulation doit rester fluide (60 FPS).
