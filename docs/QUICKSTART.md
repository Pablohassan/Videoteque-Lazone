# 🚀 Guide de Démarrage Rapide - Videotek

## ⚡ Démarrage en 5 minutes

### 1. Prérequis Vérification

```bash
# Vérifier Node.js (version 18+ requise)
node --version

# Vérifier npm/yarn/bun
npm --version

# Vérifier PostgreSQL (version 12+ requise)
psql --version
```

### 2. Clonage et Installation

```bash
# Cloner le projet
git clone <repository-url>
cd cine-scan-connect

# Installer les dépendances
npm install
```

### 3. Configuration de la Base de Données

#### Option A : PostgreSQL Local

```bash
# Installer PostgreSQL si nécessaire
brew install postgresql  # macOS
# OU
sudo apt install postgresql postgresql-contrib  # Ubuntu

# Créer la base de données
createdb cine_scan_connect
```

#### Option B : Supabase (Recommandé)

```bash
# 1. Créer un compte sur https://supabase.com
# 2. Créer un nouveau projet
# 3. Récupérer l'URL de connexion PostgreSQL
```

#### Configuration commune

```bash
# Copier et éditer le fichier d'environnement
cp env.example .env
# Éditer .env avec vos informations de base de données
```

### 4. Configuration des Variables d'Environnement

#### Pour PostgreSQL Local

```bash
# .env - Configuration PostgreSQL local
DATABASE_URL="postgresql://username:password@localhost:5432/cine_scan_connect"
DIRECT_URL="postgresql://username:password@localhost:5432/cine_scan_connect"
VITE_TMDB_API_KEY="your-tmdb-api-key"
MOVIES_FOLDER_PATH="/path/to/your/movies"
```

#### Pour Supabase

```bash
# .env - Configuration Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Variables Supabase (optionnelles)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Autres variables
VITE_TMDB_API_KEY="your-tmdb-api-key"
MOVIES_FOLDER_PATH="/path/to/your/movies"
```

### 5. Initialisation de la Base

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables
npm run db:push
```

### 6. Lancement de l'Application

```bash
# Démarrage complet (frontend + backend)
npm run dev

# Ou séparément :
npm run dev:frontend  # Port 5173
npm run dev:backend   # Port 3001
```

## 🌐 Accès à l'Application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **Base de données** : localhost:5432

## 🔍 Première Utilisation

### 1. Scanner vos Films

```bash
# Scan manuel du dossier de films
npm run scan:movies
```

### 2. Vérifier l'Indexation

```bash
# Indexation automatique des métadonnées
npm run index:movies
```

### 3. Accéder à l'Interface

- Ouvrir http://localhost:5173
- Vérifier que vos films apparaissent dans le catalogue
- Tester la recherche et les filtres par genre

## 🚨 Dépannage Rapide

### Erreur de Connexion Base de Données

#### Pour PostgreSQL Local

```bash
# Vérifier que PostgreSQL est démarré
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Vérifier la connexion
psql -h localhost -U your_user -d cine_scan_connect
```

#### Pour Supabase

```bash
# Vérifier les variables d'environnement
cat .env | grep DATABASE_URL

# Tester la connexion avec Prisma
npm run db:generate

# Si ça ne fonctionne pas, vérifier :
# 1. L'URL de connexion Supabase
# 2. Le mot de passe
# 3. Les permissions du projet Supabase
```

### Erreur de Port Déjà Utilisé

```bash
# Vérifier les ports utilisés
lsof -i :3001
lsof -i :5173

# Tuer le processus si nécessaire
kill -9 <PID>
```

### Erreur de Dépendances

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur Prisma

```bash
# Régénérer le client Prisma
npm run db:generate

# Reset de la base si nécessaire
npm run db:reset
```

## 📱 Test des Fonctionnalités

### ✅ Checklist de Test

- [ ] Page d'accueil se charge
- [ ] Scanner de films fonctionne
- [ ] Catalogue affiche les films
- [ ] Recherche fonctionne
- [ ] Filtres par genre fonctionnent
- [ ] Formulaire de commande s'ouvre
- [ ] API endpoints répondent

### 🔧 Test des Endpoints API

```bash
# Test de santé
curl http://localhost:3001/api/health

# Test de scan manuel
curl -X POST http://localhost:3001/api/scan-now

# Test des films
curl http://localhost:3001/api/movies
```

## 🎯 Prochaines Étapes

### 1. Configuration Avancée

- [ ] Configurer Supabase pour l'authentification
- [ ] Optimiser les paramètres de scan
- [ ] Configurer le scan automatique

### 2. Personnalisation

- [ ] Modifier le design de l'interface
- [ ] Ajouter des fonctionnalités personnalisées
- [ ] Configurer les notifications

### 3. Production

- [ ] Configurer les variables de production
- [ ] Optimiser les performances
- [ ] Configurer le monitoring

## 📚 Ressources Utiles

- **Documentation complète** : [README.md](./README.md)
- **Schéma de base** : [prisma/schema.prisma](../prisma/schema.prisma)
- **Variables d'environnement** : [env.example](../env.example)
- **Scripts disponibles** : [package.json](../package.json)

---

## 🆘 Besoin d'Aide ?

- **Issues GitHub** : Créer une issue avec le tag `help-wanted`
- **Documentation** : Consulter la documentation complète
- **Logs** : Vérifier les logs dans la console du serveur

---

_Guide créé pour Videotek v1.0.0_
