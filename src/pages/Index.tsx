import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { MovieGrid } from "@/components/movie-grid";
import { AdminInterface } from "@/components/AdminInterface";

import { useMovies } from "@/hooks/useMovies";
import type { Movie } from "@/types/movie";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Film } from "lucide-react";
import { OrderedMovies } from "@/components/ordered-movies";
import OrderMovieForm from "@/components/order-movie-form";
import { apiService } from "@/services/apiService";

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isAdminInterface, setIsAdminInterface] = useState(false);

  const {
    movies,
    suggestions,
    loading,
    error,
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

  // Fonction de recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filtrer les films par genre et recherche
  const filteredMovies = useMemo(() => {
    let filtered = movies;

    // Filtrage par genre
    if (selectedGenre) {
      filtered = filtered.filter(movie => movie.genres.includes(selectedGenre));
    }

    // Filtrage par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.synopsis.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [movies, selectedGenre, searchQuery]);

  const handleMovieClick = (movie: Movie) => {
    console.log("Movie clicked:", movie.title);
    // TODO: Navigate to movie detail page
  };

  const handleOpenOrderForm = () => {
    setIsOrderFormOpen(true);
  };

  const handleAdminPanelClick = () => {
    setIsAdminInterface(true);
  };

  const handleBackToUserInterface = () => {
    setIsAdminInterface(false);
  };

  // Si on est en mode admin, afficher l'interface d'administration
  if (isAdminInterface) {
    return <AdminInterface onBackToUserInterface={handleBackToUserInterface} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} onAdminPanelClick={handleAdminPanelClick} />
      <HeroSection onOpenOrderForm={handleOpenOrderForm} />

      {/* Formulaire de commande modal */}
      <OrderMovieForm
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        onOrderSubmitted={() => {
          setIsOrderFormOpen(false);
          // Optionnel : recharger les demandes si on est dans l'onglet commandes
        }}
        showTrigger={false}
      />

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

            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Mes Commandes
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
              title={
                searchQuery.trim()
                  ? `Résultats de recherche pour "${searchQuery}" (${filteredMovies.length} films)`
                  : selectedGenre
                    ? `Films - ${selectedGenre}`
                    : "Votre Collection de Films"
              }
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



          <TabsContent value="orders" className="space-y-6">
            <OrderedMovies />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-secondary/20 border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Videotej - Votre destination cinéma. Pour l'authentification et la base de données,
            connectez-vous à Supabase via le bouton vert en haut à droite.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
