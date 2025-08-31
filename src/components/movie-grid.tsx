import { MovieCard } from "@/components/ui/movie-card";
import { Movie } from "@/types/movie";

interface MovieGridProps {
  movies: Movie[];
  title?: string;
  onMovieClick?: (movie: Movie) => void;
}

export function MovieGrid({ movies, title, onMovieClick }: MovieGridProps) {
  return (
    <section className="space-y-6">
      {title && (
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieClick?.(movie)}
          />
        ))}
      </div>
    </section>
  );
}