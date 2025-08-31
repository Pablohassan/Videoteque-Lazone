# 🎬 Videotek

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Pablohassan/cine-scan-connect)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **Plateforme moderne de gestion de catalogue de films** avec scan automatique, intégration TMDB et système d'administration complet.

## ✨ Fonctionnalités Principales

- 🎯 **Catalogue de films** - Recherche, filtres par genre, suggestions hebdomadaires
- 🔍 **Scanner automatique** - Détection et indexation automatique des fichiers
- 🎭 **Intégration TMDB** - Métadonnées complètes et affiches de qualité
- 📋 **Système de demandes** - Gestion des commandes de films
- 👑 **Administration complète** - Gestion des utilisateurs, rôles et statistiques
- 🎨 **Interface moderne** - Design responsive avec Tailwind CSS et Shadcn/ui
- 🔐 **Sécurité renforcée** - Authentification JWT, rôles utilisateurs

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** 18+ et **npm**
- **Base de données** : PostgreSQL 12+ OU compte Supabase
- **Git**

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/Pablohassan/cine-scan-connect.git
cd cine-scan-connect

# 2. Installer les dépendances
npm install

# 3. Configurer la base de données
cp env.example .env
# Éditer .env avec vos paramètres

# 4. Initialiser la base
npm run db:generate
npm run db:push

# 5. Créer un administrateur
npm run admin:create

# 6. Lancer l'application
npm run dev
```

### Accès

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **Base de données** : localhost:5432 (PostgreSQL) OU Supabase

## 🗄️ Configuration de la Base de Données

### Option 1 : PostgreSQL Local

```bash
# Installer PostgreSQL
brew install postgresql  # macOS
# OU
sudo apt install postgresql postgresql-contrib  # Ubuntu

# Créer la base de données
createdb cine_scan_connect

# Variables d'environnement dans .env
DATABASE_URL="postgresql://username:password@localhost:5432/cine_scan_connect"
DIRECT_URL="postgresql://username:password@localhost:5432/cine_scan_connect"
```

### Option 2 : Supabase (Recommandé)

```bash
# 1. Créer un projet sur https://supabase.com
# 2. Récupérer les informations de connexion
# 3. Variables d'environnement dans .env

DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Variables Supabase (optionnelles)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Avantages de Supabase

- ✅ **Hébergement géré** - Pas de maintenance serveur
- ✅ **Interface web** - Gestion via tableau de bord
- ✅ **API intégrée** - Authentification et stockage
- ✅ **Sauvegardes automatiques** - Haute disponibilité
- ✅ **Évolutivité** - Mise à l'échelle automatique

## 🏗️ Architecture

```
cine-scan-connect/
├── 📁 src/                    # Frontend React + TypeScript
├── 📁 server/                 # Backend Node.js + Express
├── 📁 prisma/                 # Schéma base de données
├── 📁 docs/                   # Documentation complète
└── 📁 public/                 # Assets statiques
```

### Technologies

**Frontend:**

- React 19 + TypeScript + Vite
- Tailwind CSS + Shadcn/ui + Radix UI
- React Router v7 + React Query

**Backend:**

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL (local ou Supabase)
- JWT + bcrypt + CORS

**Services:**

- TMDB API + Supabase (optionnel pour l'authentification)
- ESLint + Prettier

## 📚 Documentation

### 📖 Guides Principaux

- **[🚀 Démarrage Rapide](docs/QUICKSTART.md)** - Installation en 5 minutes
- **[🏗️ Architecture](docs/ARCHITECTURE.md)** - Architecture technique détaillée
- **[👑 Administration](docs/ADMIN_AUTHENTICATION.md)** - Système d'administration
- **[📚 Documentation Complète](docs/README.md)** - Guide exhaustif

### 🗂️ Index de Documentation

Consultez **[docs/INDEX.md](docs/INDEX.md)** pour une vue d'ensemble de toute la documentation disponible.

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev              # Frontend + Backend
npm run dev:frontend     # Frontend uniquement
npm run dev:backend      # Backend uniquement

# Base de données
npm run db:generate      # Générer Prisma client
npm run db:push          # Appliquer schéma
npm run db:migrate       # Créer migration
npm run db:reset         # Reset complet

# Administration
npm run admin:create     # Créer admin
npm run scan:movies      # Scan manuel
npm run index:movies     # Indexation manuelle

# Qualité
npm run lint             # Vérification code
npm run build            # Build production
npm run test:smtp        # Test configuration email
```

## 🌐 Variables d'Environnement

Créer un fichier `.env` basé sur `env.example` :

```bash
# Base de données
DATABASE_URL="postgresql://user:pass@localhost:5432/cine_scan_connect"

# TMDB API
VITE_TMDB_API_KEY="your-tmdb-api-key"

# Scanner
MOVIES_FOLDER_PATH="/path/to/your/movies"

# Email (optionnel)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Standards de Code

- **TypeScript strict** activé
- **ESLint** et **Prettier** configurés
- **Conventional Commits** recommandés
- Tests unitaires encouragés

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- 📧 **Issues** : [GitHub Issues](https://github.com/Pablohassan/cine-scan-connect/issues)
- 📖 **Documentation** : [docs/](docs/) - Guide complet
- 💬 **Discussions** : [GitHub Discussions](https://github.com/Pablohassan/cine-scan-connect/discussions)

---

**Cine-Scan-Connect** - Votre cinéma personnel, organisé et automatisé 🎬✨

_Développé avec ❤️ par l'équipe Cine-Scan-Connect_
