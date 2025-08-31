import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { MovieGrid } from "@/components/movie-grid";
import { MovieScanner } from "@/components/movie-scanner";
import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/types/movie";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Film, Upload } from "lucide-react";

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const {
    movies,
    suggestions,
    loading,
    error,
    scanFiles,
    scanResults,
    scanning,
    refreshMovies
  } = useMovies();

  // Extraire les genres uniques des films
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    movies.forEach(movie => {
      movie.genres.forEach(genre => genresSet.add(genre));
    });
    return Array.from(genresSet).sort();
  }, [movies]);

  // Filtrer les films par genre
  const filteredMovies = selectedGenre
    ? movies.filter(movie => movie.genres.includes(selectedGenre))
    : movies;

  const handleMovieClick = (movie: Movie) => {
    console.log("Movie clicked:", movie.title);
    // TODO: Navigate to movie detail page
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      <main className="container mx-auto px-4 py-12 space-y-16">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs pour organiser le contenu */}
        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Votre Collection
            </TabsTrigger>
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Scanner vos films
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-16">
            {/* Weekly Suggestions */}
            {suggestions.length > 0 && (
              <MovieGrid
                movies={suggestions}
                title="🎬 Suggestions de la semaine"
                onMovieClick={handleMovieClick}
              />
            )}

            {/* Actions */}
            <div className="flex justify-center">
              <Button
                onClick={refreshMovies}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Chargement...' : 'Actualiser les films'}
              </Button>
            </div>

            {/* Genre Filter */}
            {availableGenres.length > 0 && (
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
                  {availableGenres.map((genre) => (
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
            )}

            {/* All Movies */}
            <MovieGrid
              movies={filteredMovies}
              title={selectedGenre ? `Films - ${selectedGenre}` : "Votre Collection de Films"}
              onMovieClick={handleMovieClick}
            />

            {movies.length === 0 && !loading && (
              <Card>
                <CardHeader>
                  <CardTitle>Aucun film trouvé</CardTitle>
                  <CardDescription>
                    Utilisez l'onglet "Scanner vos films" pour ajouter vos films locaux
                    ou actualisez pour charger vos films depuis la base de données.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="scanner" className="space-y-6">
            <MovieScanner
              onScan={scanFiles}
              scanning={scanning}
              results={scanResults}
            />
          </TabsContent>
        </Tabs>
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
