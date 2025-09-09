# Gestion d'Erreurs et Validation - Guide 2025

## Vue d'ensemble

Ce document décrit le système robuste de gestion d'erreurs et de validation implémenté pour le scanner de films, conforme aux standards 2025.

## 🏗️ Architecture

### Classes d'Erreurs Personnalisées

Toutes les erreurs héritent de `AppError` avec des codes spécifiques et des statuts HTTP appropriés :

```typescript
// Structure d'une erreur personnalisée
interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
  statusCode?: number;
}
```

### Codes d'Erreurs

#### Erreurs de Films

- `MOVIE_FOLDER_NOT_FOUND` (404) - Dossier de films inexistant
- `MOVIE_FOLDER_NOT_ACCESSIBLE` (403) - Dossier non accessible
- `MOVIE_SCAN_FAILED` (500) - Échec du scan
- `MOVIE_INDEXING_FAILED` (500) - Échec de l'indexation
- `MOVIE_ALREADY_EXISTS` (409) - Film déjà en base
- `MOVIE_PARSING_ERROR` (400) - Impossible de parser le fichier

#### Erreurs TMDB

- `TMDB_API_ERROR` (502) - Erreur API externe
- `TMDB_MOVIE_NOT_FOUND` (404) - Film non trouvé

#### Erreurs de Surveillance

- `WATCHER_START_FAILED` (500) - Démarrage échoué
- `WATCHER_STOP_FAILED` (500) - Arrêt échoué
- `WATCHER_ALREADY_RUNNING` (409) - Service déjà actif
- `WATCHER_NOT_RUNNING` (400) - Service inactif

#### Erreurs de Validation

- `INVALID_FILE_PATH` (400) - Chemin invalide
- `INVALID_FILE_EXTENSION` (400) - Extension non supportée
- `FILE_NOT_ACCESSIBLE` (403) - Fichier non accessible

## 🔍 Validation avec Zod

### Schémas Principaux

#### Chemins de fichiers

```typescript
const FolderPathSchema = z
  .string()
  .min(1, "Chemin requis")
  .refine((path) => !path.includes(".."), "Sécurité: pas de '..'")
  .refine((path) => !path.startsWith("/"), "Chemins relatifs uniquement");
```

#### Extensions vidéo

```typescript
const SUPPORTED_EXTENSIONS = [
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".webm",
];

const VideoFileExtensionSchema = z
  .string()
  .transform((ext) => ext.toLowerCase())
  .refine((ext) => SUPPORTED_EXTENSIONS.includes(ext), {
    message: `Extensions supportées: ${SUPPORTED_EXTENSIONS.join(", ")}`,
  });
```

#### Options de scan

```typescript
const ScanOptionsSchema = z.object({
  folderPath: FolderPathSchema.optional(),
  recursive: z.boolean().default(true),
  extensions: z
    .array(VideoFileExtensionSchema)
    .min(1)
    .default(SUPPORTED_EXTENSIONS),
  maxFiles: z.number().int().min(1).max(10000).optional(),
  excludePatterns: z.array(z.string().regex(/^[^<>:"/\\|?*]*$/)).optional(),
});
```

### Fonctions de Validation Avancées

#### Validation de dossiers

```typescript
export const validateFolderPath = async (
  folderPath: string
): Promise<string> => {
  const validatedPath = FolderPathSchema.parse(folderPath);

  try {
    const stats = await fs.promises.stat(validatedPath);
    if (!stats.isDirectory()) {
      throw new Error("Le chemin spécifié n'est pas un dossier");
    }
    await fs.promises.access(validatedPath, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`Dossier non accessible: ${error.message}`);
  }

  return validatedPath;
};
```

#### Validation de fichiers vidéo

```typescript
export const validateVideoFile = async (filePath: string) => {
  const validatedPath = await validateFilePath(filePath);
  const extension = path.extname(validatedPath).toLowerCase();

  // Valider l'extension
  VideoFileExtensionSchema.parse(extension);

  return {
    path: validatedPath,
    extension,
    filename: path.basename(validatedPath, extension) + extension,
  };
};
```

## 📋 Utilisation

### Dans les Services

#### MovieScanner

```typescript
class MovieScanner {
  constructor(options?: { moviesFolderPath?: string }) {
    const folderPath =
      options?.moviesFolderPath || process.env.MOVIES_FOLDER_PATH;

    if (!folderPath) {
      throw new Error("MOVIES_FOLDER_PATH requis");
    }

    // Validation avec Zod
    try {
      this.moviesFolderPath = FolderPathSchema.parse(folderPath);
    } catch (validationError) {
      throw createMovieFolderNotFoundError(folderPath);
    }
  }

  async initialize(): Promise<void> {
    try {
      await validateFolderPath(this.moviesFolderPath);
    } catch (error) {
      throw createMovieFolderNotAccessibleError(this.moviesFolderPath);
    }
  }

  async scanFolder(options?: Partial<ScanOptions>): Promise<MovieScanResult[]> {
    try {
      await this.initialize();

      // Validation des options
      const validatedOptions = ScanOptionsSchema.partial().parse(options || {});

      // Traitement...
    } catch (error) {
      if (error instanceof Error && error.message.includes("Dossier")) {
        throw error; // Re-throw erreurs de validation
      }
      throw createMovieScanFailedError({
        folderPath: this.moviesFolderPath,
        cause: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}
```

#### MovieWatcherService

```typescript
class MovieWatcherService {
  async start(): Promise<void> {
    if (this.isRunning) {
      throw createWatcherAlreadyRunningError();
    }

    try {
      await validateFolderPath(this.options.watchPath);
      // Démarrage...
    } catch (error) {
      if (error instanceof Error && error.message.includes("Dossier")) {
        throw error; // Re-throw erreurs de validation
      }
      throw createWatcherStartFailedError(
        error instanceof Error ? error : undefined
      );
    }
  }

  async forceIndexFile(filepath: string): Promise<void> {
    try {
      const ext = path.extname(filepath).toLowerCase();

      if (!this.options.extensions.includes(ext as any)) {
        throw createInvalidFileExtensionError(ext, this.options.extensions);
      }

      await validateFolderPath(path.dirname(filepath));
      // Indexation...
    } catch (error) {
      if (error instanceof Error && error.name === "AppError") {
        throw error; // Re-throw erreurs personnalisées
      }
      throw createFileNotAccessibleError(filepath);
    }
  }
}
```

## 🧪 Tests

### Tests Unitaires

```typescript
describe("Validation des schémas Zod", () => {
  it("valide un chemin de dossier correct", () => {
    const result = FolderPathSchema.safeParse("movies/action");
    expect(result.success).toBe(true);
  });

  it("rejette un chemin avec '..'", () => {
    const result = FolderPathSchema.safeParse("../movies");
    expect(result.success).toBe(false);
  });
});

describe("Erreurs personnalisées", () => {
  it("crée une erreur structurée", () => {
    const error = createMovieAlreadyExistsError("The Matrix", 1999);
    expect(error.code).toBe("MOVIE_ALREADY_EXISTS");
    expect(error.statusCode).toBe(409);
    expect(error.details).toEqual({
      title: "The Matrix",
      year: 1999,
    });
  });
});
```

## 🚀 Bonnes Pratiques

### Gestion d'Erreurs

1. **Toujours utiliser les factory functions** pour créer des erreurs
2. **Fournir des détails contextuels** dans `details`
3. **Chaîner les erreurs** avec `cause` quand approprié
4. **Utiliser les bons codes de statut HTTP**

### Validation

1. **Valider tôt** - dès la réception des inputs
2. **Fournir des messages d'erreur clairs** et spécifiques
3. **Utiliser les schémas Zod** pour la validation déclarative
4. **Sécuriser les chemins de fichiers** (pas de `..`, chemins relatifs)

### Gestion des Ressources

1. **Vérifier l'accès aux fichiers** avant traitement
2. **Nettoyer les ressources** en cas d'erreur
3. **Utiliser des timeouts** pour les opérations externes
4. **Implémenter des limites** (maxFiles, etc.)

## 📊 Métriques et Observabilité

### Logging Structuré

```typescript
// Succès
console.log(`✅ ${filename} -> ${title} (${year || "N/A"})`);

// Erreur avec contexte
console.error(`❌ ${filename}: ${error.message}`, {
  code: error.code,
  details: error.details,
  stack: error.stack,
});
```

### Métriques

- Taux de succès/échec par opération
- Temps de traitement moyen
- Nombre de fichiers traités
- Erreurs par type

## 🔧 Migration

### Code existant

L'ancien code avec `throw new Error("message")` fonctionne toujours, mais :

1. **Préférer les erreurs personnalisées** pour une meilleure structure
2. **Utiliser les schémas de validation** pour remplacer les checks manuels
3. **Migrer progressivement** les services critiques

### Compatibilité

- Les erreurs `AppError` sont backward compatible avec `Error`
- Les schémas Zod peuvent être utilisés indépendamment
- Le système peut être adopté module par module

## 📈 Améliorations Futures

1. **Circuit Breaker** pour les appels API externes
2. **Rate Limiting** pour éviter la surcharge
3. **Retry Logic** avec backoff exponentiel
4. **Distributed Tracing** pour le debugging
5. **Health Checks** pour la surveillance
6. **Metrics Collection** avec Prometheus/OpenTelemetry
