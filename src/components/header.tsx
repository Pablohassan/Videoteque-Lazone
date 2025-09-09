import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Film, User, LogIn, LogOut, Settings, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { LoginModal } from "./LoginModal";
import { SignUpModal } from "./SignUpModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { apiService } from "../services/apiService";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface HeaderProps {
  onSearch?: (query: string) => void;
  onAdminPanelClick?: () => void;
}

export function Header({ onSearch, onAdminPanelClick }: HeaderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    if (apiService.isAuthenticated()) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Erreur lors du parsing des données utilisateur:', error);
          apiService.logout();
        }
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (token: string, userData: User) => {
    // L'apiService gère automatiquement le stockage du token
    setUser(userData);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Videotek
            </h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Videotek
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-accent transition-colors">
              Nouveautés
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <SearchBar onSearch={onSearch} />
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Bonjour, {user.name}
                    </span>
                    {isAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>

                  {isAdmin && onAdminPanelClick && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAdminPanelClick}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Administration
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsLoginModalOpen(true)}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Connexion
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSignUpModalOpen(true)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    S'inscrire
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onForgotPassword={() => {
          setIsLoginModalOpen(false);
          setIsForgotPasswordModalOpen(true);
        }}
      />

      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </>
  );
}