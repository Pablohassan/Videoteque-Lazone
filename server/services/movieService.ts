import { prisma } from "../utils/prisma.js";
import { createTMDBClient } from "../utils/tmdb.js";
import { TMDBMovie } from "../types/index.js";
import fs from "fs-extra";
import path from "path";

export class MovieService {
  private tmdbClient: ReturnType<typeof createTMDBClient>;
  private subtitleExtensions = [".srt", ".sub", ".vtt", ".ass", ".ssa"];

  constructor() {
    this.tmdbClient = createTMDBClient();
  }

  async getAllMovies(
    options: { page: number; limit: number } = { page: 1, limit: 20 }
  ) {
    try {
      console.log("🔍 getAllMovies appelé avec options:", options);

      const page = Number(options.page) || 1;
      const limit = Number(options.limit) || 20;
      const skip = (page - 1) * limit;

      console.log("🔍 Paramètres calculés:", { page, limit, skip });

      // Récupérer les films de base avec relations
      const movies = await prisma.movie.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          actors: {
            include: {
              actor: true,
            },
          },
        },
      });

      const total = await prisma.movie.count();

      console.log(`✅ ${movies.length} films trouvés sur ${total} total`);

      // Convertir au format attendu par l'API
      const moviesFormatted = movies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        trailerUrl: movie.trailerUrl,
        releaseDate: movie.releaseDate,
        duration: movie.duration,
        averageRating: movie.rating || 0,
        reviewCount: 0,
        isWeeklySuggestion: movie.isWeeklySuggestion,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
        genres: movie.genres.map((mg) => ({
          id: mg.genre.id,
          name: mg.genre.name,
        })),
        actors: movie.actors.map((ma) => ({
          id: ma.actor.id,
          name: ma.actor.name,
        })),
      }));

      return {
        movies: moviesFormatted,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      console.error("❌ Erreur dans getAllMovies:", error);
      throw error;
    }
  }

  async getWeeklySuggestions() {
    try {
      const movies = await prisma.movie.findMany({
        where: {
          isWeeklySuggestion: true,
        },
        take: 3,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          actors: {
            include: {
              actor: true,
            },
          },
        },
      });

      return movies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        trailerUrl: movie.trailerUrl,
        releaseDate: movie.releaseDate,
        duration: movie.duration,
        averageRating: movie.rating || 0,
        reviewCount: 0,
        isWeeklySuggestion: movie.isWeeklySuggestion,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
        genres: movie.genres.map((mg) => ({
          id: mg.genre.id,
          name: mg.genre.name,
        })),
        actors: movie.actors.map((ma) => ({
          id: ma.actor.id,
          name: ma.actor.name,
        })),
      }));
    } catch (error) {
      console.error("❌ Erreur dans getWeeklySuggestions:", error);
      throw error;
    }
  }

  async getGenres() {
    try {
      return await prisma.genre.findMany({
        orderBy: {
          name: "asc",
        },
      });
    } catch (error) {
      console.error("❌ Erreur dans getGenres:", error);
      throw error;
    }
  }

  async getMovieById(id: number) {
    try {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          actors: {
            include: {
              actor: true,
            },
          },
        },
      });

      if (!movie) return null;

      return {
        id: movie.id,
        title: movie.title,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        trailerUrl: movie.trailerUrl,
        releaseDate: movie.releaseDate,
        duration: movie.duration,
        averageRating: movie.rating || 0,
        reviewCount: 0,
        isWeeklySuggestion: movie.isWeeklySuggestion,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
        genres: movie.genres.map((mg) => ({
          id: mg.genre.id,
          name: mg.genre.name,
        })),
        actors: movie.actors.map((ma) => ({
          id: ma.actor.id,
          name: ma.actor.name,
        })),
      };
    } catch (error) {
      console.error("❌ Erreur dans getMovieById:", error);
      throw error;
    }
  }

  async createMovie(
    tmdbMovie: TMDBMovie,
    genres: string[],
    actors: string[],
    localPath?: string,
    filename?: string
  ) {
    try {
      // Utiliser upsert pour éviter les conflits de contrainte unique
      const movie = await prisma.movie.upsert({
        where: { tmdbId: tmdbMovie.id },
        update: {
          title: tmdbMovie.title,
          synopsis: tmdbMovie.overview || "",
          posterUrl: `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`,
          trailerUrl: null, // Will be set later if needed
          releaseDate: new Date(tmdbMovie.release_date),
          duration: tmdbMovie.runtime || 0,
          rating: 0,
          // Mettre à jour le chemin local si fourni
          ...(localPath && { localPath }),
          ...(filename && { filename }),
        },
        create: {
          tmdbId: tmdbMovie.id,
          title: tmdbMovie.title,
          synopsis: tmdbMovie.overview || "",
          posterUrl: `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`,
          trailerUrl: null, // Will be set later if needed
          releaseDate: new Date(tmdbMovie.release_date),
          duration: tmdbMovie.runtime || 0,
          rating: 0,
          // Créer avec le chemin local si fourni
          ...(localPath && { localPath }),
          ...(filename && { filename }),
        },
      });

      // Handle genres and actors if needed
      // For now, just return the created movie
      return movie;
    } catch (error) {
      console.error("❌ Erreur dans createMovie:", error);
      throw error;
    }
  }

  async searchMovies(query: string, limit = 10) {
    try {
      const movies = await prisma.movie.findMany({
        where: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: limit,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          actors: {
            include: {
              actor: true,
            },
          },
        },
      });

      return movies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        synopsis: movie.synopsis,
        posterUrl: movie.posterUrl,
        trailerUrl: movie.trailerUrl,
        releaseDate: movie.releaseDate,
        duration: movie.duration,
        averageRating: movie.rating || 0,
        reviewCount: 0,
        isWeeklySuggestion: movie.isWeeklySuggestion,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
        genres: movie.genres.map((mg) => ({
          id: mg.genre.id,
          name: mg.genre.name,
        })),
        actors: movie.actors.map((ma) => ({
          id: ma.actor.id,
          name: ma.actor.name,
        })),
      }));
    } catch (error) {
      console.error("❌ Erreur dans searchMovies:", error);
      throw error;
    }
  }

  async detectSubtitleFiles(
    moviePath: string
  ): Promise<
    Array<{ path: string; filename: string; language: string; size: number }>
  > {
    try {
      if (!moviePath) return [];

      const movieDir = path.dirname(moviePath);
      const items = await fs.readdir(movieDir, { withFileTypes: true });

      const subtitleFiles: Array<{
        path: string;
        filename: string;
        language: string;
        size: number;
      }> = [];

      for (const item of items) {
        if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (this.subtitleExtensions.includes(ext)) {
            const fullPath = path.join(movieDir, item.name);
            const stats = await fs.stat(fullPath);

            // Détecter la langue basée sur le nom du fichier et le contenu
            const language = await this.detectLanguageFromFilename(
              item.name,
              fullPath
            );

            subtitleFiles.push({
              path: fullPath,
              filename: item.name,
              language,
              size: stats.size,
            });
          }
        }
      }

      return subtitleFiles;
    } catch (error) {
      console.error("❌ Erreur lors de la détection des sous-titres:", error);
      return [];
    }
  }

  private async detectLanguageFromFilename(
    filename: string,
    filePath?: string
  ): Promise<string> {
    // Détection basique de la langue basée sur le nom de fichier
    const lowerFilename = filename.toLowerCase();

    if (
      lowerFilename.includes(".fr.") ||
      lowerFilename.includes("french") ||
      lowerFilename.includes("fra")
    )
      return "Français";
    if (
      lowerFilename.includes(".en.") ||
      lowerFilename.includes("english") ||
      lowerFilename.includes("eng")
    )
      return "Anglais";
    if (
      lowerFilename.includes(".it.") ||
      lowerFilename.includes("italian") ||
      lowerFilename.includes("ita")
    )
      return "Italien";
    if (
      lowerFilename.includes(".es.") ||
      lowerFilename.includes("spanish") ||
      lowerFilename.includes("spa")
    )
      return "Espagnol";
    if (
      lowerFilename.includes(".de.") ||
      lowerFilename.includes("german") ||
      lowerFilename.includes("ger")
    )
      return "Allemand";

    // Si pas de langue détectée dans le nom, analyser le contenu
    if (filePath) {
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const sampleText = content
          .split("\n")
          .slice(0, 20)
          .join(" ")
          .toLowerCase();

        // Détection basique basée sur le contenu
        if (
          sampleText.includes("the ") &&
          sampleText.includes(" and ") &&
          sampleText.includes(" of ")
        ) {
          return "Anglais";
        } else if (
          sampleText.includes("le ") &&
          sampleText.includes(" et ") &&
          sampleText.includes(" de ")
        ) {
          return "Français";
        } else if (
          sampleText.includes("el ") &&
          sampleText.includes(" y ") &&
          sampleText.includes(" de ")
        ) {
          return "Espagnol";
        } else if (
          sampleText.includes("der ") &&
          sampleText.includes(" und ") &&
          sampleText.includes(" von ")
        ) {
          return "Allemand";
        } else if (
          sampleText.includes("il ") &&
          sampleText.includes(" e ") &&
          sampleText.includes(" di ")
        ) {
          return "Italien";
        }
      } catch (error) {
        console.error(
          "Erreur lors de l'analyse du contenu pour la détection de langue:",
          error
        );
      }
    }

    // Par défaut, essayer de détecter l'anglais (langue la plus courante)
    return "Anglais";
  }
}

export const movieService = new MovieService();
