import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Star, StarOff } from 'lucide-react';
import { toast } from './ui/use-toast';
import { LoginModal } from './LoginModal';

interface ReviewFormProps {
  movieId: number;
  movieTitle: string;
  onSubmit: (review: { rating: number; comment: string }) => void;
  isSubmitting?: boolean;
}

export function ReviewForm({ movieId, movieTitle, onSubmit, isSubmitting = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Vérifier l'authentification au chargement
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalide, nettoyer le localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleLoginSuccess = (token: string, userData: { id: number; name: string; email: string }) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez donner une note au film",
        variant: "destructive",
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Commentaire trop court",
        description: "Votre commentaire doit contenir au moins 10 caractères",
        variant: "destructive",
      });
      return;
    }

    onSubmit({ rating, comment: comment.trim() });

    // Reset form after submission
    setRating(0);
    setComment('');
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (hoveredRating || rating);

      return (
        <button
          key={index}
          type="button"
          className="p-1 transition-colors hover:scale-110"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          {isFilled ? (
            <Star className="h-6 w-6 text-yellow-400 fill-current" />
          ) : (
            <StarOff className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
          )}
        </button>
      );
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💬 Laissez votre critique
        </h3>

        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <Star className="h-16 w-16 mx-auto opacity-50" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connexion requise
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connectez-vous pour laisser votre avis sur "{movieTitle}"
          </p>

          <Button onClick={() => setShowLoginModal(true)} className="bg-blue-600 hover:bg-blue-700">
            🔐 Se connecter
          </Button>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          💬 Laissez votre critique
        </h3>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Connecté en tant que <strong>{user?.name}</strong>
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Note avec étoiles */}
        <div className="space-y-2">
          <Label htmlFor="rating" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Votre note *
          </Label>
          <div className="flex items-center space-x-1">
            {renderStars()}
            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
              {rating > 0 ? `${rating}/5` : 'Cliquez pour noter'}
            </span>
          </div>
        </div>

        {/* Commentaire */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Votre commentaire *
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Partagez votre avis sur "${movieTitle}"... 🎬✨

Vous pouvez utiliser des emojis et caractères spéciaux !`}
            className="min-h-[120px] resize-none"
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Minimum 10 caractères</span>
            <span>{comment.length}/2000</span>
          </div>
        </div>

        {/* Bouton de soumission */}
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Envoi en cours...
            </>
          ) : (
            '📝 Publier ma critique'
          )}
        </Button>
      </form>

      {/* Info sur les caractères spéciaux */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Astuce :</strong> Vous pouvez utiliser des emojis (🎬✨🔥) pour exprimer vos émotions !
        </p>
      </div>
    </div>
  );
}
