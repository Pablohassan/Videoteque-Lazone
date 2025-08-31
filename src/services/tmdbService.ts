export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date: string;
  runtime?: number;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path?: string;
    }>;
  };
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export class TMDBService {
  private apiKey: string;
  private baseUrl = "https://api.themoviedb.org/3";
  private imageBaseUrl = "https://image.tmdb.org/t/p";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}${
      endpoint.includes("?") ? "&" : "?"
    }api_key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `TMDB API error: ${response.status} ${response.statusText}`
        );
      }
      return await response.json();
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

    const response = await this.request<TMDBSearchResponse>(endpoint);
    return response.results || [];
  }

  async getMovie(id: number): Promise<TMDBMovie | null> {
    try {
      const movie = await this.request<TMDBMovie>(
        `/movie/${id}?append_to_response=videos,credits`
      );
      return movie;
    } catch (error) {
      console.error(`Failed to get movie ${id}:`, error);
      return null;
    }
  }

  async getGenres(): Promise<TMDBGenre[]> {
    const response = await this.request<{ genres: TMDBGenre[] }>(
      "/genre/movie/list"
    );
    return response.genres || [];
  }

  async getPopularMovies(page = 1): Promise<TMDBSearchResponse> {
    return this.request<TMDBSearchResponse>(`/movie/popular?page=${page}`);
  }

  async getTrendingMovies(
    timeWindow: "day" | "week" = "week"
  ): Promise<TMDBSearchResponse> {
    return this.request<TMDBSearchResponse>(`/trending/movie/${timeWindow}`);
  }

  getImageUrl(
    path: string | null,
    size: "w200" | "w300" | "w500" | "w780" | "original" = "w500"
  ): string {
    if (!path) return "/placeholder.svg";
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  getBackdropUrl(
    path: string | null,
    size: "w300" | "w780" | "w1280" | "original" = "w1280"
  ): string {
    if (!path) return "/placeholder.svg";
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  getTrailerUrl(videos: TMDBMovie["videos"]): string | null {
    if (!videos || !videos.results || videos.results.length === 0) return null;

    const trailer = videos.results.find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser")
    );

    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  }

  extractActors(
    credits: TMDBMovie["credits"],
    limit = 10
  ): Array<{ name: string; character: string; profile_path?: string }> {
    if (!credits || !credits.cast) return [];

    return credits.cast.slice(0, limit).map((actor) => ({
      name: actor.name,
      character: actor.character,
      profile_path: actor.profile_path,
    }));
  }

  // Convertir un film TMDB au format de votre interface Movie
  convertToMovie(
    tmdbMovie: TMDBMovie,
    genres: TMDBGenre[]
  ): import("../types/movie").Movie {
    const movieGenres =
      tmdbMovie.genre_ids
        ?.map((genreId) => {
          const genre = genres.find((g) => g.id === genreId);
          return genre?.name || "";
        })
        .filter(Boolean) || [];

    const actors = this.extractActors(tmdbMovie.credits).map(
      (actor) => actor.name
    );

    return {
      id: tmdbMovie.id,
      title: tmdbMovie.title,
      synopsis: tmdbMovie.overview || "",
      posterUrl: this.getImageUrl(tmdbMovie.poster_path),
      trailerUrl: this.getTrailerUrl(tmdbMovie.videos),
      releaseDate: tmdbMovie.release_date,
      duration: tmdbMovie.runtime || 0,
      rating: Math.round((tmdbMovie.vote_average / 2) * 10) / 10, // Convertir sur 5 étoiles
      releaseYear: new Date(tmdbMovie.release_date).getFullYear(),
      genres: movieGenres,
      actors: actors,
      isWeeklySuggestion: false,
    };
  }
}

// Instance singleton du service TMDB
export const tmdbService = new TMDBService(
  import.meta.env.VITE_TMDB_API_KEY || ""
);
