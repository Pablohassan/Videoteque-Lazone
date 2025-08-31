# 🔌 Documentation API - Videotek

> **API REST complète** pour Videotek avec authentification JWT et gestion des rôles.

## 📋 Vue d'Ensemble

### Base URL

```
http://localhost:3001/api
```

### Format des Réponses

```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie",
  "pagination": { ... } // Si applicable
}
```

### Gestion d'Erreurs

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "CODE_ERREUR",
  "statusCode": 400
}
```

## 🔐 Authentification

Toutes les requêtes nécessitent un token JWT dans l'en-tête :

```
Authorization: Bearer <token>
```

### Login

```http
POST /api/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Nom Utilisateur",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Inscription

```http
POST /api/auth/register
```

**Body:**

```json
{
  "email": "user@example.com",
  "name": "Nom Utilisateur",
  "password": "motdepasse123"
}
```

### Profil Utilisateur

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Nom Utilisateur",
      "role": "USER",
      "isActive": true,
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

## 🎬 Gestion des Films

### Lister les Films

```http
GET /api/movies
```

**Paramètres Query:**

- `page` (number): Page actuelle (défaut: 1)
- `limit` (number): Nombre d'éléments par page (défaut: 20)
- `genre` (string): Filtrer par genre
- `search` (string): Recherche par titre/synopsis

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "movies": [
      {
        "id": 1,
        "tmdbId": 12345,
        "title": "Inception",
        "synopsis": "Un voleur qui...",
        "posterUrl": "https://image.tmdb.org/t/p/w500/...",
        "trailerUrl": null,
        "releaseDate": "2010-07-16T00:00:00Z",
        "duration": 148,
        "rating": 8.8,
        "isWeeklySuggestion": true,
        "genres": [
          { "id": 1, "name": "Science-Fiction" },
          { "id": 2, "name": "Thriller" }
        ],
        "actors": [
          { "id": 1, "name": "Leonardo DiCaprio", "profileUrl": "..." }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Détails d'un Film

```http
GET /api/movies/:id
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "movie": {
      "id": 1,
      "title": "Inception",
      "synopsis": "Un voleur qui...",
      "posterUrl": "https://image.tmdb.org/t/p/w500/...",
      "releaseDate": "2010-07-16T00:00:00Z",
      "duration": 148,
      "rating": 8.8,
      "genres": [...],
      "actors": [...],
      "reviews": [
        {
          "id": 1,
          "rating": 9,
          "comment": "Excellent film !",
          "createdAt": "2024-01-15T10:30:00Z",
          "author": {
            "id": 2,
            "name": "Alice Dupont"
          }
        }
      ]
    }
  }
}
```

### Recherche de Films

```http
GET /api/movies/search?q=inception
```

### Suggestions Hebdomadaires

```http
GET /api/movies/suggestions
```

## ⭐ Système d'Avis

### Lister les Avis d'un Film

```http
GET /api/reviews/movie/:movieId
```

### Créer un Avis

```http
POST /api/reviews
Authorization: Bearer <token>
```

**Body:**

```json
{
  "movieId": 1,
  "rating": 9,
  "comment": "Excellent film !"
}
```

### Modifier un Avis

```http
PUT /api/reviews/:id
Authorization: Bearer <token>
```

**Body:**

```json
{
  "rating": 10,
  "comment": "Chef d'œuvre absolu !"
}
```

### Supprimer un Avis

```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

## 📋 Gestion des Demandes de Films

### Lister ses Demandes

```http
GET /api/movie-requests
Authorization: Bearer <token>
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 1,
        "title": "The Matrix 4",
        "comment": "Suite très attendue",
        "status": "pending",
        "requestedAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Créer une Demande

```http
POST /api/movie-requests
Authorization: Bearer <token>
```

**Body:**

```json
{
  "title": "The Matrix 4",
  "comment": "Suite très attendue de la trilogie"
}
```

### Mettre à Jour une Demande

```http
PUT /api/movie-requests/:id
Authorization: Bearer <token>
```

**Body:**

```json
{
  "status": "processing",
  "comment": "Demande en cours de traitement"
}
```

## 👑 Administration (Rôle ADMIN requis)

### Lister les Utilisateurs

```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

**Paramètres Query:**

- `page`, `limit`: Pagination
- `role`: Filtrer par rôle (USER/ADMIN)
- `isActive`: Filtrer par statut (true/false)

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "name": "Nom Utilisateur",
        "role": "USER",
        "isActive": true,
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### Créer un Utilisateur

```http
POST /api/admin/users
Authorization: Bearer <admin-token>
```

**Body:**

```json
{
  "email": "newuser@example.com",
  "name": "Nouveau Utilisateur",
  "role": "USER"
}
```

**Réponse (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "newuser@example.com",
      "name": "Nouveau Utilisateur",
      "role": "USER",
      "isActive": true
    },
    "tempPassword": "AbCdEfGhIjK1"
  },
  "message": "Utilisateur créé avec succès. Un email a été envoyé avec le mot de passe temporaire."
}
```

### Modifier un Utilisateur

```http
PUT /api/admin/users/:id
Authorization: Bearer <admin-token>
```

**Body:**

```json
{
  "name": "Nouveau Nom",
  "role": "ADMIN",
  "isActive": true
}
```

### Réinitialiser le Mot de Passe

```http
POST /api/admin/users/:id/reset-password
Authorization: Bearer <admin-token>
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com" },
    "tempPassword": "XyZaBcDeFgH2"
  }
}
```

### Activer/Désactiver un Utilisateur

```http
POST /api/admin/users/:id/activate
POST /api/admin/users/:id/deactivate
Authorization: Bearer <admin-token>
```

### Supprimer un Utilisateur

```http
DELETE /api/admin/users/:id
Authorization: Bearer <admin-token>
```

### Statistiques des Utilisateurs

```http
GET /api/admin/users/stats
Authorization: Bearer <admin-token>
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 50,
    "activeUsers": 45,
    "inactiveUsers": 5,
    "adminUsers": 3,
    "regularUsers": 47,
    "recentUsers": 12
  }
}
```

### Historique des Actions Admin

```http
GET /api/admin/actions
Authorization: Bearer <admin-token>
```

**Paramètres Query:**

- `page`, `limit`: Pagination

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": 1,
        "action": "CREATE_USER",
        "targetUserId": 2,
        "details": "Création de l'utilisateur newuser@example.com",
        "createdAt": "2024-01-15T10:30:00Z",
        "admin": {
          "id": 1,
          "name": "Admin Principal",
          "email": "admin@example.com"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 100, "pages": 2 }
  }
}
```

## 🔧 Utilitaires

### Health Check

```http
GET /api/health
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

### Déclencher un Scan Manuel

```http
POST /api/scan-now
Authorization: Bearer <admin-token>
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "message": "Scan démarré en arrière-plan",
    "scanId": "scan_12345"
  }
}
```

## 📊 Codes d'Erreur

| Code               | Status | Description                  |
| ------------------ | ------ | ---------------------------- |
| `VALIDATION_ERROR` | 400    | Données invalides            |
| `UNAUTHORIZED`     | 401    | Token manquant ou invalide   |
| `FORBIDDEN`        | 403    | Permissions insuffisantes    |
| `NOT_FOUND`        | 404    | Ressource non trouvée        |
| `CONFLICT`         | 409    | Conflit (email déjà utilisé) |
| `INTERNAL_ERROR`   | 500    | Erreur serveur               |

## 🔒 Sécurité

### Authentification

- **JWT** avec expiration (7 jours par défaut)
- **Refresh tokens** pour sessions prolongées
- **Hashage bcrypt** des mots de passe

### Autorisation

- **Middleware d'authentification** sur toutes les routes privées
- **Middleware d'administration** pour les routes admin
- **Validation des rôles** côté serveur

### Protection

- **Helmet** pour headers de sécurité
- **CORS** configuré
- **Rate limiting** pour prévenir les abus
- **Input validation** avec schemas

## 📝 Exemples d'Utilisation

### JavaScript/TypeScript

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem("token", data.data.token);
  }
  return data;
};

// Utilisation avec token
const getMovies = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/movies", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
```

### cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"motdepasse"}'

# Lister les films avec token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/movies
```

---

## 📚 Ressources Supplémentaires

- **[Architecture](./ARCHITECTURE.md)** - Détails techniques
- **[Administration](./ADMIN_AUTHENTICATION.md)** - Guide admin
- **[Démarrage](./QUICKSTART.md)** - Installation rapide

---

_API Videotek v1.0.0 - Documentation complète_
