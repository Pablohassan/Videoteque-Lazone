import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import fs from "fs";
import { movieIndexingService } from "./movieIndexingService.js";

interface WatcherOptions {
  /** Chemin du dossier à surveiller */
  watchPath?: string;
  /** Extensions de fichiers à surveiller */
  extensions?: string[];
  /** Délai avant traitement (en ms) pour éviter les doublons */
  debounceMs?: number;
  /** Mode de surveillance récursive */
  recursive?: boolean;
}

/**
 * Service de surveillance automatique des fichiers de films
 * Utilise Chokidar pour détecter les nouveaux fichiers et les indexer automatiquement
 */
export class MovieWatcherService {
  private watcher: FSWatcher | null = null;
  private isRunning = false;
  private processingQueue = new Set<string>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  private options: Required<WatcherOptions> = {
    watchPath: movieIndexingService.getMoviesFolderPath(),
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
      console.log(
        "🔄 Le service de surveillance est déjà en cours d'exécution"
      );
      return;
    }

    try {
      // Vérifier que le dossier existe
      if (!fs.existsSync(this.options.watchPath)) {
        throw new Error(`Le dossier ${this.options.watchPath} n'existe pas`);
      }

      console.log(`👀 Démarrage de la surveillance automatique:`);
      console.log(`   📁 Dossier: ${this.options.watchPath}`);
      console.log(`   🎬 Extensions: ${this.options.extensions.join(", ")}`);
      console.log(
        `   🔄 Mode récursif: ${this.options.recursive ? "Oui" : "Non"}`
      );
      console.log(`   ⏱️  Délai anti-rebond: ${this.options.debounceMs}ms`);

      // Configuration de Chokidar
      const watcherOptions = {
        persistent: true,
        ignoreInitial: true, // Ne pas traiter les fichiers existants au démarrage
        awaitWriteFinish: {
          stabilityThreshold: 1000, // Attendre 1s après la fin de l'écriture
          pollInterval: 100,
        },
        depth: this.options.recursive ? undefined : 0,
      };

      // Créer le watcher
      this.watcher = chokidar.watch(this.options.watchPath, watcherOptions);

      // Événements à écouter
      this.watcher.on("add", this.handleFileAdded.bind(this));
      this.watcher.on("change", this.handleFileChanged.bind(this));
      this.watcher.on("unlink", this.handleFileRemoved.bind(this));
      this.watcher.on("error", this.handleError.bind(this));

      this.isRunning = true;
      console.log("✅ Surveillance automatique démarrée avec succès");
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
      console.log(
        "🔄 Le service de surveillance n'est pas en cours d'exécution"
      );
      return;
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
      console.log(
        `🔄 Reconfiguration du dossier surveillé: ${newOptions.watchPath}`
      );
      this.options = { ...this.options, ...updatedOptions };

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
   * Obtenir les statistiques de surveillance
   */
  getStats(): {
    isRunning: boolean;
    watchPath: string;
    processingQueueSize: number;
    activeTimers: number;
  } {
    return {
      isRunning: this.isRunning,
      watchPath: this.options.watchPath,
      processingQueueSize: this.processingQueue.size,
      activeTimers: this.debounceTimers.size,
    };
  }

  // ========================================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================================================

  /**
   * Gestionnaire pour les nouveaux fichiers
   */
  private handleFileAdded(filepath: string): void {
    const ext = path.extname(filepath).toLowerCase();

    if (this.options.extensions.includes(ext)) {
      console.log(`📁 Nouveau fichier détecté: ${path.basename(filepath)}`);
      this.scheduleFileProcessing(filepath, "added");
    }
  }

  /**
   * Gestionnaire pour les fichiers modifiés
   */
  private handleFileChanged(filepath: string): void {
    const ext = path.extname(filepath).toLowerCase();

    if (this.options.extensions.includes(ext)) {
      console.log(`🔄 Fichier modifié: ${path.basename(filepath)}`);
      this.scheduleFileProcessing(filepath, "changed");
    }
  }

  /**
   * Gestionnaire pour les fichiers supprimés
   */
  private handleFileRemoved(filepath: string): void {
    const ext = path.extname(filepath).toLowerCase();

    if (this.options.extensions.includes(ext)) {
      console.log(`🗑️  Fichier supprimé: ${path.basename(filepath)}`);
      // Pour l'instant, on ne fait rien avec les suppressions
      // TODO: Marquer comme supprimé en base ou supprimer l'entrée
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
   */
  private scheduleFileProcessing(
    filepath: string,
    eventType: "added" | "changed" | "manual"
  ): void {
    // Annuler le timer existant pour ce fichier
    const existingTimer = this.debounceTimers.get(filepath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Créer un nouveau timer
    const timer = setTimeout(() => {
      this.processFile(filepath, eventType);
      this.debounceTimers.delete(filepath);
    }, this.options.debounceMs);

    this.debounceTimers.set(filepath, timer);
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
    const ext = path.extname(filepath).toLowerCase();

    if (!this.options.extensions.includes(ext)) {
      throw new Error(`Extension non supportée: ${ext}`);
    }

    await this.processFile(filepath, "manual");
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
