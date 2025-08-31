# Système d'Authentification avec Rôles

Ce document décrit le nouveau système d'authentification avec rôles admin et user implémenté dans l'application.

## Vue d'ensemble

Le système d'authentification a été étendu pour inclure :

- **Rôles utilisateur** : `USER` (par défaut) et `ADMIN`
- **Gestion des comptes** : activation/désactivation, réinitialisation de mots de passe
- **Panneau d'administration** : interface dédiée pour les administrateurs
- **Traçabilité** : historique des actions administratives

## Structure de la base de données

### Modèle User (mis à jour)

```prisma
model User {
  id            Int            @id @default(autoincrement())
  email         String         @unique
  name          String
  password      String
  role          UserRole       @default(USER)
  isActive      Boolean        @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  // ... autres relations
}

enum UserRole {
  USER
  ADMIN
}
```

### Nouveau modèle AdminAction

```prisma
model AdminAction {
  id          Int           @id @default(autoincrement())
  action      String        // Type d'action
  targetUserId Int?         // ID de l'utilisateur ciblé
  details     String?       @db.Text
  adminId     Int           // ID de l'admin
  admin       User          @relation(fields: [adminId], references: [id])
  createdAt   DateTime      @default(now())
}
```

## Installation et configuration

### 1. Mise à jour de la base de données

```bash
# Générer et appliquer la migration Prisma
npx prisma generate
npx prisma db push

# Ou si vous utilisez des migrations
npx prisma migrate dev --name add_user_roles
```

### 2. Migration des données existantes

```bash
# Exécuter le script de migration
npm run tsx server/scripts/migrateToRoles.ts
```

### 3. Création du premier administrateur

```bash
# Créer un utilisateur administrateur
npm run tsx server/scripts/createAdmin.ts
```

## Utilisation

### Connexion en tant qu'administrateur

1. Connectez-vous avec un compte ayant le rôle `ADMIN`
2. Un bouton "Administration" apparaîtra dans le header
3. Cliquez sur ce bouton pour accéder au panneau d'administration

### Interface d'administration

Le panneau d'administration comprend :

#### Tableau de bord

- Statistiques générales (utilisateurs, films, avis)
- Activité récente
- Actions rapides

#### Gestion des utilisateurs

- **Créer un utilisateur** : génère automatiquement un mot de passe temporaire
- **Modifier un utilisateur** : nom, rôle, statut
- **Activer/Désactiver** : contrôler l'accès des comptes
- **Réinitialiser le mot de passe** : génère un nouveau mot de passe temporaire
- **Supprimer un utilisateur** : suppression définitive (avec confirmation)

#### Statistiques

- Évolution du nombre d'utilisateurs
- Répartition des rôles
- Métriques d'utilisation

#### Historique des actions

- Toutes les actions administratives effectuées
- Traçabilité complète des modifications

## API Endpoints

### Routes d'administration (protégées par authentification admin)

```
POST   /api/admin/users              # Créer un utilisateur
GET    /api/admin/users              # Lister les utilisateurs
GET    /api/admin/users/stats        # Statistiques des utilisateurs
PUT    /api/admin/users/:id          # Modifier un utilisateur
POST   /api/admin/users/:id/reset-password  # Réinitialiser le mot de passe
POST   /api/admin/users/:id/deactivate      # Désactiver un utilisateur
POST   /api/admin/users/:id/activate        # Réactiver un utilisateur
DELETE /api/admin/users/:id          # Supprimer un utilisateur
GET    /api/admin/actions            # Historique des actions
```

### Middleware de sécurité

- **authMiddleware** : vérifie l'authentification
- **adminMiddleware** : vérifie le rôle administrateur

## Sécurité

### Vérifications automatiques

- Seuls les administrateurs peuvent accéder aux routes d'administration
- Un administrateur ne peut pas se supprimer lui-même
- Toutes les actions sont tracées et horodatées

### Mots de passe temporaires

- Génération automatique de mots de passe sécurisés (12 caractères)
- Les mots de passe temporaires sont affichés une seule fois
- Recommandation de changement après la première connexion

## Gestion des erreurs

### Erreurs courantes

- **403 Forbidden** : Accès non autorisé (rôle insuffisant)
- **401 Unauthorized** : Token d'authentification manquant ou invalide
- **400 Bad Request** : Données de formulaire invalides

### Messages d'erreur

- Messages d'erreur explicites en français
- Suggestions d'actions correctives
- Logs détaillés côté serveur

## Maintenance

### Nettoyage des données

- Les actions administratives sont conservées indéfiniment
- Possibilité d'ajouter une politique de rétention

### Monitoring

- Vérification régulière des comptes inactifs
- Alertes en cas d'actions suspectes
- Métriques de performance

## Dépannage

### Problèmes courants

#### "Accès non autorisé - rôle administrateur requis"

- Vérifiez que l'utilisateur a bien le rôle `ADMIN` en base
- Vérifiez que le token JWT contient bien le rôle

#### "Token invalide"

- Vérifiez l'expiration du token (7 jours par défaut)
- Vérifiez la variable d'environnement `JWT_SECRET`

#### Erreurs de base de données

- Vérifiez que les migrations ont été appliquées
- Vérifiez la connexion à la base de données

### Logs et débogage

- Activez les logs détaillés dans `NODE_ENV=development`
- Vérifiez les logs du serveur pour les erreurs
- Utilisez les outils de développement du navigateur pour les erreurs frontend

## Évolutions futures

### Fonctionnalités prévues

- Gestion des permissions granulaires
- Audit trail plus détaillé
- Intégration avec des services d'authentification externes
- Notifications par email pour les actions importantes

### Améliorations de sécurité

- Authentification à deux facteurs
- Politiques de mots de passe plus strictes
- Limitation des tentatives de connexion
- Chiffrement des données sensibles

## Support

Pour toute question ou problème :

1. Consultez les logs du serveur
2. Vérifiez la documentation Prisma
3. Consultez les issues GitHub du projet
4. Contactez l'équipe de développement
