import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { UserPlus } from 'lucide-react';

interface SignUpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !name) {
            toast({
                title: "Champs requis",
                description: "Veuillez remplir tous les champs",
                variant: "destructive",
            });
            return;
        }

        // Validation basique de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast({
                title: "Email invalide",
                description: "Veuillez saisir une adresse email valide",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/register-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, name }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la demande d\'inscription');
            }

            const data = await response.json();

            toast({
                title: "Demande d'inscription envoyée !",
                description: "Votre demande a été soumise. Un administrateur vous contactera bientôt.",
                variant: "default",
            });

            // Fermer le modal et réinitialiser le formulaire
            onClose();
            setEmail('');
            setName('');

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la demande d\'inscription';
            toast({
                title: "Erreur",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Demande d'inscription
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Votre nom complet"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Adresse email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Envoi en cours...
                            </>
                        ) : (
                            'Envoyer la demande'
                        )}
                    </Button>
                </form>

                <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                    <p>ℹ️ Votre demande sera examinée par un administrateur.</p>
                    <p>Vous recevrez vos identifiants de connexion par email.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
