import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Film, Plus, Loader2, Lock, Search, Check, Calendar, Star } from 'lucide-react';
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

export function OrderMovieForm({ onOrderSubmitted, isOpen: externalIsOpen, onClose, showTrigger = true }: OrderMovieFormProps) {
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

    // États pour la recherche TMDB
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const { toast } = useToast();

    // Recherche TMDB avec debounce
    const searchMovies = useCallback(async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            console.log('🔍 Recherche TMDB:', query);
            const results = await tmdbService.searchMovie(query);
            console.log('✅ Résultats TMDB:', results.length);
            setSearchResults(results);
            setShowSearchResults(results.length > 0);
        } catch (error) {
            console.error('❌ Erreur recherche TMDB:', error);
            toast({
                title: "Erreur de recherche",
                description: "Impossible de rechercher les films pour le moment",
                variant: "destructive",
            });
        } finally {
            setIsSearching(false);
        }
    }, [toast]);

    // Debounce pour la recherche
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const timer = setTimeout(() => {
            searchMovies(searchQuery);
        }, 500); // 500ms de debounce

        return () => clearTimeout(timer);
    }, [searchQuery, searchMovies]);

    const handleMovieSelect = useCallback((movie: TMDBMovie) => {
        console.log('🎬 Film sélectionné:', movie.title);
        setSelectedMovie(movie);
        setTitle(movie.title);
        setSearchQuery(movie.title);
        setShowSearchResults(false);
        setSelectedIndex(-1);

        // Générer un commentaire automatique avec les infos du film
        const releaseYear = new Date(movie.release_date).getFullYear();
        const autoComment = `${movie.title} (${releaseYear}) - Note: ${movie.vote_average}/10`;
        setComment(autoComment);

        toast({
            title: "Film sélectionné",
            description: `${movie.title} (${releaseYear})`,
        });
    }, [toast]);

    // Gérer l'ouverture du Popover quand on commence à taper
    useEffect(() => {
        if (searchQuery.length >= 2 && searchResults.length > 0) {
            setShowSearchResults(true);
        }
    }, [searchQuery, searchResults]);

    // Gestionnaire d'événements clavier pour la navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!showSearchResults || searchResults.length === 0) return;

        // Debug: décommentez pour voir les codes de touches
        // console.log('Key pressed:', e.key, 'keyCode:', e.keyCode, 'code:', e.code);

        switch (e.key) {
            case 'ArrowDown':
            case 'Down': // Pavé numérique Mac
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
            case 'Up': // Pavé numérique Mac
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : searchResults.length - 1
                );
                break;
            case 'Enter':
            case 'NumpadEnter': // Enter du pavé numérique
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                    handleMovieSelect(searchResults[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowSearchResults(false);
                setSelectedIndex(-1);
                break;
        }

        // Gestion par keyCode pour les pavés numériques Mac
        switch (e.keyCode) {
            case 40: // Flèche bas (keyCode)
            case 98: // Pavé numérique 2 (bas)
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 38: // Flèche haut (keyCode)
            case 104: // Pavé numérique 8 (haut)
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : searchResults.length - 1
                );
                break;
            case 13: // Enter
            case 108: // Pavé numérique Enter
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                    handleMovieSelect(searchResults[selectedIndex]);
                }
                break;
            case 27: // Escape
                e.preventDefault();
                setShowSearchResults(false);
                setSelectedIndex(-1);
                break;
        }
    }, [showSearchResults, searchResults, selectedIndex, handleMovieSelect]);

    // Reset selectedIndex quand les résultats changent
    useEffect(() => {
        setSelectedIndex(-1);
    }, [searchResults]);

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
                            <Popover
                                open={showSearchResults}
                                onOpenChange={(open) => {
                                    setShowSearchResults(open);
                                    if (!open) {
                                        setSelectedIndex(-1);
                                    }
                                }}
                            >
                                <PopoverTrigger asChild>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="movie-search"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setTitle(e.target.value); // Synchroniser avec le titre
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Rechercher un film sur TMDB..."
                                            className="pl-10"
                                            disabled={isSubmitting}
                                        />
                                        {isSearching && (
                                            <div className="absolute right-1 top-3 flex items-center gap-1">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">Recherche...</span>
                                            </div>
                                        )}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-[500px] max-w-[90vw] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Tapez pour rechercher..."
                                            className="sr-only"
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                        />
                                        <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted">
                                            <CommandEmpty>
                                                {isSearching ? (
                                                    <div className="flex items-center justify-center gap-2 py-4">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        <span>Recherche en cours...</span>
                                                    </div>
                                                ) : (
                                                    "Aucun film trouvé pour cette recherche"
                                                )}
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {searchResults.length > 0 && (
                                                    <div className="px-2 py-1 text-xs text-muted-foreground border-b bg-muted/30">
                                                        {searchResults.length} film{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} • ↑↓ (ou pavé num.) • ↵ pour sélectionner
                                                    </div>
                                                )}
                                                {searchResults.map((movie, index) => (
                                                    <CommandItem
                                                        key={movie.id}
                                                        value={movie.title}
                                                        onSelect={() => handleMovieSelect(movie)}
                                                        className={`flex items-center space-x-2 p-2 cursor-pointer group ${index === selectedIndex
                                                            ? 'bg-accent border-l-2 border-primary'
                                                            : 'hover:bg-accent'
                                                            }`}
                                                    >
                                                        <div className="flex-shrink-0 w-10 h-14 bg-muted rounded overflow-hidden">
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
                                                            <div className="font-medium text-sm truncate">{movie.title}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                {new Date(movie.release_date).getFullYear()}
                                                                <Star className="h-2.5 w-2.5" />
                                                                {movie.vote_average.toFixed(1)}
                                                            </div>
                                                            {movie.overview && (
                                                                <div className="text-xs text-muted-foreground mt-1 overflow-hidden" style={{
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 1,
                                                                    WebkitBoxOrient: 'vertical'
                                                                }}>
                                                                    {movie.overview}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {index === selectedIndex ? (
                                                            <Check className="h-4 w-4 text-primary" />
                                                        ) : (
                                                            <Check className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                                {searchResults.length > 6 && (
                                                    <div className="px-2 py-2 text-xs text-muted-foreground border-t text-center bg-gradient-to-t from-background to-transparent">
                                                        📜 Défiler pour voir tous les films • 🖱️ ou ↑↓
                                                    </div>
                                                )}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Affichage du film sélectionné */}
                            {selectedMovie && (
                                <div className="mt-3 p-2 bg-accent rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden">
                                            {selectedMovie.poster_path ? (
                                                <img
                                                    src={tmdbService.getImageUrl(selectedMovie.poster_path, 'w200')}
                                                    alt={selectedMovie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <Film className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{selectedMovie.title}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {new Date(selectedMovie.release_date).getFullYear()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-2.5 w-2.5" />
                                                    {selectedMovie.vote_average.toFixed(1)}/10
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            Sélectionné
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comment">Commentaire (optionnel)</Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Précisez l'année, la version, ou toute autre information utile..."
                                rows={3}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                Vous pouvez préciser l'année, la version, ou toute autre information qui nous aidera à trouver le bon film.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isSubmitting}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
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
