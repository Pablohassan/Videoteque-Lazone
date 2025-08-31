# 🤝 Guide de Contribution - Cine-Scan-Connect

> **Contribuer au développement** de Cine-Scan-Connect : bonnes pratiques, workflow et standards de code.

## 📋 Vue d'Ensemble

Nous accueillons toutes les contributions ! Que vous soyez développeur expérimenté ou débutant, votre aide est précieuse pour améliorer Cine-Scan-Connect.

### 🎯 Types de Contributions

- **🐛 Corrections de bugs** : Signaler et corriger des problèmes
- **✨ Nouvelles fonctionnalités** : Proposer et implémenter des améliorations
- **📚 Documentation** : Améliorer la documentation existante
- **🧪 Tests** : Ajouter ou améliorer les tests
- **🎨 Interface** : Améliorer l'UX/UI
- **⚡ Performance** : Optimisations et améliorations de performance

## 🚀 Démarrage Rapide

### 1. Prérequis

- Node.js 18+
- PostgreSQL 12+
- Git
- Un éditeur de code (VS Code recommandé)

### 2. Installation

```bash
# Cloner le projet
git clone https://github.com/Pablohassan/cine-scan-connect.git
cd cine-scan-connect

# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
npm run db:generate
npm run db:push

# Créer un compte admin
npm run admin:create

# Lancer en développement
npm run dev
```

### 3. Créer une branche

```bash
# Créer et basculer sur une nouvelle branche
git checkout -b feature/ma-nouvelle-fonctionnalite

# Ou pour une correction de bug
git checkout -b fix/mon-correctif
```

## 💻 Standards de Développement

### TypeScript

- **Strict mode** activé
- **Interfaces** privilégiées aux `type`
- **Types explicites** pour tous les paramètres et retours
- **Prisma types** utilisés pour les entités de base de données

```typescript
// ✅ Bon
interface User {
  id: number;
  email: string;
  name: string;
}

// ❌ Éviter
type User = {
  id: number;
  email: string;
  name: string;
};
```

### Structure des Composants React

```typescript
// Structure recommandée
export function MovieCard({ movie }: MovieCardProps) {
  // 🎯 Export nommé
  // 🎯 Props typées
  // 🎯 Hooks au début
  // 🎯 Fonctions utilitaires
  // 🎯 Effets secondaires
  // 🎯 Rendu JSX

  return <Card>{/* JSX propre et accessible */}</Card>;
}
```

### Services Backend

```typescript
export class MovieService {
  // ✅ Méthodes publiques pour l'API
  async getAllMovies(options: PaginationOptions): Promise<MoviesResponse>;

  // ✅ Méthodes privées pour la logique interne
  private formatMovieData(movie: PrismaMovie): APIMovie;
  private validateMovieData(data: CreateMovieData): boolean;
}
```

### Gestion d'Erreurs

```typescript
// ✅ Gestion d'erreurs structurée
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  console.error("Erreur détaillée:", error);
  return {
    success: false,
    message: "Une erreur est survenue",
    error: error instanceof Error ? error.message : "Erreur inconnue",
  };
}
```

## 🔄 Workflow de Contribution

### 1. Choisir une Issue

- Consulter les [issues GitHub](https://github.com/Pablohassan/cine-scan-connect/issues)
- Commenter pour indiquer votre intérêt
- Attendre la validation d'un mainteneur

### 2. Développement

```bash
# Créer une branche descriptive
git checkout -b feature/add-movie-search

# Commits fréquents avec messages clairs
git commit -m "feat: add basic movie search functionality"
git commit -m "feat: add search by genre filter"
git commit -m "feat: add search result pagination"
```

### 3. Tests

```bash
# Lancer tous les tests
npm run test

# Tests spécifiques
npm run test:unit
npm run test:integration
npm run test:e2e

# Vérification du code
npm run lint
npm run type-check
```

### 4. Pull Request

```bash
# Pousser votre branche
git push origin feature/add-movie-search

# Créer une Pull Request sur GitHub
# - Titre descriptif
# - Description détaillée
# - Screenshots si nécessaire
# - Tests effectués
```

## 📝 Conventions de Commit

Nous utilisons [Conventional Commits](https://conventionalcommits.org/) :

```bash
# Types principaux
feat:     nouvelle fonctionnalité
fix:      correction de bug
docs:     modification de la documentation
style:    modification du style (formatage, etc.)
refactor: refactorisation du code
test:     ajout ou modification de tests
chore:    tâches de maintenance

# Exemples
git commit -m "feat: add movie search functionality"
git commit -m "fix: resolve login form validation error"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify movie service methods"
```

## 🧪 Tests

### Structure des Tests

```
tests/
├── unit/                    # Tests unitaires
│   ├── services/           # Tests des services
│   ├── components/         # Tests des composants
│   └── utils/              # Tests des utilitaires
├── integration/            # Tests d'intégration
│   ├── api/                # Tests des endpoints API
│   └── database/           # Tests de base de données
└── e2e/                    # Tests end-to-end
    ├── user-journeys/      # Parcours utilisateur
    └── critical-paths/     # Chemins critiques
```

### Écrire des Tests

```typescript
// Test unitaire - Service
describe("MovieService", () => {
  it("should return paginated movies", async () => {
    const result = await movieService.getAllMovies({ page: 1, limit: 10 });

    expect(result.success).toBe(true);
    expect(result.data.movies).toHaveLength(10);
    expect(result.data.pagination.page).toBe(1);
  });
});

// Test de composant - React
describe("MovieCard", () => {
  it("should display movie information", () => {
    render(<MovieCard movie={mockMovie} />);

    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
  });
});
```

### Couverture de Code

```bash
# Générer le rapport de couverture
npm run test:coverage

# Seuil minimum requis : 80%
# - Statements: 80%
# - Branches: 75%
# - Functions: 80%
# - Lines: 80%
```

## 🎨 Interface Utilisateur

### Design System

- **Tailwind CSS** pour le styling
- **Shadcn/ui** pour les composants
- **Radix UI** pour l'accessibilité
- **Design responsive** (mobile-first)

### Bonnes Pratiques UI/UX

```typescript
// ✅ Composant accessible
function SearchInput({ onSearch, placeholder }) {
  return (
    <div className="relative">
      <label htmlFor="search" className="sr-only">
        Rechercher un film
      </label>
      <input
        id="search"
        type="search"
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}

// ✅ Gestion des états de chargement
function MovieList({ movies, loading, error }) {
  if (loading) return <MovieListSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!movies.length) return <EmptyState />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
```

## 🔒 Sécurité

### Bonnes Pratiques

- **Jamais commiter** les fichiers `.env`
- **Utiliser des mots de passe d'application** pour Gmail
- **Valider toutes les entrées** utilisateur
- **Hasher les mots de passe** avec bcrypt
- **Utiliser HTTPS** en production
- **Configurer CORS** correctement

### Audit de Sécurité

Avant chaque release :

```bash
# Scanner les vulnérabilités
npm audit

# Vérifier les dépendances
npm audit --audit-level=moderate

# Mise à jour sécurisée
npm audit fix
```

## 📚 Documentation

### Mise à Jour de la Documentation

1. **Lire** la documentation existante
2. **Identifier** les sections à améliorer
3. **Proposer** des modifications claires
4. **Maintenir** la cohérence du style

### Structure de Documentation

```
docs/
├── INDEX.md              # Index principal
├── QUICKSTART.md         # Démarrage rapide
├── ARCHITECTURE.md       # Architecture technique
├── API.md               # Documentation API
├── DEPLOYMENT.md        # Guide de déploiement
├── ADMIN_AUTHENTICATION.md  # Système admin
├── CONTRIBUTING.md       # Ce fichier
└── README.md            # Documentation complète
```

## 🚀 Déploiement

### Pré-déploiement

```bash
# Tests complets
npm run test
npm run test:e2e

# Build de production
npm run build

# Vérification des variables d'environnement
# Assurer que toutes les variables de prod sont définies
```

### Checklist de Déploiement

- [ ] Tests passent en local
- [ ] Build de production réussi
- [ ] Variables d'environnement configurées
- [ ] Base de données de production prête
- [ ] Domaines et certificats SSL configurés
- [ ] Monitoring et logs configurés
- [ ] Backup de la base existante
- [ ] Plan de rollback préparé

## 📞 Communication

### Issues GitHub

- **Bug reports** : Template détaillé avec étapes de reproduction
- **Feature requests** : Description claire avec cas d'usage
- **Questions** : Utiliser les discussions plutôt que les issues

### Code Reviews

- **Respecter** les standards de code
- **Expliquer** les changements complexes
- **Répondre** rapidement aux commentaires
- **Itérer** sur les retours

### Communauté

- **Respect** et courtoisie envers tous
- **Constructif** dans les retours
- **Ouvert** aux différentes approches
- **Patient** avec les nouveaux contributeurs

## 🏆 Reconnaissance

### Badges de Contribution

- **🥇 First Timer** : Première contribution acceptée
- **🥈 Bug Hunter** : Correction de bug critique
- **🥉 Feature Champion** : Nouvelle fonctionnalité majeure
- **🏅 Documentation Hero** : Amélioration significative de la docs

### Hall of Fame

Les contributeurs actifs sont mis en avant dans le README principal avec leurs spécialités et nombre de contributions.

## 📋 Templates

### Template de Pull Request

```markdown
## Description

[Description claire et concise des changements]

## Type de changement

- [ ] 🐛 Correction de bug
- [ ] ✨ Nouvelle fonctionnalité
- [ ] 📚 Documentation
- [ ] 🎨 Amélioration UI/UX
- [ ] ⚡ Optimisation performance
- [ ] 🔒 Sécurité

## Tests effectués

- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests end-to-end
- [ ] Tests manuels

## Captures d'écran (si applicable)

[Ajouter des captures d'écran pour les changements UI]

## Checklist

- [ ] Code respecte les standards du projet
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Changements testés localement
- [ ] Pas de breaking changes
```

---

## 🎯 Points d'Attention Particuliers

### Performance

- **Lazy loading** des composants React
- **Optimisation des images** (WebP, tailles appropriées)
- **Pagination** pour les grandes listes
- **Cache** pour les données fréquemment utilisées

### Accessibilité

- **Labels appropriés** pour tous les champs de formulaire
- **Navigation clavier** fonctionnelle
- **Contraste des couleurs** suffisant
- **Texte alternatif** pour toutes les images

### Internationalisation

- **Support du français** complet
- **Messages d'erreur** en français
- **Format des dates** localisé
- **Préparation** pour l'ajout d'autres langues

---

## 📞 Support

**Besoin d'aide ?**

- 📧 **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- 💬 **Discussions GitHub** : Pour les questions générales
- 📖 **Documentation** : Pour comprendre le projet
- 👥 **Équipe** : Contact direct pour les contributeurs actifs

---

_Contribution Guide - Cine-Scan-Connect v1.0.0_
