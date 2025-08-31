# 📽️ Videotek - Documentation Complète

## 🎯 Vue d'ensemble

**Cine-Scan-Connect** est une plateforme moderne de gestion de catalogue de films avec fonctionnalités avancées de scan automatique, intégration TMDB, et système de demandes de films. L'application combine un frontend React moderne avec un backend Node.js robuste.

## 🏗️ Architecture du Projet

### Structure des Dossiers

```
cine-scan-connect/
├── 📁 src/                    # Frontend React
│   ├── 📁 components/         # Composants UI réutilisables
│   ├── 📁 pages/             # Pages de l'application
│   ├── 📁 services/          # Services frontend (API calls)
│   ├── 📁 hooks/             # Hooks React personnalisés
│   ├── 📁 types/             # Types TypeScript
│   └── 📁 lib/               # Utilitaires et configurations
├── 📁 server/                 # Backend Node.js
│   ├── 📁 routes/            # Routes API Express
│   ├── 📁 services/          # Logique métier
│   ├── 📁 middleware/        # Middleware Express
│   ├── 📁 scripts/           # Scripts utilitaires
│   └── 📁 utils/             # Utilitaires backend
├── 📁 prisma/                 # Schéma et migrations de base de données
├── 📁 public/                 # Assets statiques
└── 📁 docs/                   # Documentation
```

## 🚀 Technologies Utilisées

### Frontend

- **React 18** - Bibliothèque UI moderne
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS utilitaire
- **Shadcn/ui** - Composants UI accessibles
- **Radix UI** - Composants primitifs
- **React Router** - Navigation SPA
- **React Query** - Gestion d'état serveur

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Prisma** - ORM moderne
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification
- **bcrypt** - Hashage des mots de passe

### Outils & Services

- **TMDB API** - Base de données de films
- **Supabase** - Backend-as-a-Service
- **ESLint** - Linting du code
- **Prettier** - Formatage du code

## 🗄️ Base de Données

### Modèles Principaux

#### User

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  password: string; // Hashé avec bcrypt
  createdAt: DateTime;
  reviews: Review[];
  movieRequests: MovieRequest[];
}
```

#### Movie

```typescript
interface Movie {
  id: number;
  tmdbId?: number; // ID unique TMDB
  title: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: DateTime;
  duration: number; // En minutes
  rating?: number; // Note TMDB (0-10)
  isWeeklySuggestion: boolean;

  // Métadonnées du fichier local
  localPath?: string;
  filename?: string;
  fileSize?: bigint;
  resolution?: string; // 1080p, 720p, etc.
  codec?: string; // x264, h265, etc.
  container?: string; // mkv, mp4, etc.
  lastScanned?: DateTime;

  // Relations
  genres: MovieGenre[];
  actors: MovieActor[];
  reviews: Review[];
}
```

#### MovieRequest

```typescript
interface MovieRequest {
  id: number;
  title: string;
  comment?: string;
  status: "pending" | "processing" | "available";
  requestedAt: DateTime;
  updatedAt: DateTime;
  userId: number;
  user: User;
}
```

## 🔧 Configuration et Installation

### Prérequis

- Node.js 18+
- PostgreSQL 12+
- npm, yarn ou bun

### Variables d'Environnement

Créez un fichier `.env` basé sur `env.example` :

```bash
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/cine_scan_connect"
DIRECT_URL="postgresql://user:password@localhost:5432/cine_scan_connect"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT
JWT_EXPIRES_IN="7d"

# TMDB API
VITE_TMDB_API_KEY="your-tmdb-api-key"
TMDB_BASE_URL="https://api.themoviedb.org/3"

# Scanner de films
MOVIES_FOLDER_PATH="/path/to/your/movies"

# Serveur
PORT=3001
NODE_ENV="development"

# Scan automatique
AUTO_SCAN_ENABLED=true
AUTO_SCAN_INTERVAL=3600000 # 1 heure

# CORS
CLIENT_URL="http://localhost:5173"
```

### Installation

```bash
# 1. Cloner le projet
git clone <repository-url>
cd cine-scan-connect

# 2. Installer les dépendances
npm install

# 3. Configurer la base de données
npm run db:generate
npm run db:push

# 4. Lancer en développement
npm run dev
```

## 🎬 Fonctionnalités Principales

### 1. Catalogue de Films

- **Affichage en grille** avec filtres par genre
- **Recherche** par titre et synopsis
- **Suggestions hebdomadaires** mises en avant
- **Navigation par onglets** (Collection / Commandes)

### 2. Scanner Automatique de Films

- **Scan automatique** du dossier de films configuré
- **Parsing intelligent** des noms de fichiers
- **Intégration TMDB** pour récupérer les métadonnées
- **Détection automatique** de la qualité, codec, résolution

### 3. Système de Demandes

- **Formulaire de commande** de films non disponibles
- **Suivi des statuts** : en attente, en cours, disponible
- **Notifications** et mises à jour en temps réel

### 4. Authentification et Sécurité

- **Système de connexion** sécurisé
- **JWT** pour la gestion des sessions
- **Middleware de validation** des requêtes
- **Rate limiting** pour prévenir les abus

## 🔌 API Endpoints

### Authentification

```
POST /api/auth/register     # Inscription
POST /api/auth/login        # Connexion
POST /api/auth/logout       # Déconnexion
GET  /api/auth/profile      # Profil utilisateur
```

### Films

```
GET    /api/movies          # Liste des films (avec pagination)
GET    /api/movies/:id      # Détails d'un film
GET    /api/movies/search   # Recherche de films
GET    /api/movies/suggestions # Suggestions hebdomadaires
```

### Demandes de Films

```
GET    /api/movie-requests      # Demandes de l'utilisateur
POST   /api/movie-requests      # Créer une demande
PUT    /api/movie-requests/:id  # Mettre à jour une demande
```

### Avis

```
GET    /api/reviews/movie/:id   # Avis d'un film
POST   /api/reviews             # Créer un avis
PUT    /api/reviews/:id         # Modifier un avis
DELETE /api/reviews/:id         # Supprimer un avis
```

### Utilitaires

```
GET  /api/health           # Vérification de santé
POST /api/scan-now        # Déclencher un scan manuel
```

## 🎨 Composants UI Principaux

### Header

- Barre de navigation avec recherche
- Menu utilisateur et authentification
- Bouton de connexion Supabase

### HeroSection

- Bannière principale avec titre
- Bouton "Commander mon putin de film !"
- Design responsive et moderne

### MovieGrid

- Affichage en grille des films
- Filtres par genre
- Pagination et recherche

### OrderMovieForm

- Formulaire modal pour commander des films
- Validation des champs
- Gestion des états de chargement

### OrderedMovies

- Liste des demandes de films
- Filtrage par statut
- Actions de mise à jour

## 🔄 Scripts et Automatisation

### Scan Automatique

```typescript
// Configuration dans server/index.ts
const AUTO_SCAN_INTERVAL = 3600000; // 1 heure
const AUTO_SCAN_ENABLED = true;

// Script principal : server/scripts/movieScanner.ts
class MovieScanner {
  async scanFolder(): Promise<void>;
  async parseFilename(filename: string): Promise<ParsedMovie>;
  async createMovie(
    tmdbMovie: TMDBMovie,
    genres: string[],
    actors: string[]
  ): Promise<void>;
}
```

### Indexation Automatique

```typescript
// Script : server/scripts/autoIndexer.ts
class AutoIndexer {
  async indexMovies(): Promise<void>;
  async updateWeeklySuggestions(): Promise<void>;
}
```

## 🚀 Déploiement

### Production

```bash
# Build de production
npm run build

# Démarrage du serveur
npm start
```

### Variables de Production

- `NODE_ENV=production`
- `PORT` configuré selon l'environnement
- `DATABASE_URL` pointant vers la base de production
- `CLIENT_URL` configuré pour le domaine de production

## 🧪 Tests et Qualité

### Linting

```bash
npm run lint          # Vérification ESLint
```

### Structure des Tests (à implémenter)

```
tests/
├── unit/             # Tests unitaires
├── integration/      # Tests d'intégration
└── e2e/             # Tests end-to-end
```

## 🔍 Monitoring et Logs

### Logs Serveur

- **Console** : Logs détaillés avec émojis
- **Niveaux** : Info, Warning, Error
- **Contexte** : Timestamp, action, résultat

### Métriques

- Nombre de films scannés
- Temps de scan
- Erreurs et succès
- Utilisation des ressources

## 🛠️ Développement

### Commandes Utiles

```bash
# Développement
npm run dev              # Lancement complet (frontend + backend)
npm run dev:frontend     # Frontend uniquement
npm run dev:backend      # Backend uniquement

# Base de données
npm run db:generate      # Générer le client Prisma
npm run db:push          # Pousser le schéma
npm run db:migrate       # Créer une migration
npm run db:reset         # Reset complet de la base

# Scanner
npm run scan:movies      # Scan manuel des films
npm run index:movies     # Indexation manuelle
```

### Workflow de Développement

1. **Feature Branch** : Créer une branche pour chaque fonctionnalité
2. **Développement** : Implémenter avec tests
3. **Code Review** : Validation par l'équipe
4. **Merge** : Intégration dans la branche principale
5. **Déploiement** : Mise en production automatique

## 📚 Ressources et Références

### Documentation Officielle

- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com/)

### APIs Externes

- [TMDB API](https://developers.themoviedb.org/3)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contribution

### Standards de Code

- **TypeScript strict** : Configuration stricte activée
- **ESLint** : Règles de qualité automatiques
- **Prettier** : Formatage automatique
- **Conventional Commits** : Messages de commit standardisés

### Architecture

- **Composants fonctionnels** pour le frontend
- **Classes de service** pour le backend
- **Séparation des responsabilités** claire
- **Tests unitaires** pour la logique métier

---

## 📞 Support et Contact

Pour toute question ou problème :

- **Issues GitHub** : Créer une issue dans le repository
- **Documentation** : Consulter cette documentation
- **Équipe** : Contacter l'équipe de développement

---

_Dernière mise à jour : 2024_
