import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ptt from "parse-torrent-title";
import { createTMDBClient } from "../utils/tmdb.js";
import { movieService } from "../services/movieService.js";
import { prisma } from "../utils/prisma.js";
import { MovieScanResult } from "../types/index.js";

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

  constructor() {
    this.moviesFolderPath = process.env.MOVIES_FOLDER_PATH || "";

    if (!this.moviesFolderPath) {
      throw new Error(
        "MOVIES_FOLDER_PATH non défini dans les variables d'environnement"
      );
    }
  }

  async scanFolder(): Promise<MovieScanResult[]> {
    console.log(`🎬 Démarrage du scan du dossier: ${this.moviesFolderPath}`);

    try {
      const files = await this.getMovieFiles();
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
          results.push({
            filename: file,
            title: "",
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }

      this.printScanSummary(results);
      return results;
    } catch (error) {
      console.error("❌ Erreur lors du scan du dossier:", error);
      throw error;
    }
  }

  private async getMovieFiles(): Promise<string[]> {
    const files = await fs.readdir(this.moviesFolderPath);

    return files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return this.supportedExtensions.includes(ext);
    });
  }

  private async processMovieFile(filename: string): Promise<MovieScanResult> {
    // Extraire les informations du nom de fichier
    const parsed = ptt.parse(filename);

    if (!parsed.title) {
      return {
        filename,
        title: "",
        success: false,
        error: "Impossible d'extraire le titre du fichier",
      };
    }

    // Nettoyer le titre
    const cleanTitle = this.cleanTitle(parsed.title);
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
      return {
        filename,
        title: cleanTitle,
        year,
        success: false,
        error: "Film déjà présent en base de données",
      };
    }

    // Rechercher le film sur TMDB
    const tmdbClient = createTMDBClient();
    const tmdbMovies = await tmdbClient.searchMovie(cleanTitle, year);

    if (tmdbMovies.length === 0) {
      return {
        filename,
        title: cleanTitle,
        year,
        success: false,
        error: "Film non trouvé sur TMDB",
      };
    }

    // Prendre le premier résultat (le plus pertinent)
    const tmdbMovie = tmdbMovies[0];

    // Récupérer les détails complets du film
    const fullMovie = await tmdbClient.getMovie(tmdbMovie.id);

    if (!fullMovie) {
      return {
        filename,
        title: cleanTitle,
        year,
        success: false,
        error: "Impossible de récupérer les détails du film depuis TMDB",
      };
    }

    // Récupérer les genres depuis TMDB
    const allGenres = await tmdbClient.getGenres();
    const movieGenres =
      fullMovie.genre_ids
        ?.map((genreId) => {
          const genre = allGenres.find((g) => g.id === genreId);
          return genre?.name;
        })
        .filter(Boolean) || [];

    // Extraire les acteurs
    const actors = tmdbClient.extractActors(fullMovie.credits);

    // Créer le film en base de données
    try {
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
    } catch (dbError) {
      return {
        filename,
        title: cleanTitle,
        year,
        success: false,
        error: `Erreur lors de la création en base: ${
          dbError instanceof Error ? dbError.message : "Erreur inconnue"
        }`,
      };
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

    const scanner = new MovieScanner();
    await scanner.scanFolder();

    console.log("\n🎉 Scan terminé avec succès!");
  } catch (error) {
    console.error("💥 Erreur fatale:", error);
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
