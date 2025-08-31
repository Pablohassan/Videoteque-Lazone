import React, { useState } from 'react';
import { AdminNavigation } from './AdminNavigation';
import { AdminPanel } from './AdminPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Film, Star, Clock, TrendingUp } from 'lucide-react';

interface AdminInterfaceProps {
    onBackToUserInterface: () => void;
}

export function AdminInterface({ onBackToUserInterface }: AdminInterfaceProps) {
    const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'stats' | 'actions'>('dashboard');

    const renderDashboard = () => (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>

            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            +20% par rapport au mois dernier
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Films en base</CardTitle>
                        <Film className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            +12% par rapport au mois dernier
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avis utilisateurs</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            +8% par rapport au mois dernier
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Demandes en attente</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            -5% par rapport au mois dernier
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activité récente */}
            <Card>
                <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                    <CardDescription>
                        Dernières actions effectuées sur la plateforme
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Nouvel utilisateur inscrit</p>
                                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                            </div>
                            <Badge variant="secondary">Inscription</Badge>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Nouveau film ajouté</p>
                                <p className="text-xs text-muted-foreground">Il y a 4 heures</p>
                            </div>
                            <Badge variant="secondary">Ajout film</Badge>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Demande de film traitée</p>
                                <p className="text-xs text-muted-foreground">Il y a 6 heures</p>
                            </div>
                            <Badge variant="secondary">Demande</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
                <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                    <CardDescription>
                        Accès rapide aux fonctionnalités d'administration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => setCurrentView('users')}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                            <Users className="h-8 w-8 text-blue-600 mb-2" />
                            <h3 className="font-medium">Gérer les utilisateurs</h3>
                            <p className="text-sm text-muted-foreground">
                                Créer, modifier et supprimer des comptes
                            </p>
                        </button>

                        <button
                            onClick={() => setCurrentView('stats')}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                            <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                            <h3 className="font-medium">Voir les statistiques</h3>
                            <p className="text-sm text-muted-foreground">
                                Analyser l'utilisation de la plateforme
                            </p>
                        </button>

                        <button
                            onClick={() => setCurrentView('actions')}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                        >
                            <Clock className="h-8 w-8 text-purple-600 mb-2" />
                            <h3 className="font-medium">Historique des actions</h3>
                            <p className="text-sm text-muted-foreground">
                                Consulter l'historique administratif
                            </p>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderStats = () => (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Statistiques détaillées</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Évolution des utilisateurs</CardTitle>
                    <CardDescription>
                        Croissance du nombre d'utilisateurs au fil du temps
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Graphique des statistiques à implémenter
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Répartition des rôles</CardTitle>
                    <CardDescription>
                        Distribution des utilisateurs par rôle
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Graphique circulaire à implémenter
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderActions = () => (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Historique des actions administratives</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Actions récentes</CardTitle>
                    <CardDescription>
                        Dernières actions effectuées par les administrateurs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center py-8 text-muted-foreground">
                            Aucune action administrative enregistrée pour le moment
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return renderDashboard();
            case 'users':
                return <AdminPanel />;
            case 'stats':
                return renderStats();
            case 'actions':
                return renderActions();
            default:
                return renderDashboard();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavigation
                onBackToUserInterface={onBackToUserInterface}
                currentView={currentView}
                onViewChange={setCurrentView}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent()}
            </main>
        </div>
    );
}
