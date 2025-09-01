# 🔍 Service de Surveillance Automatique des Films

## Vue d'ensemble

Le service de surveillance automatique utilise **Chokidar** pour détecter en temps réel les nouveaux fichiers de films ajoutés dans le dossier configuré. Contrairement au système de scan périodique précédent, ce service réagit immédiatement aux changements de fichiers sans nécessiter de redémarrage du serveur.

## 🚀 Fonctionnalités

### Surveillance en Temps Réel

- ✅ Détection automatique des nouveaux fichiers
- ✅ Détection des modifications de fichiers existants
- ✅ Support récursif des sous-dossiers
- ✅ Anti-rebond pour éviter les doublons
- ✅ Extensions configurables

### Indexation Intelligente

- 🎬 Parsing automatique des noms de fichiers
- 🔍 Recherche TMDB avec stratégies multiples
- 💾 Sauvegarde en base avec gestion des relations
- 📊 Logs détaillés et rapports d'erreurs

### Intégration Serveur

- 🌐 Démarrage automatique avec l'application
- 📡 API endpoints pour contrôle et monitoring
- 🔄 Arrêt propre et gestion des signaux

## ⚙️ Configuration

### Variables d'Environnement

```bash
# Surveillance automatique
AUTO_WATCH_ENABLED=true          # Activer/désactiver la surveillance
AUTO_INDEX_EXISTING=false        # Indexer les fichiers existants au démarrage

# Configuration des dossiers
MOVIES_FOLDER_PATH="/path/to/movies"  # Chemin du dossier de films
```

### Options Avancées

Le service peut être configuré via les options du constructeur :

```typescript
const watcher = new MovieWatcherService({
  watchPath: "/custom/path/to/movies", // Chemin personnalisé
  extensions: [".mp4", ".mkv", ".avi"], // Extensions à surveiller
  debounceMs: 1000, // Délai anti-rebond (ms)
  recursive: true, // Surveillance récursive
});
```

## 📡 API Endpoints

### Statut de la Surveillance

```http
GET /api/watcher/status
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "watchPath": "/path/to/movies",
    "processingQueueSize": 0,
    "activeTimers": 0
  }
}
```

### Scan Manuel

```http
POST /api/scan-now
```

Déclenche un scan manuel de tous les fichiers existants.

## 🛠️ Scripts Disponibles

### Surveillance Indépendante

```bash
# Démarre uniquement le service de surveillance
pnpm run watch:movies
```

### Scripts de Maintenance

```bash
# Indexation complète (ancien système)
pnpm run index:movies

# Scan simple (ancien système)
pnpm run scan:movies
```

## 📋 Flux de Traitement

### 1. Détection de Fichier

```
📁 Nouveau fichier détecté: Movie.Name.2023.1080p.mp4
```

### 2. Anti-Rebond

```
⏱️ Attente de 2 secondes pour éviter les doublons...
```

### 3. Parsing du Nom

```
🎬 Extraction: "Movie Name" (2023)
```

### 4. Recherche TMDB

```
🔍 Recherche sur TMDB...
✅ Trouvé: "Movie Name" (2023)
```

### 5. Sauvegarde en Base

```
💾 Sauvegardé en base (ID: 123)
```

## 🔧 Architecture Technique

### Services

#### `MovieIndexingService`

- **Responsabilité** : Logique d'indexation unifiée
- **Méthodes principales** :
  - `scanDirectory()` : Scan récursif
  - `findOnTMDB()` : Recherche TMDB avec stratégies
  - `saveToDatabase()` : Sauvegarde avec relations
  - `indexSingleFile()` : Indexation individuelle

#### `MovieWatcherService`

- **Responsabilité** : Surveillance et orchestration
- **Méthodes principales** :
  - `start()` : Démarrage de la surveillance
  - `stop()` : Arrêt propre
  - `scheduleFileProcessing()` : Anti-rebond
  - `indexExistingFiles()` : Scan initial

### Stratégies TMDB

1. **Titre + Année** (si année disponible)
2. **Titre seul** avec correspondance d'année
3. **Titre nettoyé** (suppression caractères spéciaux)

### Gestion des Extensions

```typescript
[".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"];
```

## 🐛 Dépannage

### Problèmes Courants

#### Le service ne détecte pas les fichiers

- ✅ Vérifier que le dossier existe
- ✅ Vérifier les permissions d'accès
- ✅ Vérifier la configuration `MOVIES_FOLDER_PATH`

#### Erreurs TMDB

- ✅ Vérifier la clé API `TMDB_API_KEY`
- ✅ Vérifier la connectivité réseau
- ✅ Consulter les logs pour les détails

#### Fichiers dupliqués

- ✅ Le système utilise `upsert` pour éviter les doublons
- ✅ Vérifier les contraintes uniques en base

### Logs et Monitoring

#### Niveaux de Log

- `📁` : Détection de fichier
- `🔄` : Modification de fichier
- `🎬` : Début d'indexation
- `✅` : Succès
- `❌` : Erreur
- `⏱️` : Anti-rebond

#### Statistiques Disponibles

- État de la surveillance
- Taille de la file de traitement
- Nombre de timers actifs
- Chemin surveillé

## 🔄 Migration depuis l'Ancien Système

### Avant (Scan Périodique)

```bash
AUTO_SCAN_ENABLED=true
AUTO_SCAN_INTERVAL=3600000  # Toutes les heures
```

### Après (Surveillance Temps Réel)

```bash
AUTO_WATCH_ENABLED=true
AUTO_INDEX_EXISTING=false   # Indexer existants au démarrage
```

### Compatibilité

- ✅ Les anciens scripts restent fonctionnels
- ✅ API endpoints maintenus
- ✅ Configuration backward-compatible

## 🚀 Performance

### Optimisations

- **Anti-rebond** : Évite les traitements multiples
- **File d'attente** : Traite un fichier à la fois
- **Cache TMDB** : Réutilise les résultats
- **Transactions DB** : Intégrité des données

### Métriques

- Temps de réponse moyen : ~2-3 secondes par fichier
- Utilisation mémoire : ~50-100MB
- Impact CPU : Minimal (surveillance passive)

## 🔒 Sécurité

### Bonnes Pratiques

- ✅ Validation des chemins d'accès
- ✅ Sanitisation des noms de fichiers
- ✅ Gestion des erreurs robuste
- ✅ Arrêt propre des processus

### Permissions Requises

- Lecture sur le dossier de films
- Écriture sur la base de données
- Accès réseau pour TMDB API

---

_Dernière mise à jour : Décembre 2024_
