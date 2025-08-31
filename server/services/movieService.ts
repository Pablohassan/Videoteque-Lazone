import { prisma } from "../utils/prisma.js";
import { createTMDBClient } from "../utils/tmdb.js";
import { TMDBMovie } from "../types/index.js";

export class MovieService {
  private tmdbClient: ReturnType<typeof createTMDBClient>;

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

  async createMovie(tmdbMovie: TMDBMovie, genres: string[], actors: string[]) {
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
}

export const movieService = new MovieService();
