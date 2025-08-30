import { useState } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { MovieGrid } from "@/components/movie-grid";
import { mockMovies, Movie } from "@/data/mockMovies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { genres } from "@/data/mockMovies";

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  const weeklySuggestions = mockMovies.filter(movie => movie.isWeeklySuggestion);
  const filteredMovies = selectedGenre 
    ? mockMovies.filter(movie => movie.genres.includes(selectedGenre))
    : mockMovies;

  const handleMovieClick = (movie: Movie) => {
    console.log("Movie clicked:", movie.title);
    // TODO: Navigate to movie detail page
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      
      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Weekly Suggestions */}
        <MovieGrid
          movies={weeklySuggestions}
          title="🎬 Suggestions de la semaine"
          onMovieClick={handleMovieClick}
        />

        {/* Genre Filter */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Parcourir par genre
          </h2>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedGenre === null ? "default" : "outline"}
              onClick={() => setSelectedGenre(null)}
              className="rounded-full"
            >
              Tous les genres
            </Button>
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                onClick={() => setSelectedGenre(genre)}
                className="rounded-full"
              >
                {genre}
              </Button>
            ))}
          </div>
        </section>

        {/* All Movies */}
        <MovieGrid
          movies={filteredMovies}
          title={selectedGenre ? `Films - ${selectedGenre}` : "Catalogue complet"}
          onMovieClick={handleMovieClick}
        />
      </main>

      {/* Footer */}
      <footer className="bg-secondary/20 border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            CinéCatalogue - Votre destination cinéma. Pour l'authentification et la base de données, 
            connectez-vous à Supabase via le bouton vert en haut à droite.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
