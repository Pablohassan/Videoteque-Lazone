import { prisma } from "../utils/prisma.js";
import { createTMDBClient } from "../utils/tmdb.js";
import { TMDBMovie } from "../types/index.js";
import fs from "fs/promises";
import * as path from "path";
import type {
  Movie,
  Genre,
  Actor,
  MovieGenre,
  MovieActor,
} from "@prisma/client";

// Type pour les données formatées de film
type FormattedMovie = {
  id: number;
  title: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl: string | null;
  releaseDate: Date;
  duration: number;
  averageRating: number;
  reviewCount: number;
  isWeeklySuggestion: boolean;
  createdAt: Date;
  updatedAt: Date;
  genres: Array<{ id: number; name: string }>;
  actors: Array<{ id: number; name: string; profileUrl: string | null }>;
};

export class MovieService {
  private tmdbClient: ReturnType<typeof createTMDBClient>;
  private subtitleExtensions = [".srt", ".sub", ".vtt", ".ass", ".ssa"];

  constructor() {
    this.tmdbClient = createTMDBClient();
  }

  async getAllMovies(
    options: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    movies: FormattedMovie[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
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
          profileUrl: ma.actor.profileUrl,
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

  async getWeeklySuggestions(): Promise<FormattedMovie[]> {
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
          profileUrl: ma.actor.profileUrl,
        })),
      }));
    } catch (error) {
      console.error("❌ Erreur dans getWeeklySuggestions:", error);
      throw error;
    }
  }

  async getGenres(): Promise<Genre[]> {
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

  async getMovieById(id: number): Promise<FormattedMovie | null> {
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
          profileUrl: ma.actor.profileUrl,
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
  ): Promise<Movie> {
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

  async searchMovies(query: string, limit = 10): Promise<FormattedMovie[]> {
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
          profileUrl: ma.actor.profileUrl,
        })),
      }));
    } catch (error) {
      console.error("❌ Erreur dans searchMovies:", error);
      throw error;
    }
  }

  async detectAudioTracks(
    moviePath: string
  ): Promise<
    Array<{ index: number; language: string; codec: string; channels: number }>
  > {
    try {
      if (!moviePath) return [];

      // Vérifier que le fichier existe avant de procéder
      let resolvedPath = moviePath;
      try {
        await fs.access(moviePath);
      } catch (accessError) {
        console.warn(
          `⚠️ Fichier inaccessible pour analyse audio: ${moviePath}`,
          accessError
        );
        // Essayer de résoudre le chemin relatif si c'est un chemin relatif
        if (!path.isAbsolute(moviePath)) {
          resolvedPath = path.resolve(process.cwd(), moviePath);
          console.log(
            `🔄 Tentative de résolution pour analyse audio: ${moviePath} → ${resolvedPath}`
          );
          try {
            await fs.access(resolvedPath);
          } catch (resolveError) {
            console.warn(
              `❌ Chemin résolu également inaccessible pour analyse audio: ${resolvedPath}`,
              resolveError
            );
            return [];
          }
        } else {
          return [];
        }
      }

      // Analyser le nom du fichier pour détecter les langues audio
      const filename = path.basename(resolvedPath).toLowerCase();
      const audioTracks: Array<{
        index: number;
        language: string;
        codec: string;
        channels: number;
      }> = [];

      console.log(`🎵 Analyse des pistes audio pour: ${filename}`);

      // Détection basée sur les patterns courants dans les noms de fichiers
      const patterns = [
        // Ita Eng - pistes Italienne et Anglaise
        {
          pattern: /\b(ita|italian|italiano)\b.*?\b(eng|english|inglese)\b/i,
          languages: ["it", "en"],
          codec: "AC3",
        },
        {
          pattern: /\b(eng|english|inglese)\b.*?\b(ita|italian|italiano)\b/i,
          languages: ["en", "it"],
          codec: "AC3",
        },
        // Fra Eng - pistes Française et Anglaise
        {
          pattern: /\b(fra|french|français)\b.*?\b(eng|english)\b/i,
          languages: ["fr", "en"],
          codec: "AC3",
        },
        {
          pattern: /\b(eng|english)\b.*?\b(fra|french|français)\b/i,
          languages: ["en", "fr"],
          codec: "AC3",
        },
        // Multiples langues
        {
          pattern: /\b(multi|multi-lang|ita.*eng.*fra)\b/i,
          languages: ["it", "en", "fr"],
          codec: "AC3",
        },
        // Simple détection
        {
          pattern: /\b(ita|italian|italiano)\b/i,
          languages: ["it"],
          codec: "AC3",
        },
        {
          pattern: /\b(eng|english|inglese)\b/i,
          languages: ["en"],
          codec: "AC3",
        },
        {
          pattern: /\b(fra|french|français)\b/i,
          languages: ["fr"],
          codec: "AC3",
        },
      ];

      for (const { pattern, languages, codec } of patterns) {
        if (pattern.test(filename)) {
          languages.forEach((lang, index) => {
            audioTracks.push({
              index,
              language: lang,
              codec,
              channels: 2, // Par défaut stéréo
            });
          });
          break; // Prendre le premier pattern qui match
        }
      }

      // Si aucun pattern ne match, créer une piste par défaut
      if (audioTracks.length === 0) {
        audioTracks.push({
          index: 0,
          language: "en", // Anglais par défaut
          codec: "Unknown",
          channels: 2,
        });
      }

      console.log(`🎵 Pistes audio détectées:`, audioTracks);
      return audioTracks;
    } catch (error) {
      console.error("❌ Erreur lors de l'analyse des pistes audio:", error);
      return [];
    }
  }

  async detectSubtitleFiles(
    moviePath: string
  ): Promise<
    Array<{ path: string; filename: string; language: string; size: number }>
  > {
    try {
      if (!moviePath) return [];

      // Vérifier que le fichier existe avant de procéder
      let resolvedPath = moviePath;
      try {
        await fs.access(moviePath);
      } catch (accessError) {
        console.warn(`⚠️ Fichier inaccessible: ${moviePath}`, accessError);
        // Essayer de résoudre le chemin relatif si c'est un chemin relatif
        if (!path.isAbsolute(moviePath)) {
          resolvedPath = path.resolve(process.cwd(), moviePath);
          console.log(
            `🔄 Tentative de résolution: ${moviePath} → ${resolvedPath}`
          );
          try {
            await fs.access(resolvedPath);
          } catch (resolveError) {
            console.warn(
              `❌ Chemin résolu également inaccessible: ${resolvedPath}`,
              resolveError
            );
            return [];
          }
        } else {
          return [];
        }
      }

      const movieDir = path.dirname(resolvedPath);
      console.log(`📁 Recherche de sous-titres dans: ${movieDir}`);

      // Vérifier que le dossier existe
      try {
        await fs.access(movieDir);
      } catch (dirError) {
        console.warn(
          `⚠️ Dossier de sous-titres inaccessible: ${movieDir}`,
          dirError
        );
        return [];
      }

      const items = await fs.readdir(movieDir);

      const subtitleFiles: Array<{
        path: string;
        filename: string;
        language: string;
        size: number;
      }> = [];

      for (const item of items) {
        const fullPath = path.join(movieDir, item);
        const ext = path.extname(item).toLowerCase();

        if (this.subtitleExtensions.includes(ext)) {
          try {
            const stats = await fs.stat(fullPath);

            // Vérifier que c'est bien un fichier (pas un dossier)
            if (stats.isFile()) {
              // Détecter la langue basée sur le nom du fichier et le contenu
              const language = await this.detectLanguageFromFilename(
                item,
                fullPath
              );

              subtitleFiles.push({
                path: fullPath,
                filename: item,
                language,
                size: stats.size,
              });
            }
          } catch (statError) {
            // Ignorer les erreurs de stat (fichier inaccessible, etc.)
            console.warn(`⚠️ Impossible d'accéder à ${fullPath}:`, statError);
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
