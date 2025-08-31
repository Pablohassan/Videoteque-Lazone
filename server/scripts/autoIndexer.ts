import fs from "fs";
import path from "path";
import ptt from "parse-torrent-title";
import { createTMDBClient } from "../utils/tmdb.js";
import { prisma } from "../utils/prisma.js";
import dotenv from "dotenv";
import type { TMDBMovie } from "../types/index.js";

// Charger .env depuis la racine du projet
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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
  dbMovie?: any; // Will be Prisma Movie type
  success: boolean;
  error?: string;
}

class MovieAutoIndexer {
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
    const folderPath =
      moviesFolderPath || process.env.MOVIES_FOLDER_PATH || "./movies";
    // Résoudre le ~ en chemin absolu
    this.moviesFolderPath = folderPath.replace(/^~/, process.env.HOME || "");
    // Initialiser le client TMDB après chargement des variables d'environnement
    this.tmdbClient = createTMDBClient();
  }

  // Scanner récursivement un dossier
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

  // Rechercher un film sur TMDB avec plusieurs stratégies
  async findOnTMDB(movie: ParsedMovie): Promise<TMDBMovie | null> {
    try {
      // Stratégie 1: Titre + année
      if (movie.year) {
        const results = await this.tmdbClient.searchMovie(
          movie.title,
          movie.year
        );
        if (results.length > 0) {
          return results[0];
        }
      }

      // Stratégie 2: Titre seul
      const results = await this.tmdbClient.searchMovie(movie.title);
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

      // Stratégie 3: Nettoyer le titre et réessayer
      const cleanTitle = movie.title
        .replace(/[^\w\s]/g, " ") // Enlever la ponctuation
        .replace(/\s+/g, " ") // Réduire les espaces
        .trim();

      if (cleanTitle !== movie.title) {
        const cleanResults = await this.tmdbClient.searchMovie(
          cleanTitle,
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

  // Sauvegarder ou mettre à jour un film en base
  async saveToDatabase(
    parsedMovie: ParsedMovie,
    tmdbMovie: TMDBMovie
  ): Promise<any> {
    // Returns Prisma Movie
    try {
      // Récupérer les détails complets du film
      const fullTmdbMovie = await this.tmdbClient.getMovie(tmdbMovie.id);
      if (!fullTmdbMovie) {
        throw new Error("Impossible de récupérer les détails TMDB");
      }

      // Récupérer les genres
      const genres = await this.tmdbClient.getGenres();
      const movieGenres =
        fullTmdbMovie.genre_ids
          ?.map((genreId) => {
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

  // Indexer tous les films du dossier
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

        console.log(`   💾 Sauvegardé en base (ID: ${dbMovie.id})`);

        // Pause pour éviter de surcharger l'API TMDB
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (error) {
        results.push({
          parsed: movie,
          success: false,
          error: error instanceof Error ? error.message : error,
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
}

// Script principal
async function main() {
  const moviesFolderPath = process.argv[2] || process.env.MOVIES_FOLDER_PATH;

  if (!moviesFolderPath) {
    console.error("❌ Veuillez spécifier le chemin du dossier de films:");
    console.error("   npm run index-movies /path/to/movies");
    console.error("   ou définir MOVIES_FOLDER_PATH dans .env");
    process.exit(1);
  }

  try {
    const indexer = new MovieAutoIndexer(moviesFolderPath);
    await indexer.indexAllMovies();
  } catch (error) {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MovieAutoIndexer };
