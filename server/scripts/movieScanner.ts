import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ptt from "parse-torrent-title";
import { createTMDBClient } from "../utils/tmdb.js";
import { movieService } from "../services/movieService.js";
import { prisma } from "../utils/prisma.js";
import { MovieScanResult } from "../types/index.js";
import {
  validateFolderPath,
  validateMovieTitle,
  FolderPathSchema,
  ScanOptionsSchema,
  type ScanOptions,
} from "../schemas/movies.js";
import {
  createMovieFolderNotFoundError,
  createMovieFolderNotAccessibleError,
  createMovieScanFailedError,
  createMovieIndexingFailedError,
  createTMDBApiError,
  createTMDBMovieNotFoundError,
  createMovieParsingError,
  createMovieAlreadyExistsError,
  createInvalidFileExtensionError,
  createFileNotAccessibleError,
} from "../utils/errors.js";
import { movieLogger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class MovieScanner {
  private moviesFolderPath: string;
  private supportedExtensions = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
  ];

  constructor(options?: { moviesFolderPath?: string }) {
    const folderPath =
      options?.moviesFolderPath || process.env.MOVIES_FOLDER_PATH;

    if (!folderPath) {
      throw new Error(
        "MOVIES_FOLDER_PATH non défini dans les variables d'environnement"
      );
    }

    // Valider le chemin du dossier
    try {
      this.moviesFolderPath = FolderPathSchema.parse(folderPath);
    } catch (validationError) {
      throw createMovieFolderNotFoundError(folderPath);
    }
  }

  /**
   * Valide et initialise le scanner avec des options
   */
  async initialize(): Promise<void> {
    try {
      await validateFolderPath(this.moviesFolderPath);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("n'existe pas")) {
          throw createMovieFolderNotFoundError(this.moviesFolderPath);
        }
        if (error.message.includes("non accessible")) {
          throw createMovieFolderNotAccessibleError(this.moviesFolderPath);
        }
      }
      throw createMovieFolderNotAccessibleError(this.moviesFolderPath);
    }
  }

  async scanFolder(options?: Partial<ScanOptions>): Promise<MovieScanResult[]> {
    console.log(`🎬 Démarrage du scan du dossier: ${this.moviesFolderPath}`);

    try {
      // Initialiser et valider le scanner
      await this.initialize();

      // Valider les options de scan
      const validatedOptions = ScanOptionsSchema.partial().parse(options || {});

      const files = await this.getMovieFiles(validatedOptions);
      console.log(`📁 ${files.length} fichiers de films trouvés`);

      const results: MovieScanResult[] = [];

      for (const file of files) {
        try {
          const result = await this.processMovieFile(file);
          results.push(result);

          if (result.success) {
            console.log(
              `✅ ${result.filename} -> ${result.title} (${
                result.year || "N/A"
              })`
            );
          } else {
            console.log(`❌ ${result.filename} -> ${result.error}`);
          }

          // Pause courte pour éviter de surcharger l'API TMDB
          await this.sleep(300);
        } catch (error) {
          console.error(`❌ Erreur lors du traitement de ${file}:`, error);

          const errorMessage =
            error instanceof Error ? error.message : "Erreur inconnue";
          results.push({
            filename: file,
            title: "",
            success: false,
            error: errorMessage,
          });
        }
      }

      this.printScanSummary(results);
      return results;
    } catch (error) {
      console.error("❌ Erreur lors du scan du dossier:", error);

      if (error instanceof Error && error.message.includes("Dossier")) {
        throw error; // Re-throw les erreurs de validation déjà formatées
      }

      throw createMovieScanFailedError({
        folderPath: this.moviesFolderPath,
        cause: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  private async getMovieFiles(
    options?: Partial<ScanOptions>
  ): Promise<string[]> {
    try {
      const files = await fs.readdir(this.moviesFolderPath);

      return files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();

          // Vérifier l'extension
          const supportedExtensions =
            options?.extensions || this.supportedExtensions;
          if (
            !supportedExtensions.includes(
              ext as (typeof supportedExtensions)[number]
            )
          ) {
            return false;
          }

          // Vérifier les patterns d'exclusion
          if (options?.excludePatterns) {
            for (const pattern of options.excludePatterns) {
              if (file.includes(pattern)) {
                return false;
              }
            }
          }

          return true;
        })
        .slice(0, options?.maxFiles); // Limiter le nombre de fichiers si spécifié
    } catch (error) {
      throw createMovieFolderNotAccessibleError(this.moviesFolderPath);
    }
  }

  private async processMovieFile(filename: string): Promise<MovieScanResult> {
    try {
      // Valider le nom du fichier
      const validatedFilename = filename.trim();
      if (!validatedFilename) {
        return {
          filename,
          title: "",
          success: false,
          error: "Nom de fichier vide",
        };
      }

      // Extraire les informations du nom de fichier
      const parsed = ptt.parse(validatedFilename);

      if (!parsed.title) {
        throw createMovieParsingError(filename);
      }

      // Valider et nettoyer le titre
      const cleanTitle = validateMovieTitle(this.cleanTitle(parsed.title));
      const year = parsed.year;

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
        throw createMovieAlreadyExistsError(cleanTitle, year);
      }

      // Rechercher le film sur TMDB
      const tmdbClient = createTMDBClient();
      let tmdbMovies;

      try {
        tmdbMovies = await tmdbClient.searchMovie(cleanTitle, year);
      } catch (tmdbError) {
        throw createTMDBApiError(
          tmdbError instanceof Error ? tmdbError : undefined
        );
      }

      if (tmdbMovies.length === 0) {
        throw createTMDBMovieNotFoundError(cleanTitle, year);
      }

      // Prendre le premier résultat (le plus pertinent)
      const tmdbMovie = tmdbMovies[0];

      // Récupérer les détails complets du film
      let fullMovie;
      try {
        fullMovie = await tmdbClient.getMovie(tmdbMovie.id);
      } catch (tmdbError) {
        throw createTMDBApiError(
          tmdbError instanceof Error ? tmdbError : undefined
        );
      }

      if (!fullMovie) {
        throw createTMDBMovieNotFoundError(cleanTitle, year);
      }

      // Récupérer les genres depuis TMDB
      const allGenres = await tmdbClient.getGenres();
      const movieGenres =
        fullMovie.genre_ids
          ?.map((genreId: number) => {
            const genre = allGenres.find((g) => g.id === genreId);
            return genre?.name;
          })
          .filter(Boolean) || [];

      // Extraire les acteurs
      const actors = tmdbClient.extractActors(fullMovie.credits);

      // Créer le film en base de données
      const fullPath = path.join(this.moviesFolderPath, filename);
      await movieService.createMovie(
        fullMovie,
        movieGenres as string[],
        actors,
        fullPath, // Chemin complet du fichier
        filename // Nom du fichier
      );

      return {
        filename,
        title: cleanTitle,
        year: new Date(fullMovie.release_date).getFullYear(),
        success: true,
      };
    } catch (error) {
      // Les erreurs TMDB et de parsing sont déjà gérées avec throw plus haut
      if (error instanceof Error) {
        // Si c'est une erreur personnalisée, la re-throw
        if (
          error.name === "AppError" ||
          error.message.includes("Film") ||
          error.message.includes("TMDB")
        ) {
          throw error;
        }

        // Sinon, créer une erreur d'indexation
        throw createMovieIndexingFailedError(filename, error);
      }

      throw createMovieIndexingFailedError(filename);
    }
  }

  private cleanTitle(title: string): string {
    // Nettoyer le titre des caractères indésirables
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Script principal
async function main() {
  try {
    // Vérifier que les variables d'environnement sont définies
    if (!process.env.TMDB_API_KEY) {
      throw new Error(
        "TMDB_API_KEY non défini dans les variables d'environnement"
      );
    }

    if (!process.env.MOVIES_FOLDER_PATH) {
      throw new Error(
        "MOVIES_FOLDER_PATH non défini dans les variables d'environnement"
      );
    }

    const scanner = new MovieScanner();

    // Scanner avec des options par défaut
    const results = await scanner.scanFolder({
      recursive: true,
      maxFiles: undefined, // Pas de limite
    });

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log("\n🎉 Scan terminé avec succès!");
    console.log(`📊 Résultats: ${successful} succès, ${failed} échecs`);

    if (failed > 0) {
      console.log(
        "\n⚠️  Certains fichiers n'ont pas pu être traités. Consultez les logs ci-dessus."
      );
    }
  } catch (error) {
    console.error("💥 Erreur fatale:", error);

    if (error instanceof Error) {
      // Vérifier si c'est une AppError (hérite de Error)
      const appError = error as {
        code?: string;
        statusCode?: number;
        details?: unknown;
      };
      if (appError.code && appError.statusCode) {
        console.error(`Code d'erreur: ${appError.code}`);
        console.error(`Status HTTP: ${appError.statusCode}`);
        if (appError.details) {
          console.error("Détails:", appError.details);
        }
      }
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MovieScanner };
