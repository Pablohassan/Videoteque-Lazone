import React from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Users, Settings, BarChart3 } from 'lucide-react';

interface AdminNavigationProps {
    onBackToUserInterface: () => void;
    currentView: 'dashboard' | 'users' | 'stats' | 'actions';
    onViewChange: (view: 'dashboard' | 'users' | 'stats' | 'actions') => void;
}

export function AdminNavigation({
    onBackToUserInterface,
    currentView,
    onViewChange
}: AdminNavigationProps) {
    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Bouton retour */}
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            onClick={onBackToUserInterface}
                            className="mr-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour à l'interface utilisateur
                        </Button>
                    </div>

                    {/* Navigation admin */}
                    <nav className="flex space-x-4">
                        <Button
                            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                            onClick={() => onViewChange('dashboard')}
                            className="flex items-center"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Tableau de bord
                        </Button>
                        <Button
                            variant={currentView === 'users' ? 'default' : 'ghost'}
                            onClick={() => onViewChange('users')}
                            className="flex items-center"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Gestion des utilisateurs
                        </Button>
                        <Button
                            variant={currentView === 'stats' ? 'default' : 'ghost'}
                            onClick={() => onViewChange('stats')}
                            className="flex items-center"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Statistiques
                        </Button>
                    </nav>

                    {/* Titre de la section */}
                    <div className="text-lg font-semibold text-gray-900">
                        {currentView === 'dashboard' && 'Tableau de bord'}
                        {currentView === 'users' && 'Gestion des utilisateurs'}
                        {currentView === 'stats' && 'Statistiques'}
                        {currentView === 'actions' && 'Actions administratives'}
                    </div>
                </div>
            </div>
        </div>
    );
}
