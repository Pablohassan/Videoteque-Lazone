# 🏗️ Architecture du Projet - Cine-Scan-Connect

## 📊 Vue d'Ensemble de l'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Header    │  │ HeroSection │  │ MovieGrid   │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ OrderMovie  │  │ OrderedMovi │  │ MovieDetail │            │
│  │    Form     │  │     es      │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Routes    │  │  Services   │  │ Middleware  │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Scripts   │  │    Utils    │  │   Types     │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES (PostgreSQL)                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │    Users    │  │   Movies    │  │   Genres    │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Actors    │  │   Reviews   │  │MovieRequest │            │
│  │             │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Données

### 1. Flux Principal (Catalogue de Films)

```
User Request → React Router → Component → API Service → Backend Route → Service → Prisma → PostgreSQL
     ↑                                                                                           │
     └───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Flux de Scan Automatique

```
Scheduler → MovieScanner → File System → TMDB API → MovieService → Prisma → PostgreSQL
     ↑                                                                                    │
     └────────────────────────────────────────────────────────────────────────────────────┘
```

### 3. Flux d'Authentification

```
Login Form → AuthService → Backend Auth Route → AuthService → JWT Generation → Local Storage
     ↑                                                                                    │
     └────────────────────────────────────────────────────────────────────────────────────┘
```

## 🧩 Composants Frontend

### Structure des Composants

```
src/components/
├── 📁 ui/                    # Composants Shadcn/ui
│   ├── button.tsx           # Boutons standardisés
│   ├── card.tsx             # Cartes et conteneurs
│   ├── dialog.tsx           # Modales et popups
│   ├── form.tsx             # Formulaires avec validation
│   └── ...                  # Autres composants UI
├── 📁 header.tsx            # Barre de navigation
├── 📁 hero-section.tsx      # Section d'accueil
├── 📁 movie-grid.tsx        # Grille de films
├── 📁 order-movie-form.tsx  # Formulaire de commande
├── 📁 ordered-movies.tsx    # Liste des commandes
└── 📁 movie-scanner.tsx     # Interface de scan
```

### Hiérarchie des Composants

```
App
├── Index (Page principale)
│   ├── Header
│   ├── HeroSection
│   ├── OrderMovieForm (Modal)
│   └── Tabs
│       ├── Catalog Tab
│       │   ├── MovieGrid (Suggestions)
│       │   ├── Genre Filters
│       │   └── MovieGrid (Tous les films)
│       └── Orders Tab
│           └── OrderedMovies
│               └── OrderMovieForm
└── MovieDetail (Page détail)
    ├── MovieInfo
    ├── ReviewForm
    └── ReviewList
```

## 🔌 Services Backend

### Architecture des Services

```
server/services/
├── 📁 authService.ts        # Authentification et JWT
├── 📁 movieService.ts       # Gestion des films
├── 📁 reviewService.ts      # Gestion des avis
├── 📁 movieRequestService.ts # Gestion des demandes
└── 📁 index.ts              # Export centralisé
```

### Pattern de Service

```typescript
export class MovieService {
  // Méthodes publiques pour l'API
  async getAllMovies(options: PaginationOptions): Promise<MoviesResponse>;
  async getMovieById(id: number): Promise<MovieResponse>;
  async searchMovies(query: string): Promise<SearchResponse>;

  // Méthodes privées pour la logique interne
  private formatMovieData(movie: PrismaMovie): APIMovie;
  private validateMovieData(data: CreateMovieData): boolean;
}
```

## 🛣️ Routes API

### Structure des Routes

```
server/routes/
├── 📁 auth.ts               # /api/auth/*
├── 📁 movies.ts             # /api/movies/*
├── 📁 reviews.ts            # /api/reviews/*
├── 📁 requests.ts           # /api/requests/*
└── 📁 movieRequests.ts      # /api/movie-requests/*
```

### Middleware de Sécurité

```typescript
// server/index.ts
app.use(helmet()); // Headers de sécurité
app.use(cors()); // Configuration CORS
app.use(rateLimit()); // Limitation de débit
app.use(express.json()); // Parsing JSON
app.use("/api/", authMiddleware); // Authentification API
```

## 🗄️ Modèle de Données

### Relations Prisma

```prisma
// Relations principales
User → MovieRequest (1:N)
User → Review (1:N)
Movie → Review (1:N)
Movie → MovieGenre (N:N)
Movie → MovieActor (N:N)

// Tables de liaison
MovieGenre (movieId, genreId)
MovieActor (movieId, actorId)
```

### Schéma de Base

```sql
-- Tables principales
users (id, email, name, password, createdAt)
movies (id, tmdbId, title, synopsis, posterUrl, ...)
genres (id, name)
actors (id, name, profileUrl)

-- Tables de liaison
movie_genres (movieId, genreId)
movie_actors (movieId, actorId, character)

-- Tables métier
reviews (id, movieId, authorId, rating, comment, createdAt)
movie_requests (id, userId, title, comment, status, requestedAt)
```

## 🔄 Scripts et Automatisation

### Architecture des Scripts

```
server/scripts/
├── 📁 movieScanner.ts       # Scanner de fichiers
├── 📁 autoIndexer.ts        # Indexation automatique
└── 📁 index.ts              # Point d'entrée
```

### Système de Scan

```typescript
class MovieScanner {
  private config: ScannerConfig;
  private tmdbClient: TMDBClient;

  async scanFolder(): Promise<ScanResult>;
  async parseFilename(filename: string): Promise<ParsedMovie>;
  async enrichWithTMDB(parsed: ParsedMovie): Promise<TMDBMovie>;
  async saveToDatabase(movie: MovieData): Promise<void>;
}
```

## 🔐 Sécurité et Authentification

### Couches de Sécurité

```
1. Helmet (Headers de sécurité)
2. CORS (Contrôle d'accès)
3. Rate Limiting (Limitation de débit)
4. JWT Validation (Authentification)
5. Input Validation (Validation des données)
6. SQL Injection Protection (Prisma)
```

### Flux d'Authentification

```typescript
// 1. Login
POST /api/auth/login → AuthService.login() → JWT Generation

// 2. Validation des requêtes
Request → JWT Middleware → Route Handler → Service → Database

// 3. Logout
POST /api/auth/logout → Token Invalidation → Local Storage Cleanup
```

## 📊 Performance et Optimisation

### Stratégies de Performance

```
Frontend:
- React.memo pour les composants
- useMemo/useCallback pour les calculs
- Lazy loading des composants
- Optimisation des images

Backend:
- Pagination des résultats
- Indexation de base de données
- Mise en cache des requêtes TMDB
- Compression des réponses
```

### Monitoring

```typescript
// Logs structurés
console.log(`✅ ${movies.length} films trouvés sur ${total} total`);

// Métriques de performance
const startTime = Date.now();
// ... opération ...
const duration = Date.now() - startTime;
console.log(`⏱️ Opération terminée en ${duration}ms`);
```

## 🚀 Déploiement et Production

### Configuration de Production

```bash
# Variables d'environnement
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://prod:pass@prod-host:5432/cine_scan_connect

# Build et démarrage
npm run build
npm start
```

### Architecture de Production

```
Internet → Load Balancer → Node.js Cluster → PostgreSQL Cluster
                              ↓
                        File Storage
```

## 🔧 Configuration et Environnement

### Variables d'Environnement par Environnement

```bash
# Development
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173

# Production
NODE_ENV=production
PORT=3001
CLIENT_URL=https://yourdomain.com

# Staging
NODE_ENV=staging
PORT=3001
CLIENT_URL=https://staging.yourdomain.com
```

### Configuration Dynamique

```typescript
// server/config/index.ts
export const config = {
  port: process.env.PORT || 3001,
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  tmdb: {
    apiKey: process.env.VITE_TMDB_API_KEY,
    baseUrl: process.env.TMDB_BASE_URL,
  },
  scanner: {
    enabled: process.env.AUTO_SCAN_ENABLED !== "false",
    interval: parseInt(process.env.AUTO_SCAN_INTERVAL || "3600000"),
  },
};
```

---

## 📚 Ressources Supplémentaires

- **Documentation complète** : [README.md](./README.md)
- **Guide de démarrage** : [QUICKSTART.md](./QUICKSTART.md)
- **Schéma de base** : [../prisma/schema.prisma](../prisma/schema.prisma)
- **Configuration** : [../env.example](../env.example)

---

_Architecture documentée pour Cine-Scan-Connect v1.0.0_
