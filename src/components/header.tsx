import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Film, User, LogIn } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CinéCatalogue
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium hover:text-accent transition-colors">
            Accueil
          </a>
          <a href="#" className="text-sm font-medium hover:text-accent transition-colors">
            Genres
          </a>
          <a href="#" className="text-sm font-medium hover:text-accent transition-colors">
            Nouveautés
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <SearchBar />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Connexion
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              S'inscrire
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}