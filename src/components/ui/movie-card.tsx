import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Movie {
  id: number;
  title: string;
  posterUrl: string;
  genres: string[];
  duration: number;
  averageRating: number;
  releaseDate: string;
}

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link to={`/movie/${movie.id}`} className="block">
      <Card className="movie-card cursor-pointer group hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-[300px] object-cover rounded-t-xl"
            />
            <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full">
                  <Play className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md">
                <Star className="h-3 w-3 star-rating fill-current" />
                <span className="text-sm text-white font-medium">{movie.averageRating}</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-accent transition-colors">
                {movie.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{movie.duration} min</span>
                <span>•</span>
                <span>{new Date(movie.releaseDate).getFullYear()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre, index) => (
                <Badge key={index} variant="secondary" className="genre-badge text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}