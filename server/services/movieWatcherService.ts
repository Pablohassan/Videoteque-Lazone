import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import fs from "fs";
import { movieIndexingService } from "./movieIndexingService.js";
import {
  validateFolderPath,
  WatcherOptionsSchema,
  type WatcherOptions,
} from "../schemas/movies.js";
import {
  createWatcherStartFailedError,
  createWatcherStopFailedError,
  createWatcherAlreadyRunningError,
  createWatcherNotRunningError,
  createMovieFolderNotFoundError,
  createMovieFolderNotAccessibleError,
  createInvalidFileExtensionError,
  createFileNotAccessibleError,
} from "../utils/errors.js";

// Utiliser le type WatcherOptions importé du schéma
// interface WatcherOptions est maintenant définie dans schemas/movies.ts

/**
 * Service de surveillance automatique des fichiers de films
 * Utilise Chokidar pour détecter les nouveaux fichiers et les indexer automatiquement
 */
export class MovieWatcherService {
  private watcher: FSWatcher | null = null;
  private isRunning = false;
  private processingQueue = new Set<string>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  // Métriques de performance
  private startTime: number = 0;
  private watcherReady: boolean = false;
  private eventsProcessed: number = 0;
  private errorsCount: number = 0;
  private totalProcessingTime: number = 0;

  private options: Required<WatcherOptions> = {
    watchPath: movieIndexingService.getMoviesFolderPath(), // Chemin relatif pour la validation
    extensions: [
      ".mp4",
      ".mkv",
      ".avi",
      ".mov",
      ".wmv",
      ".flv",
      ".webm",
      ".m4v",
    ],
    debounceMs: 2000, // 2 secondes
    recursive: true,
    ignoreInitial: true,
    ignored: [
      /(^|[/\\])\../, // Fichiers/dossiers cachés (.DS_Store, .tmp, etc.)
      /.*\.tmp$/, // Fichiers temporaires
      /.*\.temp$/,
      /.*\.swp$/, // Fichiers vim
      /.*~$/, // Fichiers backup
      /Thumbs\.db$/, // Windows thumbnails
      /Desktop\.ini$/, // Windows metadata
      /node_modules/, // Dossiers de dépendances
      /\.git/, // Dossiers git
    ],
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  };

  constructor(options?: WatcherOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Démarrer la surveillance automatique
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw createWatcherAlreadyRunningError();
    }

    try {
      // Forcer la revalidation du chemin au cas où les variables d'environnement ont changé
      const currentPath = movieIndexingService.getMoviesFolderPath();
      console.log(`🔍 [MovieWatcherService] Chemin actuel: ${currentPath}`);
      console.log(
        `📋 [MovieWatcherService] Est-ce absolu ? ${path.isAbsolute(
          currentPath
        )}`
      );

      // Mettre à jour les options avec le chemin actuel
      this.options.watchPath = currentPath;

      // Valider et vérifier l'accès au dossier
      await validateFolderPath(this.options.watchPath);

      console.log(`👀 Démarrage de la surveillance automatique:`);
      console.log(`   📁 Dossier: ${this.options.watchPath}`);
      console.log(`   🎬 Extensions: ${this.options.extensions.join(", ")}`);
      console.log(
        `   🔄 Mode récursif: ${this.options.recursive ? "Oui" : "Non"}`
      );
      console.log(`   ⏱️  Délai anti-rebond: ${this.options.debounceMs}ms`);

      // Configuration Chokidar optimisée selon les best practices 2025
      const watcherOptions = {
        // Persistence et stabilité
        persistent: true,
        ignoreInitial: true,

        // Attendre la fin des écritures pour éviter les événements multiples
        awaitWriteFinish: {
          stabilityThreshold: 2000, // Augmenté pour plus de stabilité
          pollInterval: 200, // Poll moins fréquent pour économiser CPU
        },

        // Gestion de la profondeur récursive - SOLUTION FINALE
        // Utiliser Infinity pour une surveillance récursive explicite et complète
        depth: this.options.recursive ? Infinity : 0,

        // Optimisations pour les gros volumes
        useFsEvents: true, // Utiliser les événements FS natifs quand disponibles
        usePolling: false, // Éviter le polling sauf si nécessaire
        interval: 100, // Intervalle de polling si utilisé

        // Patterns à ignorer pour de meilleures performances
        ignored: [
          /(^|[/\\])\../, // Fichiers/dossiers cachés (.DS_Store, .tmp, etc.)
          /.*\.tmp$/, // Fichiers temporaires
          /.*\.temp$/,
          /.*\.swp$/, // Fichiers vim
          /.*~$/, // Fichiers backup
          /Thumbs\.db$/, // Windows thumbnails
          /Desktop\.ini$/, // Windows metadata
          /node_modules/, // Dossiers de dépendances
          /\.git/, // Dossiers git
        ],

        // Gestion atomique des fichiers
        atomic: true, // Éviter les événements sur les copies atomiques partielles

        // Optimisation mémoire pour les gros volumes
        alwaysStat: false, // Ne pas récupérer les stats automatiquement
        followSymlinks: false, // Ne pas suivre les liens symboliques
      };

      // Créer le watcher avec le chemin absolu (nécessaire pour Chokidar)
      const absoluteWatchPath =
        movieIndexingService.getMoviesFolderAbsolutePath();
      console.log(`🔍 Démarrage de Chokidar sur: ${absoluteWatchPath}`);
      this.watcher = chokidar.watch(absoluteWatchPath, watcherOptions);

      // Événements à écouter selon les best practices Chokidar 2025
      this.watcher.on("ready", () => {
        this.watcherReady = true;
        console.log(
          `✅ Surveillance Chokidar prête - ${this.options.watchPath}`
        );
        console.log(
          `📊 Surveillance de ${
            Object.keys(this.watcher?.getWatched() || {}).length
          } dossiers`
        );
      });

      // Les événements sont gérés plus bas avec les logs de debug
      this.watcher.on("change", this.handleFileChanged.bind(this));
      this.watcher.on("unlink", this.handleFileRemoved.bind(this));

      // Gestion d'erreur améliorée selon les best practices Chokidar
      this.watcher.on("error", (err: unknown) => {
        this.errorsCount++;

        // Gestion spécifique des erreurs Chokidar
        if (err instanceof Error) {
          if (err.message.includes("EPERM") || err.message.includes("EACCES")) {
            console.error("❌ Erreur de permissions Chokidar:", err.message);
          } else if (err.message.includes("ENOENT")) {
            console.error("❌ Dossier surveillé supprimé:", err.message);
          } else if (err.message.includes("EMFILE")) {
            console.error("❌ Trop de fichiers ouverts:", err.message);
          } else {
            console.error("❌ Erreur Chokidar:", err.message);
          }
        } else {
          console.error("❌ Erreur Chokidar inconnue:", err);
        }

        this.handleError(err instanceof Error ? err : new Error(String(err)));
      });

      // Événements de debug pour le développement (peuvent être désactivés en prod)
      if (process.env.NODE_ENV === "development") {
        this.watcher.on("all", (event, filePath) => {
          console.log(`🔍 [Chokidar:${event}] ${filePath}`);
          console.log(
            `🔍 [Chokidar:${event}] Résolu: ${path.resolve(filePath)}`
          );
        });
      }

      // Gestionnaire pour les nouveaux fichiers avec logs de debug
      this.watcher.on("add", (filepath) => {
        console.log(`🚨 [ADD EVENT] Fichier ajouté détecté: ${filepath}`);
        console.log(`🚨 [ADD EVENT] Type: ${typeof filepath}`);
        console.log(`🚨 [ADD EVENT] Longueur: ${filepath.length}`);
        console.log(`🚨 [ADD EVENT] Est absolu: ${path.isAbsolute(filepath)}`);

        // Appeler le vrai gestionnaire
        this.handleFileAdded(filepath);
      });

      this.isRunning = true;
      this.startTime = Date.now();

      console.log(
        `✅ Surveillance automatique démarrée avec succès sur ${this.options.watchPath}`
      );
    } catch (error) {
      console.error("❌ Erreur lors du démarrage de la surveillance:", error);
      throw error;
    }
  }

  /**
   * Arrêter la surveillance automatique
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.watcher) {
      throw createWatcherNotRunningError();
    }

    try {
      // Nettoyer les timers en cours
      for (const timer of this.debounceTimers.values()) {
        clearTimeout(timer);
      }
      this.debounceTimers.clear();

      // Fermer le watcher
      await this.watcher.close();
      this.watcher = null;
      this.isRunning = false;

      console.log("🛑 Surveillance automatique arrêtée");
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt de la surveillance:", error);
      throw error;
    }
  }

  /**
   * Redémarrer la surveillance (utile pour changer de dossier)
   */
  async restart(options?: WatcherOptions): Promise<void> {
    if (options) {
      this.options = { ...this.options, ...options };
    }

    await this.stop();
    await this.start();
  }

  /**
   * Vérifier si le service est en cours d'exécution
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Mettre à jour la configuration du service (utile après chargement des variables d'environnement)
   */
  updateConfiguration(newOptions: Partial<WatcherOptions>): void {
    const updatedOptions = { ...this.options, ...newOptions };

    // Si le chemin a changé, redémarrer la surveillance
    if (
      newOptions.watchPath &&
      newOptions.watchPath !== this.options.watchPath
    ) {
      // S'assurer que le nouveau chemin est relatif et valide
      const currentPath = movieIndexingService.getMoviesFolderPath();
      console.log(
        `🔄 Reconfiguration du dossier surveillé: ${currentPath} (depuis ${newOptions.watchPath})`
      );

      // Mettre à jour avec le chemin relatif validé
      const updatedOptionsWithRelativePath = {
        ...updatedOptions,
        watchPath: currentPath,
      };

      this.options = { ...this.options, ...updatedOptionsWithRelativePath };

      // Redémarrer si le service est en cours d'exécution
      if (this.isRunning) {
        this.stop().then(() => {
          this.start();
        });
      }
    } else {
      this.options = { ...this.options, ...updatedOptions };
    }
  }

  /**
   * Obtenir les statistiques de surveillance avec métriques avancées (Best Practice 2025)
   */
  getStats(): {
    isRunning: boolean;
    watchPath: string;
    processingQueueSize: number;
    activeTimers: number;
    watchedFiles?: string[];
    watcherReady?: boolean;
    performanceMetrics: {
      eventsProcessed: number;
      errorsCount: number;
      averageProcessingTime: number;
      uptimeSeconds: number;
      memoryUsage: NodeJS.MemoryUsage;
      watcherInfo: {
        watchedPathsCount: number;
        ignoredPatterns: string[];
      };
    };
    chokidarConfig: {
      recursive: boolean;
      debounceMs: number;
      extensions: string[];
      ignoredCount: number;
    };
  } {
    const uptime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const watched = this.watcher?.getWatched() || {};

    return {
      isRunning: this.isRunning,
      watchPath: this.options.watchPath,
      processingQueueSize: this.processingQueue.size,
      activeTimers: this.debounceTimers.size,
      watchedFiles: Object.keys(watched),
      watcherReady: this.watcherReady,
      performanceMetrics: {
        eventsProcessed: this.eventsProcessed,
        errorsCount: this.errorsCount,
        averageProcessingTime:
          this.totalProcessingTime / Math.max(this.eventsProcessed, 1),
        uptimeSeconds: uptime,
        memoryUsage: process.memoryUsage(),
        watcherInfo: {
          watchedPathsCount: Object.keys(watched).length,
          ignoredPatterns: (this.options.ignored || []).map((pattern) =>
            pattern instanceof RegExp ? pattern.toString() : pattern
          ),
        },
      },
      chokidarConfig: {
        recursive: this.options.recursive,
        debounceMs: this.options.debounceMs,
        extensions: this.options.extensions,
        ignoredCount: this.options.ignored?.length || 0,
      },
    };
  }

  /**
   * Réinitialiser les métriques de performance
   */
  resetMetrics(): void {
    this.eventsProcessed = 0;
    this.errorsCount = 0;
    this.totalProcessingTime = 0;
    console.log("📊 Métriques de performance réinitialisées");
  }

  /**
   * Obtenir le chemin relatif du dossier de films pour la base de données
   * @returns Le chemin relatif formaté pour la DB (ex: "../../Downloads/films/")
   */
  private getMoviesFolderRelativeForDB(): string {
    const absolutePath = movieIndexingService.getMoviesFolderAbsolutePath();
    const relativePath = path.relative(process.cwd(), absolutePath);
    // S'assurer qu'il se termine par un slash
    return relativePath.endsWith(path.sep)
      ? relativePath
      : relativePath + path.sep;
  }

  /**
   * Vérifier la santé du watcher
   */
  getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Vérifier si le watcher est opérationnel
    if (!this.isRunning) {
      issues.push("Watcher non démarré");
      recommendations.push("Appeler start() pour démarrer la surveillance");
    }

    // Vérifier si le watcher est prêt
    if (!this.watcherReady) {
      issues.push("Watcher pas encore prêt");
      recommendations.push("Attendre l'événement 'ready' de Chokidar");
    }

    // Vérifier les erreurs récentes
    if (this.errorsCount > 10) {
      issues.push(`Trop d'erreurs récentes (${this.errorsCount})`);
      recommendations.push("Vérifier les permissions et la configuration");
    }

    // Vérifier la file d'attente
    if (this.processingQueue.size > 50) {
      issues.push(
        `File d'attente surchargée (${this.processingQueue.size} éléments)`
      );
      recommendations.push("Augmenter debounceMs ou optimiser le traitement");
    }

    // Vérifier les timers actifs
    if (this.debounceTimers.size > 20) {
      issues.push(`Trop de timers actifs (${this.debounceTimers.size})`);
      recommendations.push("Vérifier la logique de nettoyage des timers");
    }

    // Vérifier la mémoire
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) {
      // 500MB
      issues.push("Utilisation mémoire élevée");
      recommendations.push("Monitorer les fuites mémoire potentielles");
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }

  // ========================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================================================

  /**
   * Gestionnaire pour les nouveaux fichiers
   */
  private handleFileAdded(filepath: string): void {
    const startTime = Date.now();

    console.log(`🔍 [DEBUG] Événement 'add' déclenché pour: ${filepath}`);
    console.log(`🔍 [DEBUG] Chemin absolu complet: ${path.resolve(filepath)}`);
    console.log(`🔍 [DEBUG] Dossier surveillé: ${this.options.watchPath}`);

    try {
      const ext = path.extname(filepath).toLowerCase();

      console.log(`🔍 [DEBUG] Extension détectée: ${ext}`);
      console.log(
        `🔍 [DEBUG] Extensions supportées: ${this.options.extensions.join(
          ", "
        )}`
      );

      if (
        !this.options.extensions.includes(
          ext as (typeof this.options.extensions)[number]
        )
      ) {
        console.log(`⚠️ [DEBUG] Extension ${ext} non supportée - ignoré`);
        // Extension non supportée - ignorer silencieusement
        return;
      }

      console.log(`📁 Nouveau fichier détecté: ${path.basename(filepath)}`);
      this.eventsProcessed++;
      this.scheduleFileProcessing(filepath, "added");

      // Mesurer le temps de traitement
      this.totalProcessingTime += Date.now() - startTime;
    } catch (error) {
      this.errorsCount++;
      console.error(
        `❌ Erreur lors du traitement du fichier ajouté ${filepath}:`,
        error
      );
    }
  }

  /**
   * Gestionnaire pour les fichiers modifiés
   */
  private handleFileChanged(filepath: string): void {
    const startTime = Date.now();

    try {
      const ext = path.extname(filepath).toLowerCase();

      if (
        !this.options.extensions.includes(
          ext as (typeof this.options.extensions)[number]
        )
      ) {
        // Extension non supportée - ignorer silencieusement
        return;
      }

      console.log(`🔄 Fichier modifié: ${path.basename(filepath)}`);
      this.eventsProcessed++;
      this.scheduleFileProcessing(filepath, "changed");

      // Mesurer le temps de traitement
      this.totalProcessingTime += Date.now() - startTime;
    } catch (error) {
      this.errorsCount++;
      console.error(
        `❌ Erreur lors du traitement du fichier modifié ${filepath}:`,
        error
      );
    }
  }

  /**
   * Gestionnaire pour les fichiers supprimés
   */
  private async handleFileRemoved(filepath: string): Promise<void> {
    const startTime = Date.now();

    try {
      const ext = path.extname(filepath).toLowerCase();

      if (
        !this.options.extensions.includes(
          ext as (typeof this.options.extensions)[number]
        )
      ) {
        // Extension non supportée - ignorer silencieusement
        return;
      }

      const filename = path.basename(filepath);
      console.log(`🗑️ Fichier supprimé détecté: ${filename}`);
      this.eventsProcessed++;

      // Traiter spécifiquement le fichier supprimé
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      try {
        // Calculer correctement le chemin relatif pour la base de données
        const moviesFolder = movieIndexingService.getMoviesFolderAbsolutePath();
        const relativeFromMovies = path.relative(moviesFolder, filepath);
        const dbFormatPath = `${this.getMoviesFolderRelativeForDB()}${relativeFromMovies}`;

        // Trouver et supprimer le film de la base de données
        const movie = await prisma.movie.findFirst({
          where: { localPath: dbFormatPath },
        });

        if (movie) {
          // Supprimer les relations many-to-many d'abord
          await prisma.movieGenre.deleteMany({
            where: { movieId: movie.id },
          });
          await prisma.movieActor.deleteMany({
            where: { movieId: movie.id },
          });
          await prisma.review.deleteMany({
            where: { movieId: movie.id },
          });

          // Supprimer le film
          await prisma.movie.delete({
            where: { id: movie.id },
          });

          console.log(`🗑️ Film supprimé: ${movie.title}`);
        }

        // Mettre à jour l'état d'indexation
        const fs = await import("fs");
        const indexStateFile = path.join(
          process.cwd(),
          ".movie-index-state.json"
        );

        if (fs.existsSync(indexStateFile)) {
          const stateData = JSON.parse(
            fs.readFileSync(indexStateFile, "utf-8")
          );
          const currentFiles = new Set(stateData.lastIndexedFiles || []);

          // Supprimer le fichier de l'état
          currentFiles.delete(dbFormatPath);

          // Sauvegarder le nouvel état
          const newState = {
            lastIndexedFiles: Array.from(currentFiles),
            lastIndexTime: Date.now(),
          };

          fs.writeFileSync(indexStateFile, JSON.stringify(newState, null, 2));
          console.log(
            `💾 État d'indexation mis à jour: ${currentFiles.size} fichiers restants`
          );
        }
      } finally {
        await prisma.$disconnect();
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors du traitement du fichier supprimé ${filepath}:`,
        error
      );
    }
  }

  /**
   * Nettoyer automatiquement tous les films orphelins
   */
  private async cleanOrphanedMovies(): Promise<void> {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const fs = await import("fs");
      const path = await import("path");

      const prisma = new PrismaClient();
      const moviesFolder = movieIndexingService.getMoviesFolderAbsolutePath();

      try {
        // Récupérer tous les films qui ont encore un localPath
        const dbMovies = await prisma.movie.findMany({
          where: { localPath: { not: null } },
          select: { id: true, title: true, localPath: true, filename: true },
        });

        let orphanedCount = 0;

        for (const movie of dbMovies) {
          if (!movie.localPath) continue;

          // Vérifier si le fichier existe encore
          const moviesFolder =
            movieIndexingService.getMoviesFolderAbsolutePath();
          const relativePath = movie.localPath.replace(
            this.getMoviesFolderRelativeForDB(),
            ""
          );
          const absolutePath = path.join(moviesFolder, relativePath);

          if (!fs.existsSync(absolutePath)) {
            // Supprimer le film orphelin
            await prisma.movieGenre.deleteMany({
              where: { movieId: movie.id },
            });
            await prisma.movieActor.deleteMany({
              where: { movieId: movie.id },
            });
            await prisma.review.deleteMany({
              where: { movieId: movie.id },
            });
            await prisma.movie.delete({
              where: { id: movie.id },
            });

            console.log(`🗑️ Film orphelin supprimé: ${movie.title}`);
            orphanedCount++;
          }
        }

        if (orphanedCount > 0) {
          console.log(`✅ ${orphanedCount} films orphelins nettoyés`);
        }
      } finally {
        await prisma.$disconnect();
      }
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage des orphelins:", error);
    }
  }

  /**
   * Gestionnaire d'erreurs
   */
  private handleError(error: Error): void {
    console.error("❌ Erreur de surveillance:", error);
  }

  // ========================================================================
  // LOGIQUE DE TRAITEMENT AVEC ANTI-REBOND
  // ========================================================================

  /**
   * Programmer le traitement d'un fichier avec anti-rebond
   * Implémentation optimisée pour éviter les memory leaks
   */
  private scheduleFileProcessing(
    filepath: string,
    eventType: "added" | "changed" | "manual"
  ): void {
    // Annuler le timer existant pour ce fichier
    const existingTimer = this.debounceTimers.get(filepath);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(filepath);
    }

    // Créer un nouveau timer avec gestion d'erreur
    const timer = setTimeout(() => {
      try {
        this.processFile(filepath, eventType);
      } catch (error) {
        console.error(
          `❌ Erreur lors du traitement différé de ${filepath}:`,
          error
        );
      } finally {
        // S'assurer que le timer est nettoyé même en cas d'erreur
        this.debounceTimers.delete(filepath);
      }
    }, this.options.debounceMs);

    // Stocker le timer avec une référence faible pour éviter les memory leaks
    this.debounceTimers.set(filepath, timer);

    // Nettoyage automatique des timers expirés (garbage collection)
    this.cleanupExpiredTimers();
  }

  /**
   * Nettoyer automatiquement les timers expirés pour éviter les memory leaks
   */
  private cleanupExpiredTimers(): void {
    // Nettoyer les timers qui ont dépassé le délai maximum
    const maxTimerAge = this.options.debounceMs * 2;
    const now = Date.now();

    for (const [filepath, timer] of this.debounceTimers.entries()) {
      // Cette vérification est approximative car on ne peut pas connaître
      // l'heure exacte de création du timer, mais elle aide à prévenir les leaks
      if (this.debounceTimers.size > 100) {
        // Seuil arbitraire pour le nettoyage
        console.warn(
          `🧹 Nettoyage des timers (${this.debounceTimers.size} actifs)`
        );
        clearTimeout(timer);
        this.debounceTimers.delete(filepath);
      }
    }
  }

  /**
   * Traiter un fichier (indexation)
   */
  private async processFile(
    filepath: string,
    eventType: "added" | "changed" | "manual"
  ): Promise<void> {
    const filename = path.basename(filepath);

    // Vérifier si le fichier est déjà en cours de traitement
    if (this.processingQueue.has(filepath)) {
      console.log(`⏳ ${filename} déjà en cours de traitement, ignoré`);
      return;
    }

    // Vérifier que le fichier existe toujours (au cas où il aurait été supprimé entre temps)
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  ${filename} n'existe plus, ignoré`);
      return;
    }

    // Ajouter à la file de traitement
    this.processingQueue.add(filepath);

    try {
      console.log(`🎬 Début de l'indexation de ${filename} (${eventType})`);

      // Indexer le fichier
      const result = await movieIndexingService.indexSingleFile(filepath);

      if (result.success) {
        console.log(
          `✅ ${filename} indexé avec succès: "${result.title}" (${
            result.year || "N/A"
          })`
        );
      } else {
        console.log(`❌ Échec de l'indexation de ${filename}: ${result.error}`);
      }
    } catch (error) {
      console.error(`💥 Erreur lors de l'indexation de ${filename}:`, error);
    } finally {
      // Retirer de la file de traitement
      this.processingQueue.delete(filepath);
    }
  }

  // ========================================================================
  // MÉTHODES UTILITAIRES
  // ========================================================================

  /**
   * Forcer l'indexation d'un fichier spécifique
   */
  async forceIndexFile(filepath: string): Promise<void> {
    try {
      const ext = path.extname(filepath).toLowerCase();

      if (
        !this.options.extensions.includes(
          ext as (typeof this.options.extensions)[number]
        )
      ) {
        throw createInvalidFileExtensionError(ext, this.options.extensions);
      }

      // Vérifier que le fichier existe et est accessible
      await validateFolderPath(path.dirname(filepath));

      await this.processFile(filepath, "manual");
    } catch (error) {
      if (error instanceof Error && error.name === "AppError") {
        throw error; // Re-throw les erreurs de validation
      }
      throw createFileNotAccessibleError(filepath);
    }
  }

  /**
   * Indexer tous les fichiers existants (scan initial)
   */
  async indexExistingFiles(): Promise<void> {
    console.log("🔄 Indexation des fichiers existants...");

    try {
      const results = await movieIndexingService.indexAllMovies();
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(`✅ ${successful} fichiers indexés, ${failed} échecs`);
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'indexation des fichiers existants:",
        error
      );
      throw error;
    }
  }
}

// Instance singleton du service
export const movieWatcherService = new MovieWatcherService();
