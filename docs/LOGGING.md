# Système de Logging - Winston & Loglevel

## Vue d'ensemble

Ce projet utilise deux bibliothèques de logging professionnelles et maintenues en 2025 :

- **Winston** (côté serveur) : Bibliothèque complète avec rotation des fichiers, formats multiples
- **Loglevel** (côté client) : Bibliothèque légère pour le logging côté navigateur

## 🚀 Configuration

### Variables d'environnement

#### Serveur (Winston)
```bash
# Niveau de log (error, warn, info, debug, trace)
LOG_LEVEL=info

# Activer les logs fichiers en développement
LOG_TO_FILE=true

# Répertoire des logs (par défaut: ./logs)
LOG_DIR=/app/logs

# Environnement (active les logs fichiers automatiquement en production)
NODE_ENV=production
```

#### Client (Loglevel)
```bash
# Niveau de log dans le build
VITE_LOG_LEVEL=debug
```

### Configuration localStorage (client)
```javascript
// Dans la console du navigateur
localStorage.setItem('LOG_LEVEL', 'debug');
```

## 📝 Utilisation

### Côté Serveur (Winston)

#### Logger de base
```typescript
import { logger } from '../utils/logger.js';

// Logs simples
logger.info('Application démarrée');
logger.warn('Attention: ressource limitée');
logger.error('Erreur critique', error);

// Logs avec métadonnées
logger.info('Utilisateur connecté', { userId: 123, email: 'user@example.com' });
logger.error('Échec de connexion DB', error, { connectionString: '...' });
```

#### Loggers contextuels
```typescript
import { movieLogger, watcherLogger, adminLogger } from '../utils/logger.js';

// Logs spécifiques aux modules
movieLogger.info('Film indexé', { title: 'Inception', year: 2010 });
watcherLogger.debug('Fichier détecté', { path: '/movies/movie.mp4' });
adminLogger.warn('Tentative de connexion suspecte', { ip: '192.168.1.1' });
```

#### Logger personnalisé
```typescript
import { AppLogger } from '../utils/logger.js';

const customLogger = new AppLogger('CUSTOM_MODULE');
customLogger.info('Message personnalisé');

const childLogger = customLogger.child('SUB_MODULE');
childLogger.debug('Message du sous-module');
```

### Côté Client (Loglevel)

#### Logger de base
```typescript
import { clientLogger } from '../lib/logger.js';

// Logs simples
clientLogger.info('Composant monté');
clientLogger.warn('Données manquantes');
clientLogger.error('Erreur réseau', error);

// Logs avec données
clientLogger.debug('État mis à jour', { component: 'OrderForm', state: newState });
```

#### Hook React
```typescript
import { useLogger } from '../lib/logger.js';

function MyComponent() {
  const logger = useLogger('MyComponent');

  useEffect(() => {
    logger.debug('Composant monté');
  }, []);

  const handleClick = () => {
    logger.info('Bouton cliqué', { action: 'submit' });
  };

  return <button onClick={handleClick}>Cliquez-moi</button>;
}
```

## 📊 Formats de Logs

### Winston (Serveur)

#### Format Console
```
22:15:30 info  [MOVIES] Film indexé avec succès {"title":"Inception","year":2010}
22:15:31 error [API] Erreur TMDB {"error":"API rate limit exceeded","stack":"..."}
```

#### Format JSON (fichiers)
```json
{
  "timestamp": "2025-01-08T22:15:30.000Z",
  "level": "info",
  "message": "Film indexé avec succès",
  "context": "MOVIES",
  "title": "Inception",
  "year": 2010
}
```

### Loglevel (Client)

#### Format Console
```
[2025-01-08T22:15:30.000Z] INFO [COMPONENT] Composant monté
[2025-01-08T22:15:31.000Z] ERROR [API] Erreur réseau TypeError: Failed to fetch
```

## 📁 Structure des Logs Fichiers

```
logs/
├── app-2025-01-08.log      # Logs généraux (rotation quotidienne)
├── app-2025-01-07.log      # Jour précédent
├── error-2025-01-08.log    # Logs erreurs uniquement
└── error-2025-01-07.log    # Erreurs du jour précédent
```

## 🔧 Configuration Avancée

### Winston - Transports personnalisés
```typescript
import { winston } from '../utils/logger.js';

// Ajouter un transport Slack
winston.add(new winston.transports.Http({
  host: 'hooks.slack.com',
  path: '/services/YOUR/SLACK/WEBHOOK',
  level: 'error'
}));
```

### Loglevel - Plugins
```typescript
import log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';

// Ajouter des préfixes personnalisés
prefix.apply(log, {
  format: (level, name, timestamp) => {
    return `[${timestamp}] ${level} ${name}:`;
  }
});
```

## 🎯 Bonnes Pratiques

### Niveaux de log appropriés
- **ERROR** : Erreurs qui empêchent le fonctionnement
- **WARN** : Situations problématiques mais non bloquantes
- **INFO** : Informations importantes sur le déroulement normal
- **DEBUG** : Informations de débogage détaillées
- **TRACE** : Informations très détaillées pour le diagnostic

### Messages de log
```typescript
// ✅ Bon : Message descriptif + contexte
logger.info('Utilisateur authentifié', { userId: 123, method: 'google' });

// ❌ Mauvais : Pas assez descriptif
logger.info('Auth OK');

// ❌ Mauvais : Trop verbeux
logger.info('La fonction authenticateUser a été appelée avec succès pour l\'utilisateur john@example.com utilisant la méthode d\'authentification Google OAuth 2.0');
```

### Gestion des erreurs
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Opération échouée', error, {
    operation: 'riskyOperation',
    userId: currentUser?.id,
    timestamp: new Date().toISOString()
  });
}
```

### Performance
```typescript
// ✅ Bon : Log conditionnel
if (logger.isDebugEnabled()) {
  logger.debug('Données détaillées', expensiveData);
}

// ❌ Mauvais : Calcul toujours exécuté
logger.debug('Données détaillées', expensiveOperation());
```

## 🧪 Tests

### Tests des loggers
```typescript
import { logger } from '../utils/logger.js';

describe('Logger', () => {
  it('devrait logger les messages d\'info', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation();
    logger.info('Test message');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test message')
    );
  });
});
```

## 📊 Métriques et Monitoring

### Métriques Winston
```typescript
// Compter les erreurs par module
const errorMetrics = {
  movies: 0,
  watcher: 0,
  api: 0
};

// Dans les gestionnaires d'erreur
logger.error('Erreur movies', error, { module: 'movies' });
errorMetrics.movies++;
```

### Intégration avec monitoring
```typescript
// Envoyer les logs à un service de monitoring
winston.add(new winston.transports.Http({
  host: 'api.logrocket.com',
  path: '/v1/logs',
  level: 'warn'
}));
```

## 🔄 Migration depuis console.log

### Script de migration
```bash
# Rechercher tous les console.log
grep -r "console\." src/ server/ --include="*.ts" --include="*.tsx"

# Remplacer automatiquement (avec précaution)
find src/ server/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log/logger.info/g'
find src/ server/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.error/logger.error/g'
find src/ server/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.warn/logger.warn/g'
```

### Migration manuelle
```typescript
// Avant
console.log('Utilisateur connecté:', user.id);
console.error('Erreur DB:', error);

// Après
logger.info('Utilisateur connecté', { userId: user.id });
logger.error('Erreur DB', error);
```

## 🚨 Alertes et Notifications

### Alertes sur erreurs critiques
```typescript
// Transport Slack pour les erreurs critiques
const slackTransport = new winston.transports.Http({
  level: 'error',
  host: 'hooks.slack.com',
  path: '/services/YOUR/WEBHOOK',
  formatter: ({ level, message, meta }) => {
    return {
      text: `🚨 ERREUR CRITIQUE: ${message}`,
      attachments: [{
        fields: Object.entries(meta).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        }))
      }]
    };
  }
});
```

## 📚 Ressources

- [Documentation Winston](https://github.com/winstonjs/winston)
- [Documentation Loglevel](https://github.com/pimterry/loglevel)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [Bonnes pratiques de logging](https://www.scalyr.com/blog/the-10-commandments-of-logging/)
