import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import type { Movie } from "../types/movie";

export interface UseMoviesReturn {
  movies: Movie[];
  suggestions: Movie[];
  loading: boolean;
  error: string | null;
  refreshMovies: () => Promise<void>;
}

export function useMovies(): UseMoviesReturn {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les films depuis la base de données
  const loadMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getMovies({ page: 1, limit: 20 });
      // Convertir les films de l'API au format Movie
      const convertedMovies: Movie[] = response.data.movies.map((dbMovie) => ({
        id: dbMovie.id,
        title: dbMovie.title,
        synopsis: dbMovie.synopsis,
        posterUrl: dbMovie.posterUrl,
        trailerUrl: dbMovie.trailerUrl || "",
        releaseDate: dbMovie.releaseDate,
        duration: dbMovie.duration,
        rating: dbMovie.averageRating,
        releaseYear: new Date(dbMovie.releaseDate).getFullYear(),
        genres: dbMovie.genres.map((g) => g.name),
        actors: dbMovie.actors.map((a) => a.name),
        isWeeklySuggestion: dbMovie.isWeeklySuggestion,
      }));
      setMovies(convertedMovies);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des films"
      );
      console.error("Erreur chargement films:", err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les suggestions hebdomadaires
  const loadSuggestions = async () => {
    try {
      const response = await apiService.getSuggestions();
      const convertedSuggestions: Movie[] = response.data.movies.map(
        (dbMovie) => ({
          id: dbMovie.id,
          title: dbMovie.title,
          synopsis: dbMovie.synopsis,
          posterUrl: dbMovie.posterUrl,
          trailerUrl: dbMovie.trailerUrl || "",
          releaseDate: dbMovie.releaseDate,
          duration: dbMovie.duration,
          rating: dbMovie.averageRating,
          releaseYear: new Date(dbMovie.releaseDate).getFullYear(),
          genres: dbMovie.genres.map((g) => g.name),
          actors: dbMovie.actors.map((a) => a.name),
          isWeeklySuggestion: dbMovie.isWeeklySuggestion,
        })
      );
      setSuggestions(convertedSuggestions);
    } catch (err) {
      console.error("Erreur chargement suggestions:", err);
    }
  };

  // Actualiser les films
  const refreshMovies = async () => {
    await Promise.all([loadMovies(), loadSuggestions()]);
  };

  // Charger les données au montage
  useEffect(() => {
    refreshMovies();
  }, []);

  return {
    movies,
    suggestions,
    loading,
    error,
    refreshMovies,
  };
}
