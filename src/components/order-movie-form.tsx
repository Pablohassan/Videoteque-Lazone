import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Film, Plus, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { apiService } from '../services/apiService';

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
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({
                title: "Erreur",
                description: "Le titre du film est requis",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await apiService.createMovieRequest({
                title: title.trim(),
                comment: comment.trim() || undefined,
            });

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
            console.error('Erreur lors de la commande:', error);
            toast({
                title: "Erreur",
                description: error instanceof Error ? error.message : "Erreur lors de la création de la demande",
                variant: "destructive",
            });
        } finally {
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

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Commander un film
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Film className="h-5 w-5" />
                        Commander un film
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre du film *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Inception, Le Seigneur des Anneaux..."
                            disabled={isSubmitting}
                            required
                        />
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
    );
}

export default OrderMovieForm;
