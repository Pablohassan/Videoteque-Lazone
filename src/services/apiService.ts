export interface APIMovie {
  id: number;
  title: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl: string | null;
  releaseDate: string;
  duration: number;
  averageRating: number;
  reviewCount: number;
  isWeeklySuggestion: boolean;
  createdAt: string;
  updatedAt: string;
  genres: Array<{ id: number; name: string }>;
  actors: Array<{ id: number; name: string }>;
}

export interface APIGenre {
  id: number;
  name: string;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface MoviesResponse
  extends PaginatedResponse<{ movies: APIMovie[] }> {
  data: {
    movies: APIMovie[];
  };
}

export interface GenresResponse {
  data: {
    genres: APIGenre[];
  };
}

export interface SuggestionsResponse {
  data: {
    movies: APIMovie[];
  };
}

export interface SearchResponse {
  data: {
    movies: APIMovie[];
  };
}

// Interfaces pour les demandes de films
export interface MovieRequest {
  id: number;
  title: string;
  comment?: string;
  status: "pending" | "processing" | "available";
  requestedAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface MovieRequestResponse {
  data: MovieRequest[];
}

export interface CreateMovieRequestResponse {
  data: MovieRequest;
  message: string;
}

class APIService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  }

  // Méthode pour obtenir le token d'authentification
  private getAuthToken(): string | null {
    return localStorage.getItem("authToken");
  }

  // Méthode pour vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Méthode pour déconnecter l'utilisateur
  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Ajouter automatiquement le token d'authentification si disponible
    const authToken = this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (response.status === 401) {
        // Token expiré ou invalide
        this.logout();
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Erreur API");
      }

      return result;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Récupérer tous les films avec pagination et filtres
  async getMovies(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      genre?: string;
      year?: number;
    } = {}
  ): Promise<MoviesResponse> {
    const params = new URLSearchParams();

    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.search) params.append("search", options.search);
    if (options.genre) params.append("genre", options.genre);
    if (options.year) params.append("year", options.year.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/movies?${queryString}` : "/movies";

    return this.request<MoviesResponse>(endpoint);
  }

  // Récupérer les suggestions hebdomadaires
  async getSuggestions(): Promise<SuggestionsResponse> {
    return this.request<SuggestionsResponse>("/movies/suggestions");
  }

  // Récupérer tous les genres
  async getGenres(): Promise<GenresResponse> {
    return this.request<GenresResponse>("/movies/genres");
  }

  // Rechercher des films
  async searchMovies(query: string, limit?: number): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append("limit", limit.toString());

    return this.request<SearchResponse>(`/movies/search?${params}`);
  }

  // Récupérer un film par ID
  async getMovieById(id: number): Promise<{ data: { movie: APIMovie } }> {
    return this.request<{ data: { movie: APIMovie } }>(`/movies/${id}`);
  }

  // === MÉTHODES POUR LES DEMANDES DE FILMS ===

  // Créer une nouvelle demande de film
  async createMovieRequest(data: {
    title: string;
    comment?: string;
  }): Promise<CreateMovieRequestResponse> {
    return this.request("/movie-requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Récupérer les demandes de l'utilisateur connecté
  async getUserMovieRequests(): Promise<MovieRequestResponse> {
    return this.request("/movie-requests/my-requests");
  }

  // Récupérer toutes les demandes (admin)
  async getAllMovieRequests(): Promise<MovieRequestResponse> {
    return this.request("/movie-requests");
  }

  // Mettre à jour le statut d'une demande
  async updateMovieRequestStatus(
    id: number,
    status: string
  ): Promise<CreateMovieRequestResponse> {
    return this.request(`/movie-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}

export const apiService = new APIService();
