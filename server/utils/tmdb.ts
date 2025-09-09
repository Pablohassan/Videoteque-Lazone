import fetch from "node-fetch";
import { TMDBMovie, TMDBGenre } from "../types/index.js";

export class TMDBClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY!;
    this.baseUrl = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
    console.log(
      "🔑 TMDB Client initialisé avec API key:",
      this.apiKey ? this.apiKey.substring(0, 8) + "..." : "Non définie"
    );
  }

  private async request<T = unknown>(endpoint: string): Promise<T> {
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${this.baseUrl}${endpoint}${separator}api_key=${this.apiKey}`;
    console.log("🌐 TMDB URL appelée:", url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      console.error(`TMDB request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async searchMovie(title: string, year?: number): Promise<TMDBMovie[]> {
    let endpoint = `/search/movie?query=${encodeURIComponent(title)}`;
    if (year) {
      endpoint += `&year=${year}`;
    }

    const data = await this.request<{ results?: TMDBMovie[] }>(endpoint);
    return data.results ?? [];
  }

  async getMovie(id: number): Promise<TMDBMovie | null> {
    try {
      const movie = await this.request<TMDBMovie>(
        `/movie/${id}?append_to_response=videos,credits`
      );
      return movie;
    } catch (error) {
      return null;
    }
  }

  async getGenres(): Promise<TMDBGenre[]> {
    const data = await this.request<{ genres?: TMDBGenre[] }>(
      "/genre/movie/list"
    );
    return data.genres ?? [];
  }

  async getPopularMovies(
    page = 1
  ): Promise<{ results: TMDBMovie[]; total_pages: number }> {
    const data = await this.request<{
      results?: TMDBMovie[];
      total_pages?: number;
    }>(`/movie/popular?page=${page}`);
    return {
      results: data.results ?? [],
      total_pages: data.total_pages ?? 0,
    };
  }

  getImageUrl(path: string, size = "w500"): string {
    if (!path) return "";
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  getTrailerUrl(
    videos: Array<{ key: string; site: string; type: string }>
  ): string | null {
    if (!videos || videos.length === 0) return null;

    const trailer = videos.find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser")
    );

    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  }

  extractActors(credits: TMDBMovie["credits"]): string[] {
    if (!credits || !credits.cast) return [];

    return credits.cast
      .slice(0, 10) // Prendre les 10 premiers acteurs
      .map((actor: { name: string }) => actor.name)
      .filter((name): name is string => Boolean(name));
  }
}

// Créer le client après chargement des variables d'environnement
export function createTMDBClient(): TMDBClient {
  return new TMDBClient();
}
