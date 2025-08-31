# 🚀 Guide de Déploiement - Cine-Scan-Connect

> **Déploiement complet** en production avec Docker, serveurs cloud et optimisation des performances.

## 📋 Vue d'Ensemble

### Environnements Supportés

- ✅ **Développement** : Configuration locale
- ✅ **Staging** : Environnement de test
- ✅ **Production** : Déploiement optimisé
- ✅ **Docker** : Conteneurisation complète

### Technologies de Déploiement

- **Serveurs** : VPS, AWS, DigitalOcean, Heroku
- **Base de données** : PostgreSQL managé ou auto-hébergé
- **Cache** : Redis (optionnel)
- **CDN** : Cloudflare, AWS CloudFront
- **Monitoring** : Logs, métriques, alertes

## 🐳 Déploiement avec Docker

### Configuration Docker

#### Dockerfile

```dockerfile
# Utiliser Node.js 18 LTS
FROM node:18-alpine

# Installer dumb-init pour gérer les signaux
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Changer les permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 3001

# Utiliser dumb-init pour démarrer l'application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### docker-compose.yml (Développement)

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/cine_scan_connect
      - JWT_SECRET=your-super-secret-jwt-key
      - VITE_TMDB_API_KEY=your-tmdb-key
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=cine_scan_connect
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Déploiement Docker

```bash
# Build de l'image
docker build -t cine-scan-connect .

# Démarrage avec docker-compose
docker-compose up -d

# Vérification des logs
docker-compose logs -f app

# Mise à jour
docker-compose pull
docker-compose up -d --build
```

## ☁️ Déploiement Cloud

### AWS EC2 + RDS

#### Configuration EC2

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL client
sudo apt install postgresql-client -y

# Cloner le projet
git clone https://github.com/Pablohassan/cine-scan-connect.git
cd cine-scan-connect

# Configuration des variables d'environnement
cp env.example .env
nano .env  # Éditer avec les vraies valeurs

# Installation des dépendances
npm install

# Build de production
npm run build

# Démarrage avec PM2
npm install -g pm2
pm2 start dist/server/index.js --name cine-scan-connect
pm2 startup
pm2 save
```

#### Configuration Base de Données

##### Option A : RDS PostgreSQL
```bash
# Créer une instance RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier cine-scan-connect-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username cineadmin \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-your-security-group \
  --db-subnet-group-name your-subnet-group
```

##### Option B : Supabase (Recommandé)
```bash
# 1. Créer un projet Supabase : https://supabase.com
# 2. Récupérer les credentials PostgreSQL
# 3. Variables d'environnement dans .env

DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Avantages de Supabase :
# ✅ Hébergement géré - Pas de maintenance
# ✅ Interface web - Gestion simplifiée
# ✅ Sauvegardes automatiques - Haute disponibilité
# ✅ Évolutivité - Mise à l'échelle automatique
```

### Heroku

#### Configuration

```bash
# Installer Heroku CLI
npm install -g heroku

# Login
heroku login

# Créer l'application
heroku create cine-scan-connect-prod

# Ajouter PostgreSQL OU utiliser Supabase
heroku addons:create heroku-postgresql:hobby-dev
# OU configurer Supabase dans les variables d'environnement

# Configurer les variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set VITE_TMDB_API_KEY=your-tmdb-key
heroku config:set JWT_SECRET=your-super-secret-jwt-key
```

#### Procfile

```procfile
web: npm start
```

#### Déploiement

```bash
# Push vers Heroku
git push heroku main

# Ouvrir l'application
heroku open

# Voir les logs
heroku logs --tail
```

### DigitalOcean App Platform

#### Configuration via Interface Web

1. **Créer une App** :

   - Source : GitHub
   - Repository : `Pablohassan/cine-scan-connect`
   - Branch : `main`

2. **Configuration de l'Environnement** :

   ```bash
   NODE_ENV=production
   VITE_TMDB_API_KEY=your-tmdb-key
   JWT_SECRET=your-super-secret-jwt-key
   DATABASE_URL=${db.DATABASE_URL}
   ```

3. **Base de Données** :

   - **Option A** : PostgreSQL managé ($7/mois)
   - **Option B** : Supabase (gratuit → payant)
   - Version : 15

4. **Build Settings** :

   ```bash
   # Build Command
   npm run build

   # Run Command
   npm start

   # Environment
   Node.js 18
   ```

## 🔧 Configuration de Production

### Variables d'Environnement

```bash
# Production Environment
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@prod-host:5432/cine_scan_connect
DIRECT_URL=postgresql://user:pass@prod-host:5432/cine_scan_connect
# OU pour Supabase :
# DATABASE_URL="postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres"

# JWT
JWT_SECRET=your-super-secret-production-jwt-key-here
JWT_EXPIRES_IN=24h

# TMDB
VITE_TMDB_API_KEY=your-production-tmdb-api-key
TMDB_BASE_URL=https://api.themoviedb.org/3

# Scanner
MOVIES_FOLDER_PATH=/app/movies
AUTO_SCAN_ENABLED=true
AUTO_SCAN_INTERVAL=3600000

# Email (Production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-production-app-password
FRONTEND_URL=https://yourdomain.com

# CORS
CLIENT_URL=https://yourdomain.com

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Optimisations de Performance

#### 1. Compression

```typescript
// server/index.ts
import compression from "compression";

app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  })
);
```

#### 2. Cache HTTP

```typescript
// Cache statique
app.use(
  express.static("dist/client", {
    maxAge: "1y",
    etag: true,
    lastModified: true,
  })
);

// Cache API (court terme)
app.use("/api/movies", (req, res, next) => {
  res.set("Cache-Control", "public, max-age=300"); // 5 minutes
  next();
});
```

#### 3. Database Connection Pool

```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Configuration du pool
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

model Movie {
  // ... vos modèles

  @@map("movies")
}
```

### Configuration PostgreSQL de Production

**Note : Ces optimisations s'appliquent à PostgreSQL local et Supabase (qui utilise PostgreSQL)**

```sql
-- Optimisations PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

## 🔒 Sécurité en Production

### Headers de Sécurité

```typescript
// server/middleware/security.ts
import helmet from "helmet";

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://image.tmdb.org"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.themoviedb.org"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

### Rate Limiting

```typescript
// server/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";

export const createRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Gestion des Erreurs

```typescript
// server/middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  // Log l'erreur
  console.error(`[${new Date().toISOString()}] ${err.message}`);

  // Ne pas exposer les détails d'erreur en production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.statusCode || 500).json({
    success: false,
    message: isDevelopment ? err.message : "Une erreur est survenue",
    ...(isDevelopment && { stack: err.stack }),
  });
};
```

## 📊 Monitoring et Observabilité

### Logs Structurés

```typescript
// server/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "cine-scan-connect" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
```

### Métriques

```typescript
// server/middleware/metrics.ts
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    console.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);

    // Ici vous pourriez envoyer à un service de monitoring
    // comme DataDog, New Relic, ou Prometheus
  });

  next();
};
```

### Health Checks

```typescript
// server/routes/health.ts
router.get("/health", async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;

    // Vérifier les services externes
    const tmdbHealth = await checkTMDBHealth();
    const emailHealth = await checkEmailHealth();

    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version,
        services: {
          database: "healthy",
          tmdb: tmdbHealth ? "healthy" : "unhealthy",
          email: emailHealth ? "healthy" : "healthy",
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Service unhealthy",
      error: error.message,
    });
  }
});
```

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          echo "Déploiement en production..."
          # Ici vos commandes de déploiement
```

### Scripts de Déploiement

```bash
# scripts/deploy.sh
#!/bin/bash

echo "🚀 Déploiement Cine-Scan-Connect"

# Variables
APP_NAME="cine-scan-connect"
REMOTE_HOST="your-server.com"
REMOTE_USER="deploy"

# Build local
echo "📦 Build de production..."
npm run build

# Créer archive
echo "📦 Création de l'archive..."
tar -czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  .

# Upload vers serveur
echo "📤 Upload vers serveur..."
scp deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:~/

# Déploiement distant
ssh $REMOTE_USER@$REMOTE_HOST << EOF
  # Backup
  sudo systemctl stop $APP_NAME
  mv $APP_NAME $APP_NAME.backup

  # Extraction
  tar -xzf deploy.tar.gz
  mv deploy.tar.gz extracted $APP_NAME

  # Installation
  cd $APP_NAME
  npm ci --production

  # Démarrage
  sudo systemctl start $APP_NAME
  sudo systemctl status $APP_NAME
EOF

echo "✅ Déploiement terminé !"
```

## 🐛 Dépannage Production

### Problèmes Courants

#### Mémoire Insuffisante

```bash
# Vérifier l'usage mémoire
free -h
ps aux --sort=-%mem | head

# Optimiser Node.js
export NODE_OPTIONS="--max-old-space-size=1024"
```

#### Base de Données Lente

```sql
-- Analyser les requêtes lentes
SELECT pid, now() - pg_stat_activity.query_start AS duration,
       query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Créer des index
CREATE INDEX CONCURRENTLY idx_movies_title ON movies(title);
CREATE INDEX CONCURRENTLY idx_movies_genre ON movie_genres(genre_id);
```

#### Logs d'Erreurs

```bash
# Voir les dernières erreurs
tail -f logs/error.log

# Analyser les patterns d'erreur
grep "ERROR" logs/combined.log | tail -20

# Vérifier les erreurs 5xx
grep "HTTP/1.1\" 5[0-9][0-9]" logs/access.log
```

### Commandes de Monitoring

```bash
# État des processus
pm2 status
pm2 monit

# Logs en temps réel
pm2 logs cine-scan-connect --lines 50

# Redémarrage graceful
pm2 reload cine-scan-connect

# Monitoring des ressources
htop
iotop
nload
```

## 📈 Optimisation des Performances

### Cache Redis (Optionnel)

```typescript
// Configuration Redis
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// Cache des films populaires
export const cacheMovies = async (key: string, data: any, ttl = 3600) => {
  await redisClient.setEx(key, ttl, JSON.stringify(data));
};

export const getCachedMovies = async (key: string) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};
```

### CDN pour les Images

```typescript
// Configuration CDN pour les posters TMDB
const getOptimizedImageUrl = (tmdbPath: string, width = 500) => {
  const baseUrl = process.env.CDN_URL || "https://image.tmdb.org/t/p/";
  return `${baseUrl}w${width}${tmdbPath}`;
};
```

---

## 📚 Ressources Supplémentaires

- **[Architecture](./ARCHITECTURE.md)** - Architecture technique
- **[API](./API.md)** - Documentation API complète
- **[QUICKSTART](./QUICKSTART.md)** - Démarrage rapide

---

_Déploiement Cine-Scan-Connect v1.0.0 - Guide complet_
