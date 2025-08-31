import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { apiService } from "../services/apiService";
import type { APIMovie } from "../services/apiService";
import { reviewService, type Review } from "../services/reviewService";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, Calendar, Clock, Star, Play, Download, FileText } from "lucide-react";
import { ReviewForm } from "../components/ReviewForm";
import { ReviewList } from "../components/ReviewList";
import { MovieFiles } from "../components/MovieFiles";
import { useToast } from "../components/ui/use-toast";

export default function MovieDetail() {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<APIMovie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (id) {
            loadMovie(parseInt(id));
        }
    }, [id]);

    const loadMovie = async (movieId: number) => {
        try {
            setLoading(true);
            const response = await apiService.getMovieById(movieId);
            if (response.data?.movie) {
                setMovie(response.data.movie);
                // Charger les critiques après le film
                await loadReviews(movieId);
            } else {
                setError("Film non trouvé");
            }
        } catch (err) {
            setError("Erreur lors du chargement du film");
            console.error("Erreur chargement film:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async (movieId: number) => {
        try {
            setReviewsLoading(true);
            const reviewsData = await reviewService.getMovieReviews(movieId);
            setReviews(reviewsData);
        } catch (err) {
            console.error("Erreur chargement critiques:", err);
            // Ne pas afficher d'erreur pour les critiques, juste les ignorer
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleSubmitReview = async (reviewData: { rating: number; comment: string }) => {
        if (!movie) return;

        try {
            setSubmittingReview(true);
            const newReview = await reviewService.createReview({
                movieId: movie.id,
                rating: reviewData.rating,
                comment: reviewData.comment,
            });

            // Ajouter la nouvelle critique à la liste
            setReviews(prev => [newReview, ...prev]);

            toast({
                title: "Critique publiée !",
                description: "Votre avis a été ajouté avec succès.",
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erreur lors de la publication";
            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleReviewUpdate = (reviewId: number, updatedReview: Review) => {
        setReviews(prev => prev.map(review =>
            review.id === reviewId ? updatedReview : review
        ));
    };

    const handleReviewDelete = (reviewId: number) => {
        setReviews(prev => prev.filter(review => review.id !== reviewId));
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-1/3">
                            <div className="h-96 bg-gray-200 rounded"></div>
                        </div>
                        <div className="w-full md:w-2/3 space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
                    <p className="text-gray-600 mb-6">{error || "Film non trouvé"}</p>
                    <Link to="/">
                        <Button>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour à l'accueil
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Bouton retour */}
            <Link to="/" className="inline-block mb-6">
                <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la collection
                </Button>
            </Link>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Poster et actions */}
                <div className="w-full lg:w-1/3">
                    <Card>
                        <CardContent className="p-6">
                            <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-full rounded-lg shadow-lg mb-6"
                            />

                            {/* Actions */}
                            <div className="space-y-3">
                                {movie.trailerUrl && (
                                    <Button className="w-full" asChild>
                                        <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                                            <Play className="h-4 w-4 mr-2" />
                                            Voir la bande-annonce
                                        </a>
                                    </Button>
                                )}

                                <Button variant="outline" className="w-full">
                                    <Download className="h-4 w-4 mr-2" />
                                    Télécharger
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Informations du film */}
                <div className="w-full lg:w-2/3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold mb-2">{movie.title}</CardTitle>

                            {/* Métadonnées */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(movie.releaseDate).getFullYear()}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{movie.duration} min</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span>{movie.averageRating}/5</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Synopsis */}
                            <div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Synopsis
                                </h3>
                                <p className="text-gray-700 leading-relaxed">{movie.synopsis}</p>
                            </div>

                            <Separator />

                            {/* Genres */}
                            {movie.genres && movie.genres.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Genres</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {movie.genres.map((genre) => (
                                            <Badge key={genre.id} variant="secondary">
                                                {genre.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Acteurs */}
                            {movie.actors && movie.actors.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Acteurs principaux</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {movie.actors.map((actor) => (
                                            <Badge key={actor.id} variant="outline">
                                                {actor.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Section des fichiers du film */}
            <div className="mt-12">
                <Separator className="mb-8" />
                <MovieFiles movieId={movie.id} />
            </div>

            {/* Section des critiques */}
            <div className="mt-12">
                <Separator className="mb-8" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulaire de critique */}
                    <div>
                        <ReviewForm
                            movieId={movie.id}
                            movieTitle={movie.title}
                            onSubmit={handleSubmitReview}
                            isSubmitting={submittingReview}
                        />
                    </div>

                    {/* Liste des critiques */}
                    <div>
                        {reviewsLoading ? (
                            <div className="animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-gray-200 rounded h-24"></div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <ReviewList
                                reviews={reviews}
                                movieTitle={movie.title}
                                onReviewUpdate={handleReviewUpdate}
                                onReviewDelete={handleReviewDelete}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
