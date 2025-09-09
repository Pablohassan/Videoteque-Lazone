import fs from "fs";
import path from "path";
import ptt from "parse-torrent-title";
import { createTMDBClient } from "../utils/tmdb.js";
import { prisma } from "../utils/prisma.js";
import type { TMDBMovie, Movie, MovieScanResult } from "../types/index.js";

interface ParsedMovie {
  filename: string;
  filepath: string;
  title: string;
  year?: number;
  resolution?: string;
  codec?: string;
  container?: string;
  size: number;
  lastModified: Date;
}

interface IndexResult {
  parsed: ParsedMovie;
  tmdbMatch?: TMDBMovie;
  dbMovie?: Movie;
  success: boolean;
  error?: string;
}

/**
 * Service unifié pour l'indexation automatique des films
 * Combine la logique de scan, parsing, recherche TMDB et sauvegarde en base
 */
export class MovieIndexingService {
  private supportedExtensions = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".m4v",
  ];

  private moviesFolderPath: string;
  private tmdbClient: ReturnType<typeof createTMDBClient>;

  constructor(moviesFolderPath?: string) {
    const folderPath = moviesFolderPath || process.env.MOVIES_FOLDER_PATH;

    console.log(`🎬 [MovieIndexingService] Initialisation avec: ${folderPath}`);
    console.log(
      `🔧 [MovieIndexingService] MOVIES_FOLDER_PATH: ${
        process.env.MOVIES_FOLDER_PATH || "non définie"
      }`
    );
    console.log(
      `🏠 [MovieIndexingService] HOME: ${process.env.HOME || "non définie"}`
    );
    console.log(`📂 [MovieIndexingService] CWD: ${process.cwd()}`);

    // Résoudre le ~ en chemin absolu
    let resolvedPath = folderPath?.replace(/^~/, process.env.HOME || "");
    console.log(
      `🔍 [MovieIndexingService] Après résolution ~: ${resolvedPath}`
    );

    // Convertir les chemins absolus en chemins relatifs par rapport au répertoire de travail
    if (path.isAbsolute(resolvedPath ?? "")) {
      const originalPath = resolvedPath;
      resolvedPath = path.relative(process.cwd(), resolvedPath ?? "");
      console.log(
        `🔄 [MovieIndexingService] Chemin absolu converti: ${originalPath} → ${resolvedPath}`
      );
    } else {
      console.log(
        `✅ [MovieIndexingService] Chemin déjà relatif: ${resolvedPath}`
      );
    }

    this.moviesFolderPath = resolvedPath ?? "";
    console.log(
      `📁 [MovieIndexingService] Chemin final: ${this.moviesFolderPath}`
    );

    // Initialiser le client TMDB
    this.tmdbClient = createTMDBClient();
  }

  // ========================================================================
  // MÉTHODES DE SCAN ET PARSING
  // ========================================================================

  /**
   * Scanner récursivement un dossier pour trouver les fichiers de films
   */
  async scanDirectory(dirPath: string): Promise<ParsedMovie[]> {
    const movies: ParsedMovie[] = [];

    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          // Scanner récursivement les sous-dossiers
          const subMovies = await this.scanDirectory(fullPath);
          movies.push(...subMovies);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();

          if (this.supportedExtensions.includes(ext)) {
            const stats = fs.statSync(fullPath);

            // Parser le nom du fichier OU du dossier parent
            const folderName = path.basename(path.dirname(fullPath));
            const fileName = path.basename(item.name, ext);

            // Essayer d'abord le nom du dossier, puis le fichier
            let parsed = ptt.parse(folderName);
            if (!parsed.title || parsed.title.length < 3) {
              parsed = ptt.parse(fileName);
            }

            if (parsed.title && parsed.title.length >= 2) {
              movies.push({
                filename: item.name,
                filepath: fullPath,
                title: parsed.title,
                year: parsed.year,
                resolution: parsed.resolution,
                codec: parsed.codec,
                container: parsed.container,
                size: stats.size,
                lastModified: stats.mtime,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors du scan de ${dirPath}:`, error);
    }

    return movies;
  }

  /**
   * Scanner un dossier plat (version simplifiée)
   */
  async scanFlatDirectory(dirPath: string): Promise<ParsedMovie[]> {
    const movies: ParsedMovie[] = [];

    try {
      const files = fs.readdirSync(dirPath);

      for (const filename of files) {
        const ext = path.extname(filename).toLowerCase();

        if (this.supportedExtensions.includes(ext)) {
          const fullPath = path.join(dirPath, filename);
          const stats = fs.statSync(fullPath);

          // Parser le nom du fichier
          const parsed = ptt.parse(filename);

          if (parsed.title && parsed.title.length >= 2) {
            movies.push({
              filename,
              filepath: fullPath,
              title: parsed.title,
              year: parsed.year,
              resolution: parsed.resolution,
              codec: parsed.codec,
              container: parsed.container,
              size: stats.size,
              lastModified: stats.mtime,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors du scan plat de ${dirPath}:`, error);
    }

    return movies;
  }

  // ========================================================================
  // MÉTHODES DE NETTOYAGE ET FORMATAGE
  // ========================================================================

  /**
   * Nettoyer et normaliser le titre du film
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/[._-]/g, " ")
      .replace(
        /\b(720p|1080p|2160p|4k|hd|dvdrip|brrip|webrip|hdtv|bluray|web|dl)\b/gi,
        ""
      )
      .replace(/\b(x264|x265|h264|h265|xvid|divx)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Nettoyer le titre pour la recherche TMDB
   */
  private cleanTitleForSearch(title: string): string {
    return title
      .replace(/[^\w\s]/g, " ") // Enlever la ponctuation
      .replace(/\s+/g, " ") // Réduire les espaces
      .trim();
  }

  // ========================================================================
  // MÉTHODES DE RECHERCHE TMDB
  // ========================================================================

  /**
   * Rechercher un film sur TMDB avec plusieurs stratégies
   */
  async findOnTMDB(movie: ParsedMovie): Promise<TMDBMovie | null> {
    try {
      const cleanTitle = this.cleanTitleForSearch(movie.title);

      // Stratégie 1: Titre + année
      if (movie.year) {
        const results = await this.tmdbClient.searchMovie(
          cleanTitle,
          movie.year
        );
        if (results.length > 0) {
          return results[0];
        }
      }

      // Stratégie 2: Titre seul
      const results = await this.tmdbClient.searchMovie(cleanTitle);
      if (results.length > 0) {
        // Si on a une année, essayer de trouver une correspondance
        if (movie.year) {
          const yearMatch = results.find((r: TMDBMovie) => {
            const releaseYear = new Date(r.release_date).getFullYear();
            return Math.abs(releaseYear - movie.year!) <= 1; // Tolérance d'1 an
          });
          if (yearMatch) return yearMatch;
        }

        return results[0];
      }

      // Stratégie 3: Titre nettoyé supplémentaire
      const extraCleanTitle = this.cleanTitle(cleanTitle);
      if (extraCleanTitle !== cleanTitle) {
        const cleanResults = await this.tmdbClient.searchMovie(
          extraCleanTitle,
          movie.year
        );
        if (cleanResults.length > 0) {
          return cleanResults[0];
        }
      }

      return null;
    } catch (error) {
      console.error(`Erreur TMDB pour "${movie.title}":`, error);
      return null;
    }
  }

  // ========================================================================
  // MÉTHODES DE SAUVEGARDE EN BASE
  // ========================================================================

  /**
   * Sauvegarder ou mettre à jour un film en base de données
   */
  async saveToDatabase(
    parsedMovie: ParsedMovie,
    tmdbMovie: TMDBMovie
  ): Promise<Movie> {
    try {
      // Récupérer les détails complets du film depuis TMDB
      const fullTmdbMovie = await this.tmdbClient.getMovie(tmdbMovie.id);
      if (!fullTmdbMovie) {
        throw new Error("Impossible de récupérer les détails TMDB");
      }

      // Récupérer les genres
      const genres = await this.tmdbClient.getGenres();
      const movieGenres =
        fullTmdbMovie.genre_ids
          ?.map((genreId: number) => {
            const genre = genres.find((g) => g.id === genreId);
            return genre?.name;
          })
          .filter(Boolean) || [];

      // Récupérer les acteurs
      const actors = this.tmdbClient.extractActors(fullTmdbMovie.credits);

      // Créer ou mettre à jour le film
      const movieData = {
        tmdbId: fullTmdbMovie.id,
        title: fullTmdbMovie.title,
        synopsis: fullTmdbMovie.overview || "",
        posterUrl: this.tmdbClient.getImageUrl(fullTmdbMovie.poster_path),
        trailerUrl: this.tmdbClient.getTrailerUrl(
          fullTmdbMovie.videos?.results || []
        ),
        releaseDate: new Date(fullTmdbMovie.release_date),
        duration: fullTmdbMovie.runtime || 0,
        rating: 0,
        // Informations du fichier local
        localPath: parsedMovie.filepath,
        filename: parsedMovie.filename,
        fileSize: BigInt(parsedMovie.size), // Convertir en BigInt pour Prisma
        resolution: parsedMovie.resolution || "",
        codec: parsedMovie.codec || "",
        container: parsedMovie.container || "",
        lastScanned: new Date(),
      };

      // Utiliser upsert pour éviter les conflits de contrainte unique
      const dbMovie = await prisma.movie.upsert({
        where: { tmdbId: fullTmdbMovie.id },
        update: movieData,
        create: movieData,
      });

      // Gérer les genres (relation many-to-many)
      if (movieGenres.length > 0) {
        for (const genreName of movieGenres) {
          if (!genreName) continue;

          const genre = await prisma.genre.upsert({
            where: { name: genreName },
            update: {},
            create: { name: genreName },
          });

          // Créer la relation si elle n'existe pas
          await prisma.movieGenre.upsert({
            where: {
              movieId_genreId: {
                movieId: dbMovie.id,
                genreId: genre.id,
              },
            },
            update: {},
            create: {
              movieId: dbMovie.id,
              genreId: genre.id,
            },
          });
        }
      }

      // Gérer les acteurs
      if (actors.length > 0) {
        for (const actorName of actors) {
          if (!actorName) continue;

          const actor = await prisma.actor.upsert({
            where: { name: actorName },
            update: {},
            create: { name: actorName },
          });

          // Créer la relation si elle n'existe pas
          await prisma.movieActor.upsert({
            where: {
              movieId_actorId: {
                movieId: dbMovie.id,
                actorId: actor.id,
              },
            },
            update: {},
            create: {
              movieId: dbMovie.id,
              actorId: actor.id,
              character: "",
            },
          });
        }
      }

      return dbMovie;
    } catch (error) {
      console.error(`Erreur sauvegarde DB pour "${parsedMovie.title}":`, error);
      throw error;
    }
  }

  // ========================================================================
  // MÉTHODES PRINCIPALES D'INDEXATION
  // ========================================================================

  /**
   * Indexer un seul fichier de film
   */
  async indexSingleFile(filepath: string): Promise<MovieScanResult> {
    try {
      const filename = path.basename(filepath);
      const ext = path.extname(filename).toLowerCase();

      // Vérifier que c'est un fichier vidéo supporté
      if (!this.supportedExtensions.includes(ext)) {
        return {
          filename,
          title: "",
          success: false,
          error: "Extension non supportée",
        };
      }

      const stats = fs.statSync(filepath);
      const parsed = ptt.parse(filename);

      if (!parsed.title) {
        return {
          filename,
          title: "",
          success: false,
          error: "Impossible d'extraire le titre du fichier",
        };
      }

      const cleanTitle = this.cleanTitle(parsed.title);

      // Vérifier si le film existe déjà en base
      const existingMovie = await prisma.movie.findFirst({
        where: {
          title: {
            equals: cleanTitle,
            mode: "insensitive",
          },
        },
      });

      if (existingMovie) {
        return {
          filename,
          title: cleanTitle,
          year: parsed.year,
          success: false,
          error: "Film déjà présent en base de données",
        };
      }

      const parsedMovie: ParsedMovie = {
        filename,
        filepath,
        title: cleanTitle,
        year: parsed.year,
        resolution: parsed.resolution,
        codec: parsed.codec,
        container: parsed.container,
        size: stats.size,
        lastModified: stats.mtime,
      };

      // Rechercher sur TMDB
      const tmdbMatch = await this.findOnTMDB(parsedMovie);

      if (!tmdbMatch) {
        return {
          filename,
          title: cleanTitle,
          year: parsed.year,
          success: false,
          error: "Film non trouvé sur TMDB",
        };
      }

      // Sauvegarder en base
      const dbMovie = await this.saveToDatabase(parsedMovie, tmdbMatch);

      return {
        filename,
        title: cleanTitle,
        year: new Date(tmdbMatch.release_date).getFullYear(),
        success: true,
      };
    } catch (error) {
      console.error(`❌ Erreur lors de l'indexation de ${filepath}:`, error);
      return {
        filename: path.basename(filepath),
        title: "",
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Indexer tous les films du dossier (version récursive)
   */
  async indexAllMovies(): Promise<IndexResult[]> {
    console.log(`🎬 Début de l'indexation depuis: ${this.moviesFolderPath}`);

    if (!fs.existsSync(this.moviesFolderPath)) {
      throw new Error(`Le dossier ${this.moviesFolderPath} n'existe pas`);
    }

    // 1. Scanner le dossier
    console.log("📁 Scan des fichiers...");
    const parsedMovies = await this.scanDirectory(this.moviesFolderPath);
    console.log(`📋 ${parsedMovies.length} films trouvés`);

    const results: IndexResult[] = [];

    // 2. Traiter chaque film
    for (let i = 0; i < parsedMovies.length; i++) {
      const movie = parsedMovies[i];
      console.log(
        `\n[${i + 1}/${parsedMovies.length}] 🔍 "${movie.title}" (${
          movie.year || "année inconnue"
        })`
      );

      try {
        // Rechercher sur TMDB
        const tmdbMatch = await this.findOnTMDB(movie);

        if (!tmdbMatch) {
          results.push({
            parsed: movie,
            success: false,
            error: "Film non trouvé sur TMDB",
          });
          console.log(`   ❌ Non trouvé sur TMDB`);
          continue;
        }

        console.log(
          `   ✅ Trouvé: "${tmdbMatch.title}" (${new Date(
            tmdbMatch.release_date
          ).getFullYear()})`
        );

        // Sauvegarder en base
        const dbMovie = await this.saveToDatabase(movie, tmdbMatch);

        results.push({
          parsed: movie,
          tmdbMatch,
          dbMovie,
          success: true,
        });

        // Pause pour éviter de surcharger l'API TMDB
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (error) {
        results.push({
          parsed: movie,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        console.log(
          `   ❌ Erreur: ${error instanceof Error ? error.message : error}`
        );
      }
    }

    // 3. Résumé
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\n🎉 Indexation terminée:`);
    console.log(`   ✅ ${successful} films indexés avec succès`);
    console.log(`   ❌ ${failed} films échoués`);

    if (failed > 0) {
      console.log(`\n❌ Films échoués:`);
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   - "${r.parsed.title}" : ${r.error}`);
        });
    }

    return results;
  }

  /**
   * Indexer tous les films du dossier (version plate)
   */
  async indexAllMoviesFlat(): Promise<MovieScanResult[]> {
    console.log(`🎬 Début du scan depuis: ${this.moviesFolderPath}`);

    try {
      const files = await fs.readdirSync(this.moviesFolderPath);
      console.log(`📁 ${files.length} fichiers trouvés`);

      const results: MovieScanResult[] = [];

      for (const filename of files) {
        const result = await this.indexSingleFile(
          path.join(this.moviesFolderPath, filename)
        );
        results.push(result);

        if (result.success) {
          console.log(
            `✅ ${result.filename} -> ${result.title} (${result.year || "N/A"})`
          );
        } else {
          console.log(`❌ ${result.filename} -> ${result.error}`);
        }

        // Pause courte pour éviter de surcharger l'API TMDB
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      this.printScanSummary(results);
      return results;
    } catch (error) {
      console.error("❌ Erreur lors du scan du dossier:", error);
      throw error;
    }
  }

  // ========================================================================
  // MÉTHODES UTILITAIRES
  // ========================================================================

  /**
   * Afficher un résumé du scan
   */
  private printScanSummary(results: MovieScanResult[]): void {
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log("\n📊 Résumé du scan:");
    console.log(`✅ Films ajoutés avec succès: ${successful}`);
    console.log(`❌ Films non traités: ${failed}`);
    console.log(`📁 Total de fichiers scannés: ${results.length}`);

    if (failed > 0) {
      console.log("\n❌ Échecs détaillés:");
      results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`  - ${result.filename}: ${result.error}`);
        });
    }
  }

  /**
   * Réinitialiser le client TMDB après chargement des variables d'environnement
   */
  reinitializeTMDBClient(): void {
    this.tmdbClient = createTMDBClient();
  }

  /**
   * Obtenir le chemin relatif du dossier de films (pour la validation)
   */
  getMoviesFolderPath(): string {
    // Re-valider le chemin au moment de l'appel au cas où les variables d'environnement ont changé
    this.ensureValidPath();
    return this.moviesFolderPath;
  }

  /**
   * Obtenir le chemin absolu du dossier de films (pour l'accès aux fichiers)
   */
  getMoviesFolderAbsolutePath(): string {
    // Re-valider le chemin au moment de l'appel au cas où les variables d'environnement ont changé
    this.ensureValidPath();
    return path.resolve(process.cwd(), this.moviesFolderPath);
  }

  /**
   * S'assurer que le chemin est valide et converti correctement
   */
  private ensureValidPath(): void {
    const currentEnvPath = process.env.MOVIES_FOLDER_PATH;
    const currentHome = process.env.HOME;

    // Si les variables d'environnement ont changé depuis l'initialisation, re-calculer le chemin
    const folderPath = currentEnvPath || "./movies";
    let resolvedPath = folderPath.replace(/^~/, currentHome || "");

    if (path.isAbsolute(resolvedPath)) {
      resolvedPath = path.relative(process.cwd(), resolvedPath);
    }

    // Si le chemin a changé, mettre à jour
    if (resolvedPath !== this.moviesFolderPath) {
      console.log(
        `🔄 [MovieIndexingService] Reconfiguration du chemin: ${this.moviesFolderPath} → ${resolvedPath}`
      );
      this.moviesFolderPath = resolvedPath;
    }
  }
}

// Instance singleton du service
export const movieIndexingService = new MovieIndexingService();
