import React, { useState, useEffect } from 'react';
import { Star, StarOff, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { reviewService } from '../services/reviewService';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  movieTitle: string;
  onReviewUpdate?: (reviewId: number, updatedReview: Review) => void;
  onReviewDelete?: (reviewId: number) => void;
}

export function ReviewList({ reviews, movieTitle, onReviewUpdate, onReviewDelete }: ReviewListProps) {
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    }
  }, []);

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment('');
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId) return;

    try {
      setIsSubmitting(true);
      const updatedReview = await reviewService.updateReview(editingReviewId, {
        rating: editRating,
        comment: editComment,
      });

      // Notifier le composant parent
      if (onReviewUpdate) {
        onReviewUpdate(editingReviewId, updatedReview);
      }

      toast({
        title: "Critique mise à jour",
        description: "Votre critique a été modifiée avec succès",
      });

      setEditingReviewId(null);
      setEditRating(0);
      setEditComment('');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette critique ?")) return;

    try {
      setIsSubmitting(true);
      await reviewService.deleteReview(reviewId);

      // Notifier le composant parent
      if (onReviewDelete) {
        onReviewDelete(reviewId);
      }

      toast({
        title: "Critique supprimée",
        description: "Votre critique a été supprimée avec succès",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, isEditable = false, onChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= rating;

      if (isEditable && onChange) {
        return (
          <button
            key={index}
            type="button"
            className="p-1 transition-colors hover:scale-110"
            onClick={() => onChange(starValue)}
          >
            {isFilled ? (
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
            ) : (
              <StarOff className="h-4 w-4 text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        );
      }

      return (
        <span key={index} className="inline-block">
          {isFilled ? (
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
          ) : (
            <StarOff className="h-4 w-4 text-gray-300" />
          )}
        </span>
      );
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch {
      return 'Date inconnue';
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <Star className="h-12 w-12 mx-auto opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune critique encore
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Soyez le premier à donner votre avis sur "{movieTitle}" ! 🎬
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        📝 Critiques ({reviews.length})
      </h3>

      <div className="space-y-4">
        {reviews.map((review) => {
          const isOwner = currentUser && currentUser.id === review.author.id;
          const isEditing = editingReviewId === review.id;

          if (isEditing) {
            return (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {review.author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {review.author.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSubmitting}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUpdateReview}
                        disabled={isSubmitting || editRating === 0 || editComment.trim().length < 10}
                      >
                        {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  </div>

                  {/* Note avec étoiles */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Votre note
                    </Label>
                    <div className="flex items-center space-x-1">
                      {renderStars(editRating, true, setEditRating)}
                      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                        {editRating}/5
                      </span>
                    </div>
                  </div>

                  {/* Commentaire */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Votre commentaire
                    </Label>
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={2000}
                      disabled={isSubmitting}
                    />
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      {editComment.length}/2000
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              {/* En-tête de la critique */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {review.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {review.author.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {review.rating}/5
                    </span>
                  </div>

                  {/* Actions pour le propriétaire */}
                  {isOwner && (
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(review)}
                        disabled={isSubmitting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenu de la critique */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {review.comment}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
