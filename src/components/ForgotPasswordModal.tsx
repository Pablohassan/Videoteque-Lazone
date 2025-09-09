import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Email requis",
                description: "Veuillez saisir votre adresse email",
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

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la demande de réinitialisation');
            }

            setIsSuccess(true);
            toast({
                title: "Demande envoyée !",
                description: "Si cet email existe, un lien de réinitialisation vous a été envoyé.",
                variant: "default",
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la demande de réinitialisation';
            toast({
                title: "Erreur",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setIsSuccess(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {isSuccess ? 'Email envoyé !' : 'Mot de passe oublié'}
                    </DialogTitle>
                </DialogHeader>

                {!isSuccess ? (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                    'Envoyer le lien de réinitialisation'
                                )}
                            </Button>
                        </form>

                        <div className="text-center text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                            <p>🔐 Un lien de réinitialisation sécurisé sera envoyé à votre adresse email.</p>
                            <p>Le lien sera valide pendant 1 heure.</p>
                        </div>
                    </>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="text-green-600">
                            <Mail className="h-12 w-12 mx-auto mb-2" />
                            <h3 className="font-medium">Vérifiez votre boîte mail</h3>
                        </div>

                        <p className="text-sm text-gray-600">
                            Si l'adresse <strong>{email}</strong> est associée à un compte,
                            vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
                        </p>

                        <Button onClick={handleClose} className="w-full">
                            Fermer
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
