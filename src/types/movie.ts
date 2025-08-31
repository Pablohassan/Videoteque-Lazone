export interface Movie {
  id: number;
  title: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: string;
  duration: number;
  rating: number;
  releaseYear: number;
  genres: string[];
  actors: string[];
  isWeeklySuggestion?: boolean;
}
