import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Film, Plus, Loader2, Lock, Search, Calendar, Star, Check, RefreshCw } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { apiService } from '../services/apiService';
import { LoginModal } from './LoginModal';
import { tmdbService, TMDBMovie } from '../services/tmdbService';
import { Badge } from './ui/badge';

interface OrderMovieFormProps {
    onOrderSubmitted?: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    showTrigger?: boolean;
}

let renderCount = 0;
export function OrderMovieForm({ onOrderSubmitted, isOpen: externalIsOpen, onClose, showTrigger = true }: OrderMovieFormProps) {
    renderCount++;

    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Utiliser l'état externe si fourni, sinon l'état interne
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const setIsOpen = externalIsOpen !== undefined ? (open: boolean) => {
        if (onClose && !open) onClose();
    } : setInternalIsOpen;
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // États pour le wheel picker TMDB
    const [wheelMovies, setWheelMovies] = useState<TMDBMovie[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
    const [isLoadingMovies, setIsLoadingMovies] = useState(false);
    const [currentSearchQuery, setCurrentSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [searchValue, setSearchValue] = useState(''); // Valeur de recherche simple
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { toast } = useToast();

    // Recherche TMDB pour le wheel picker - VERSION ULTRA STABLE
    const searchMoviesForWheel = useCallback(async (query: string): Promise<void> => {
        if (!query.trim() || query.length < 2) {
            // Utiliser requestAnimationFrame pour éviter re-render immédiat
            requestAnimationFrame(() => {
                setWheelMovies([]);
                setHasSearched(false);
                setSelectedMovie(null); // Important: reset selection
            });
            return;
        }

        // NE PAS CHANGER isLoadingMovies pendant la frappe pour éviter re-render
        try {
            console.log('🔍 Recherche TMDB pour wheel picker:', query);
            const results = await tmdbService.searchMovie(query);
            console.log('✅ Résultats TMDB pour wheel picker:', results.length);

            // Utiliser requestAnimationFrame pour différer les setState et éviter re-render immédiat
            requestAnimationFrame(() => {
                console.log('📊 DISPLAYING RESULTS for:', query);
                setWheelMovies(results);
                setCurrentSearchQuery(query);
                setHasSearched(true);
                setSelectedMovie(null); // Reset selection pour éviter auto-sélection
                console.log('🎯 Résultats affichés:', results.length, 'films');

                // Remettre le focus APRÈS les résultats affichés
                setTimeout(() => {
                    if (searchInputRef.current) {
                        console.log('🎯 REFOCUSING INPUT after results');
                        searchInputRef.current.focus();
                    }
                }, 50);
            });
        } catch (error) {
            console.error('❌ Erreur recherche TMDB:', error);
            console.error('Erreur recherche TMDB:', error);
        }
    }, []); // AUCUNE dépendance pour éviter les re-renders

    // Recherche initiale pour le wheel picker (films populaires)
    useEffect(() => {
        const loadInitialMovies = async () => {
            setIsLoadingMovies(true);
            try {
                console.log('🎬 Chargement initial des films populaires...');
                // Charger quelques films populaires pour commencer
                const results = await tmdbService.searchMovie("popular");
                console.log('✅ Films populaires chargés:', results.length);
                // Utiliser requestAnimationFrame pour éviter re-render immédiat au montage
                requestAnimationFrame(() => {
                    setWheelMovies(results.slice(0, 20)); // Limiter à 20 films
                    setHasSearched(true);
                    setCurrentSearchQuery("Films populaires");
                    setIsLoadingMovies(false);
                });
            } catch (error) {
                console.error('❌ Erreur chargement initial:', error);
                requestAnimationFrame(() => {
                    setWheelMovies([]);
                    setHasSearched(false);
                    setIsLoadingMovies(false);
                });
            }
        };

        // Charger seulement au montage initial
        loadInitialMovies();
    }, []); // Uniquement au montage

    // Fonction pour recharger les films populaires - VERSION ULTRA STABLE
    const loadPopularMovies = useCallback(async () => {
        console.log('🔧 loadPopularMovies EXECUTED'); // DEBUG: voir quand la fonction est appelée
        setIsLoadingMovies(true);
        try {
            console.log('🔄 Rechargement des films populaires...');
            const results = await tmdbService.searchMovie("popular");
            console.log('✅ Films populaires rechargés:', results.length);
            requestAnimationFrame(() => {
                setWheelMovies(results.slice(0, 20));
                setHasSearched(true);
                setCurrentSearchQuery("Films populaires");
                setSearchValue(""); // Vider le champ de recherche
                setIsLoadingMovies(false);
                // Remettre le focus sur l'input après rechargement
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            });
        } catch (error) {
            console.error('❌ Erreur rechargement:', error);
            console.error('Erreur chargement films populaires:', error);
            setIsLoadingMovies(false);
        }
    }, []); // AUCUNE dépendance pour éviter les re-renders

    const handleMovieSelect = useCallback((movie: TMDBMovie) => {
        console.log('🔧 handleMovieSelect EXECUTED'); // DEBUG: voir quand la fonction est appelée
        console.log('🎬 Film sélectionné MANUELLEMENT:', movie.title);

        // Utiliser requestAnimationFrame pour grouper les setState
        requestAnimationFrame(() => {
            setSelectedMovie(movie);
            setTitle(movie.title);

            // Générer un commentaire automatique avec les infos du film
            const releaseYear = new Date(movie.release_date).getFullYear();
            const autoComment = `${movie.title} (${releaseYear}) - Note: ${movie.vote_average}/10`;
            setComment(autoComment);

            console.log('✅ Film sélectionné:', movie.title, `(${releaseYear})`);
        });
    }, []); // AUCUNE dépendance pour éviter les re-renders

    // Recherche prédictive avec debounce - VERSION ULTRA STABLE
    useEffect(() => {
        console.log('🎯 useEffect EXECUTED - searchValue:', searchValue); // DEBUG: voir quand useEffect s'exécute

        // Nettoyer l'ancien timer
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const trimmedValue = searchValue.trim();

        // Si vide ou trop court, ne rien faire
        if (!trimmedValue || trimmedValue.length < 3) {
            console.log('⏭️ useEffect SKIPPED - too short:', trimmedValue.length);
            return;
        }

        console.log('⏰ useEffect SETTING TIMEOUT for:', trimmedValue);
        // Lancer la recherche avec debounce DIRECTEMENT
        searchTimeoutRef.current = setTimeout(() => {
            console.log('🔍 Recherche prédictive:', trimmedValue);
            searchMoviesForWheel(trimmedValue);
        }, 500); // 500ms de debounce

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchValue, searchMoviesForWheel]); // Ajouter searchMoviesForWheel pour ESLint


    // Gestionnaire pour la recherche manuelle (bouton ou Enter)
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchValue.trim();
        if (query) {
            console.log('🔍 Lancement recherche manuelle:', query);
            searchMoviesForWheel(query);
        }
    };

    // Gestionnaire pour la sélection dans le wheel picker
    const handleWheelSelect = useCallback((index: number) => {
        if (wheelMovies[index]) {
            handleMovieSelect(wheelMovies[index]);
        }
    }, [wheelMovies, handleMovieSelect]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('🚀 Début de la soumission du formulaire...');

        // Vérifier l'authentification
        if (!apiService.isAuthenticated()) {
            console.log('❌ Utilisateur non authentifié, ouverture du modal de connexion');
            setShowLoginModal(true);
            return;
        }

        console.log('✅ Utilisateur authentifié');

        if (!title.trim()) {
            console.log('❌ Titre vide');
            toast({
                title: "Erreur",
                description: "Le titre du film est requis",
                variant: "destructive",
            });
            return;
        }

        console.log('📝 Titre valide:', title.trim());
        setIsSubmitting(true);

        // Timeout de 60 secondes avec message d'attente
        const timeoutId = setTimeout(() => {
            console.log('⏰ Timeout atteint, mais la requête continue en arrière-plan');
            // Ne pas arrêter la soumission, juste avertir l'utilisateur
            toast({
                title: "Traitement en cours...",
                description: "La demande prend du temps mais continue. Rafraîchissez la page dans quelques instants.",
                variant: "default",
            });
        }, 60000);

        try {
            console.log('📡 Envoi de la requête API...');
            const result = await apiService.createMovieRequest({
                title: title.trim(),
                comment: comment.trim() || undefined,
            });

            console.log('✅ Requête API réussie:', result);

            // Annuler le timeout
            clearTimeout(timeoutId);

            toast({
                title: "Succès !",
                description: "Votre demande de film a été enregistrée",
            });

            // Réinitialiser le formulaire
            setTitle('');
            setComment('');
            setIsOpen(false);

            // Notifier le composant parent
            onOrderSubmitted?.();
        } catch (error) {
            console.error('❌ Erreur lors de la commande:', error);

            // Annuler le timeout
            clearTimeout(timeoutId);

            // Gestion spéciale pour les erreurs d'authentification
            if (error instanceof Error && error.message.includes('Session expirée')) {
                toast({
                    title: "Session expirée",
                    description: "Reconnexion automatique en cours...",
                    variant: "destructive",
                });

                // Nettoyer et recharger automatiquement
                setTimeout(() => {
                    localStorage.clear();
                    window.location.reload();
                }, 2000);
                return;
            }

            toast({
                title: "Erreur",
                description: error instanceof Error ? error.message : "Erreur lors de la création de la demande",
                variant: "destructive",
            });
        } finally {
            console.log('🔄 Fin de la soumission');
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !isSubmitting) {
            setIsOpen(open);
            // Réinitialiser le formulaire si on ferme sans soumettre
            if (!isSubmitting) {
                setTitle('');
                setComment('');
            }
        }
    };

    const handleLoginSuccess = (token: string, user: { id: number; name: string; email: string; role: string }) => {
        setShowLoginModal(false);
        toast({
            title: "Connexion réussie !",
            description: `Bienvenue ${user.name} ! Vous pouvez maintenant commander un film.`,
        });
    };

    const handleOrderClick = () => {
        if (!apiService.isAuthenticated()) {
            setShowLoginModal(true);
        } else {
            setIsOpen(true);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                {showTrigger && (
                    <DialogTrigger asChild>
                        <Button onClick={handleOrderClick} className="flex items-center gap-2">
                            <Lock className={`h-4 w-4 ${apiService.isAuthenticated() ? 'text-green-500' : 'text-orange-500'}`} />
                            Commander un film
                            {!apiService.isAuthenticated() && (
                                <span className="text-xs opacity-75">(Connexion requise)</span>
                            )}
                        </Button>
                    </DialogTrigger>
                )}

                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Film className="h-5 w-5" />
                            Commander un film
                        </DialogTitle>
                        <DialogDescription>
                            Recherchez un film dans notre base de données TMDB et soumettez votre demande.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="movie-search">Rechercher un film *</Label>

                            {/* Barre de recherche */}
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            ref={searchInputRef}
                                            value={searchValue}
                                            placeholder="Rechercher un film sur TMDB..."
                                            className="pl-10"
                                            disabled={isSubmitting || isLoadingMovies}
                                            onChange={(e) => {
                                                console.log('⌨️ INPUT onChange:', e.target.value);
                                                setSearchValue(e.target.value);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearchSubmit(e);
                                                }
                                            }}
                                        />
                                        {isLoadingMovies && (
                                            <div className="absolute right-3 top-3">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleSearchSubmit}
                                        disabled={isLoadingMovies || isSubmitting || !searchValue.trim()}
                                        className="bg-yellow-500 text-black"
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={loadPopularMovies}
                                        disabled={isLoadingMovies || isSubmitting}
                                        title="Recharger les films populaires"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Affichage de la recherche actuelle */}
                                {(hasSearched || isLoadingMovies) && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        {isLoadingMovies && (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
                                                <span>Recherche en cours...</span>
                                            </>
                                        )}

                                    </div>
                                )}
                            </div>

                            {/* Wheel Picker - Version simplifiée */}
                            {hasSearched && wheelMovies.length > 0 && (
                                <div className="space-y-4">
                                    <div className="text-center">

                                        {!selectedMovie && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                Aucun film sélectionné - Continuez à taper ou choisissez un film
                                            </p>
                                        )}
                                    </div>

                                    <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                                        {wheelMovies.map((movie, index) => (
                                            <div
                                                key={movie.id}
                                                onClick={() => handleWheelSelect(index)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-purple-950 hover:shadow-md ${selectedMovie?.id === movie.id
                                                    ? 'bg-primary/10 border-2 border-primary shadow-sm'
                                                    : 'border border-transparent hover:border-accent'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden">
                                                        {movie.poster_path ? (
                                                            <img
                                                                src={tmdbService.getImageUrl(movie.poster_path, 'w200')}
                                                                alt={movie.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                <Film className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm">{movie.title}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                            <Calendar className="h-2.5 w-2.5" />
                                                            {new Date(movie.release_date).getFullYear()}
                                                            <Star className="h-2.5 w-2.5" />
                                                            {movie.vote_average.toFixed(1)}/10
                                                        </div>
                                                    </div>
                                                    {selectedMovie?.id === movie.id && (
                                                        <div className="text-primary">
                                                            <Check className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-center">

                                    </div>
                                </div>
                            )}

                            {/* Affichage du film sélectionné */}
                            {selectedMovie ? (
                                <div className="mt-4 p-4 bg-yellow-200 rounded-lg border-2 border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-16 h-24 bg-muted rounded overflow-hidden">
                                            {selectedMovie.poster_path ? (
                                                <img
                                                    src={tmdbService.getImageUrl(selectedMovie.poster_path, 'w200')}
                                                    alt={selectedMovie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-black">
                                                    <Film className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-base text-black">{selectedMovie.title}</div>
                                            <div className="text-sm text-black flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(selectedMovie.release_date).getFullYear()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-3 w-3" />
                                                    {selectedMovie.vote_average.toFixed(1)}/10
                                                </span>
                                            </div>
                                            {selectedMovie.overview && (
                                                <div className="text-xs text-black mt-2 overflow-hidden" style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {selectedMovie.overview}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-sm text-black bg-green-100">
                                            ✅ Sélectionné
                                        </Badge>
                                    </div>
                                </div>
                            ) : hasSearched && wheelMovies.length > 0 && (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-orange-700">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <p className="text-sm">
                                            <strong>Aucun film sélectionné</strong> - Cliquez sur un film dans la liste ci-dessus pour le choisir
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Message d'aide */}
                            {!hasSearched && !isLoadingMovies && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">
                                        Tapez pour rechercher un film automatiquement
                                    </p>
                                    <p className="text-xs mt-1">
                                        🔍 Recherche prédictive • 📱 Cliquez pour sélectionner
                                    </p>
                                    <p className="text-xs mt-2 text-primary/70">
                                        Les résultats apparaissent après 3 caractères • Aucun film pré-sélectionné
                                    </p>
                                </div>
                            )}

                            {/* Message de chargement */}
                            {isLoadingMovies && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                                    <p className="text-sm">
                                        Recherche en cours...
                                    </p>
                                </div>
                            )}

                            {/* Message quand pas de résultats */}
                            {hasSearched && !isLoadingMovies && wheelMovies.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                    <Film className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p className="text-sm mb-2">
                                        Aucun film trouvé pour "{currentSearchQuery}"
                                    </p>
                                    <p className="text-xs">
                                        Essayez avec un autre terme de recherche
                                    </p>
                                </div>
                            )}
                        </div>


                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isSubmitting}
                                className="bg-red-500 text-white"
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-yellow-500 text-black">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    'Commander le film'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de connexion */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </>
    );
}

export default OrderMovieForm;
