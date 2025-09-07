import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, CheckCircle, Download, Film, RefreshCw, Loader2, Settings, Trash2 } from 'lucide-react';
import OrderMovieForm from './order-movie-form';
import { useToast } from './ui/use-toast';
import { apiService, type MovieRequest } from '../services/apiService';

interface OrderedMovie {
    id: number;
    title: string;
    comment?: string;
    status: 'pending' | 'processing' | 'available';
    requestedAt: string;
    updatedAt: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface OrderedMoviesProps {
    movies?: OrderedMovie[];
}

export function OrderedMovies({ movies: initialMovies }: OrderedMoviesProps) {
    const [movies, setMovies] = useState<OrderedMovie[]>(initialMovies || []);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const loadRequests = useCallback(async () => {
        setLoading(true);
        try {
            // Vérifier le rôle de l'utilisateur depuis le localStorage
            const userData = localStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : null;
            const isAdmin = user?.role === 'ADMIN';

            // Si admin, charger toutes les demandes, sinon seulement celles de l'utilisateur
            const result = isAdmin
                ? await apiService.getAllMovieRequests()
                : await apiService.getUserMovieRequests();

            setMovies(result.data);
        } catch (error) {
            console.error('Erreur lors du chargement des demandes:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger vos demandes de films",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleOrderSubmitted = () => {
        loadRequests(); // Recharger les demandes après une nouvelle commande
    };

    const handleStatusChange = async (requestId: number, newStatus: string) => {
        try {
            await apiService.updateMovieRequestStatus(requestId, newStatus);
            toast({
                title: "Statut mis à jour",
                description: "Le statut de la demande a été modifié avec succès",
            });
            loadRequests(); // Recharger les demandes
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le statut",
                variant: "destructive",
            });
        }
    };

    const handleDeleteRequest = async (requestId: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
            return;
        }

        try {
            await apiService.deleteMovieRequest(requestId);
            toast({
                title: "Demande supprimée",
                description: "La demande a été supprimée avec succès",
            });
            loadRequests(); // Recharger les demandes
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast({
                title: "Erreur",
                description: "Impossible de supprimer la demande",
                variant: "destructive",
            });
        }
    };

    const pendingMovies = movies.filter(m => m.status === 'pending');
    const processingMovies = movies.filter(m => m.status === 'processing');
    const availableMovies = movies.filter(m => m.status === 'available');

    const renderMovieCard = (movie: OrderedMovie) => {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const isAdmin = user?.role === 'ADMIN';

        return (
            <Card key={movie.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold truncate">
                            {movie.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant={
                                movie.status === 'pending' ? 'secondary' :
                                    movie.status === 'processing' ? 'default' :
                                        'outline'
                            }>
                                {movie.status === 'pending' ? 'En attente' :
                                    movie.status === 'processing' ? 'En cours' :
                                        'Disponible'}
                            </Badge>
                            {isAdmin && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStatusChange(movie.id, movie.status === 'pending' ? 'processing' : movie.status === 'processing' ? 'available' : 'pending')}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Settings className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteRequest(movie.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>Demandé le {new Date(movie.requestedAt).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs">Par {movie.user.name} ({movie.user.email})</p>
                        {movie.comment && (
                            <p className="text-xs bg-muted p-2 rounded">
                                <strong>Commentaire :</strong> {movie.comment}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-8">
            {/* En-tête avec boutons d'action */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                    {(() => {
                        const userData = localStorage.getItem('user');
                        const user = userData ? JSON.parse(userData) : null;
                        return user?.role === 'ADMIN' ? 'Toutes les Demandes de Films' : 'Mes Demandes de Films';
                    })()}
                </h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadRequests}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                    <OrderMovieForm onOrderSubmitted={handleOrderSubmitted} />
                </div>
            </div>

            {/* Films en attente de prise en charge */}
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    En attente de prise en charge
                    {pendingMovies.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {pendingMovies.length}
                        </Badge>
                    )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : pendingMovies.length > 0 ? (
                        pendingMovies.map(renderMovieCard)
                    ) : (
                        <Card className="border-orange-200 bg-orange-50/50">
                            <CardContent className="p-6 text-center">
                                <Clock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                                <p className="text-sm text-orange-600">
                                    Aucun film en attente pour le moment
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>

            {/* Films pris en charge */}
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    Pris en charge
                    {processingMovies.length > 0 && (
                        <Badge variant="default" className="ml-2">
                            {processingMovies.length}
                        </Badge>
                    )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : processingMovies.length > 0 ? (
                        processingMovies.map(renderMovieCard)
                    ) : (
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                                <p className="text-sm text-blue-600">
                                    Aucun film pris en charge pour le moment
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>

            {/* Films disponibles */}
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Download className="h-5 w-5 text-green-500" />
                    Disponible
                    {availableMovies.length > 0 && (
                        <Badge variant="outline" className="ml-2">
                            {availableMovies.length}
                        </Badge>
                    )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : availableMovies.length > 0 ? (
                        availableMovies.map(renderMovieCard)
                    ) : (
                        <Card className="border-green-200 bg-green-50/4">
                            <CardContent className="p-6 text-center">
                                <Download className="h-12 w-12 text-green-400 mx-auto mb-4" />
                                <p className="text-sm text-green-600">
                                    Aucun film disponible pour le moment
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    );
}
