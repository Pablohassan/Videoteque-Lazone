import { tmdbService } from "./tmdbService";
import type { Movie } from "../types/movie";

export interface ScannedFile {
  filename: string;
  path: string;
  size: number;
  lastModified: Date;
}

export interface ParsedMovieInfo {
  title: string;
  year?: number;
  resolution?: string;
  codec?: string;
  source?: string;
  group?: string;
}

export interface ScanResult {
  filename: string;
  parsed: ParsedMovieInfo;
  tmdbMovie?: Movie;
  success: boolean;
  error?: string;
}

export class MovieScannerService {
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

  constructor() {}

  // Simuler le parsing de parse-torrent-title côté frontend
  parseMovieTitle(filename: string): ParsedMovieInfo {
    // Nettoyer le nom de fichier
    const cleanName = filename
      .replace(/\.[^/.]+$/, "") // Enlever l'extension
      .replace(/[._-]/g, " ") // Remplacer . _ - par des espaces
      .replace(/\s+/g, " ") // Réduire les espaces multiples
      .trim();

    // Extraire l'année
    const yearMatch = cleanName.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;

    // Nettoyer le titre en enlevant l'année et les infos techniques
    const title = cleanName
      .replace(/\b(19|20)\d{2}\b/, "") // Enlever l'année
      .replace(
        /\b(720p|1080p|2160p|4k|hd|dvdrip|brrip|webrip|hdtv|bluray|web|dl)\b/gi,
        ""
      )
      .replace(/\b(x264|x265|h264|h265|xvid|divx|hevc)\b/gi, "")
      .replace(/\b(aac|mp3|ac3|dts|flac)\b/gi, "")
      .replace(/\[-.*?\]/g, "") // Enlever les tags entre crochets
      .replace(/\s+/g, " ")
      .trim();

    // Extraire la résolution
    const resolutionMatch = cleanName.match(/\b(720p|1080p|2160p|4k)\b/i);
    const resolution = resolutionMatch ? resolutionMatch[0] : undefined;

    // Extraire le codec
    const codecMatch = cleanName.match(
      /\b(x264|x265|h264|h265|xvid|divx|hevc)\b/i
    );
    const codec = codecMatch ? codecMatch[0] : undefined;

    // Extraire la source
    const sourceMatch = cleanName.match(
      /\b(dvdrip|brrip|webrip|hdtv|bluray|web|dl)\b/i
    );
    const source = sourceMatch ? sourceMatch[0] : undefined;

    // Extraire le groupe (souvent à la fin)
    const groupMatch = cleanName.match(/-([A-Z0-9]+)$/i);
    const group = groupMatch ? groupMatch[1] : undefined;

    return {
      title,
      year,
      resolution,
      codec,
      source,
      group,
    };
  }

  // Scanner les fichiers depuis un input file ou une API
  async scanFiles(files: FileList | File[]): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const genres = await tmdbService.getGenres();

    for (const file of Array.from(files)) {
      const extension = this.getFileExtension(file.name);

      if (!this.supportedExtensions.includes(extension)) {
        continue; // Ignorer les fichiers non supportés
      }

      try {
        const parsed = this.parseMovieTitle(file.name);

        if (!parsed.title) {
          results.push({
            filename: file.name,
            parsed,
            success: false,
            error: "Impossible d'extraire le titre du fichier",
          });
          continue;
        }

        // Rechercher sur TMDB
        const tmdbMovies = await tmdbService.searchMovie(
          parsed.title,
          parsed.year
        );

        if (tmdbMovies.length === 0) {
          results.push({
            filename: file.name,
            parsed,
            success: false,
            error: "Film non trouvé sur TMDB",
          });
          continue;
        }

        // Prendre le premier résultat (le plus pertinent)
        const tmdbMovie = tmdbMovies[0];

        // Récupérer les détails complets
        const fullMovie = await tmdbService.getMovie(tmdbMovie.id);

        if (!fullMovie) {
          results.push({
            filename: file.name,
            parsed,
            success: false,
            error: "Impossible de récupérer les détails du film",
          });
          continue;
        }

        // Convertir au format Movie
        const movie = tmdbService.convertToMovie(fullMovie, genres);

        results.push({
          filename: file.name,
          parsed,
          tmdbMovie: movie,
          success: true,
        });

        // Petite pause pour éviter de surcharger l'API
        await this.delay(200);
      } catch (error) {
        results.push({
          filename: file.name,
          parsed: this.parseMovieTitle(file.name),
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    return results;
  }

  // Scanner depuis une API backend (si vous avez accès au système de fichiers)
  async scanFromAPI(folderPath?: string): Promise<ScanResult[]> {
    try {
      // Appeler votre API backend pour scanner les fichiers
      const response = await fetch("/api/scan-movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderPath }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors du scan des films");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur scan API:", error);
      return [];
    }
  }

  private getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf("."));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Obtenir des films populaires comme fallback
  async getPopularMovies(page = 1): Promise<Movie[]> {
    try {
      const genres = await tmdbService.getGenres();
      const response = await tmdbService.getPopularMovies(page);

      return response.results.map((tmdbMovie) =>
        tmdbService.convertToMovie(tmdbMovie, genres)
      );
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des films populaires:",
        error
      );
      return [];
    }
  }

  // Obtenir les films trending de la semaine
  async getTrendingMovies(): Promise<Movie[]> {
    try {
      const genres = await tmdbService.getGenres();
      const response = await tmdbService.getTrendingMovies("week");

      return response.results.slice(0, 3).map((tmdbMovie) => {
        const movie = tmdbService.convertToMovie(tmdbMovie, genres);
        return { ...movie, isWeeklySuggestion: true };
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des films trending:",
        error
      );
      return [];
    }
  }
}

export const movieScannerService = new MovieScannerService();
