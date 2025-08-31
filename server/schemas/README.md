# Schémas Zod - Architecture Organisée

## 📁 Structure des Schémas

Ce dossier contient tous les schémas Zod organisés par domaine métier pour une meilleure maintenabilité et séparation des responsabilités.

### 📂 Organisation

```
schemas/
├── index.ts          # Point d'entrée centralisé
├── admin.ts          # Schémas d'administration (utilisateurs, rôles, etc.)
├── auth.ts           # Schémas d'authentification (login, register, etc.)
├── movies.ts         # Schémas de films (recherche, demandes, etc.)
└── reviews.ts        # Schémas de critiques (création, mise à jour, etc.)
```

## 🔧 Principes d'Organisation

### 1. **Séparation par Domaine Métier**

- Chaque domaine métier a son propre fichier de schémas
- Les schémas sont regroupés par fonctionnalité logique
- Évite les conflits de noms et améliore la lisibilité

### 2. **Cohérence des Contraintes**

- Toutes les contraintes sont centralisées dans `constants/validation.ts`
- Utilisation des mêmes constantes pour garantir la cohérence
- Validation uniforme dans toute l'application

### 3. **Types TypeScript Générés**

- Chaque schéma exporte ses types TypeScript avec `z.infer<>`
- Types centralisés dans `index.ts` pour faciliter l'import
- Alias pour éviter les conflits de noms

## 📋 Fichiers Détaillés

### `admin.ts` - Administration

```typescript
// Schémas pour la gestion des utilisateurs
-registerSchema - // Inscription d'utilisateur
  createUserSchema - // Création par admin
  updateUserSchema - // Mise à jour d'utilisateur
  userFiltersSchema - // Filtres de recherche
  paginationSchema; // Pagination standard
```

### `auth.ts` - Authentification

```typescript
// Schémas pour l'authentification
-loginSchema - // Connexion utilisateur
  registerSchema - // Inscription utilisateur
  changePasswordSchema - // Changement de mot de passe
  verifyTokenSchema; // Vérification de token
```

### `movies.ts` - Films

```typescript
// Schémas pour les films
-movieIdSchema - // Paramètres d'ID de film
  moviesQuerySchema - // Requête de recherche
  movieRequestSchema; // Demande de nouveau film
```

### `reviews.ts` - Critiques

```typescript
// Schémas pour les critiques
-createReviewSchema - // Création de critique
  updateReviewSchema - // Mise à jour de critique
  reviewIdSchema - // Paramètres d'ID de critique
  reviewsQuerySchema; // Requête de critiques
```

## 🚀 Utilisation

### Import depuis le point d'entrée centralisé

```typescript
import {
  registerSchema,
  loginSchema,
  createUserSchema,
  movieIdSchema,
  createReviewSchema,
} from "../schemas";

// Ou directement depuis le domaine spécifique
import { registerSchema } from "../schemas/auth";
```

### Utilisation avec les middlewares de validation

```typescript
import { validateBody, validateQuery } from "../middleware/validation";
import { createReviewSchema, movieIdSchema } from "../schemas";

router.post(
  "/movies/:id/reviews",
  validateParams(movieIdSchema),
  validateBody(createReviewSchema),
  createReviewHandler
);
```

## 🔄 Migration depuis l'ancien système

### Avant (déconseillé)

```typescript
// Ancien système avec duplication
import { registerSchema } from "../utils/schemas"; // ⚠️ Ancien
import { registerSchema } from "../schemas/admin"; // ✅ Nouveau
```

### Après (recommandé)

```typescript
// Nouveau système organisé
import { registerSchema } from "../schemas/auth"; // ✅ Recommandé
// ou
import { registerSchema } from "../schemas"; // ✅ Centralisé
```

## 📊 Avantages de cette Architecture

### ✅ **Maintenabilité**

- Schémas organisés par domaine métier
- Modification isolée par fonctionnalité
- Évolution indépendante des domaines

### ✅ **Cohérence**

- Contraintes centralisées
- Validation uniforme
- Types TypeScript générés automatiquement

### ✅ **Performance**

- Imports ciblés par domaine
- Tree-shaking optimisé
- Compilation plus rapide

### ✅ **Évolutivité**

- Ajout de nouveaux domaines facile
- Extension des schémas existants
- Migration progressive possible

## 🔧 Bonnes Pratiques

### 1. **Nommer les Schémas**

- Utiliser des noms descriptifs (`createUserSchema`, `updateMovieSchema`)
- Préfixer par l'action (`create`, `update`, `delete`)
- Suffixer par le type (`Schema`)

### 2. **Valider les Données**

- Toujours utiliser `.transform()` pour nettoyer les données
- Ajouter des `.refine()` pour la validation métier
- Fournir des messages d'erreur explicites

### 3. **Gérer les Types**

- Exporter les types avec `z.infer<>`
- Utiliser des alias pour éviter les conflits
- Documenter les types complexes

### 4. **Organiser les Imports**

- Importer depuis `index.ts` pour les usages multiples
- Importer directement depuis le domaine pour les usages spécifiques
- Grouper les imports par domaine

---

## 📝 Notes de Migration

Le fichier `utils/schemas.ts` est marqué comme **DEPRECATED** et sera supprimé dans une future version. Migrez progressivement vers les nouveaux schémas organisés.

Cette architecture assure une **séparation claire des responsabilités** et facilite la **maintenance et l'évolution** du code.
