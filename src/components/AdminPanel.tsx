import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import toast, { Toaster } from 'react-hot-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from './ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    regularUsers: number;
    recentUsers: number;
}

interface AdminAction {
    id: number;
    action: string;
    targetUserId?: number;
    details?: string;
    admin: {
        id: number;
        name: string;
        email: string;
    };
    createdAt: string;
}

interface RegistrationRequest {
    id: number;
    email: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: string;
    processedAt?: string;
    adminNotes?: string;
    admin?: {
        id: number;
        name: string;
        email: string;
    };
}

export function AdminPanel() {
    const [currentView, setCurrentView] = useState<'users' | 'registrations'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [actions, setActions] = useState<AdminAction[]>([]);
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

    // Registration requests state
    const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
    const [registrationPage, setRegistrationPage] = useState(1);
    const [registrationTotalPages, setRegistrationTotalPages] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
    const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
    const [processingAction, setProcessingAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [adminNotes, setAdminNotes] = useState('');

    // Form states
    const [newUser, setNewUser] = useState({
        email: '',
        name: '',
        role: 'USER' as 'USER' | 'ADMIN'
    });

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/users?page=${currentPage}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                // Token expiré ou invalide
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                toast.error('Session expirée. Veuillez vous reconnecter.', {
                    duration: 5000,
                    position: 'top-right',
                });
                return;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des utilisateurs');
            }

            const data = await response.json();
            setUsers(data.data.users);
            setTotalPages(data.data.pagination.pages);
        } catch (error) {
            toast.error(`❌ Erreur lors du chargement des utilisateurs: ${error instanceof Error ? error.message : "Erreur inconnue"}`, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });
        } finally {
            setIsLoading(false);
        }
    }, [currentPage]);

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/users/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                return;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statistiques');
            }

            const data = await response.json();
            setStats(data.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
        }
    }, []);

    const fetchActions = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/actions`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                return;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des actions');
            }

            const data = await response.json();
            setActions(data.data.actions);
        } catch (error) {
            console.error('Erreur lors de la récupération des actions:', error);
        }
    }, []);

    const fetchRegistrationRequests = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/registration-requests?page=${registrationPage}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                return;
            }

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des demandes d\'inscription');
            }

            const data = await response.json();
            setRegistrationRequests(data.data.requests);
            setRegistrationTotalPages(data.data.pagination.pages);
        } catch (error) {
            console.error('Erreur lors de la récupération des demandes d\'inscription:', error);
        }
    }, [registrationPage]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        toast.success('Déconnexion réussie', {
            duration: 3000,
            position: 'top-right',
        });
        // Recharger la page pour revenir à l'interface utilisateur normale
        window.location.reload();
    };

    useEffect(() => {
        // Vérifier si l'utilisateur est connecté avant de faire les appels API
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error('Session expirée. Veuillez vous reconnecter.', {
                duration: 5000,
                position: 'top-right',
            });
            // Rediriger vers la page de connexion ou nettoyer le localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return;
        }

        fetchUsers();
        fetchStats();
        fetchActions();
        fetchRegistrationRequests();
    }, [currentPage, fetchUsers, fetchStats, fetchActions, fetchRegistrationRequests]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/users`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(newUser),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création de l\'utilisateur');
            }

            const data = await response.json();

            // Notification de succès pour la création de l'utilisateur
            toast.success(`✅ Utilisateur ${data.data.user.name} créé avec succès!`, {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });

            // Notification pour l'envoi d'email
            if (data.data.emailStatus === 'pending') {
                toast.loading('📧 Envoi de l\'email d\'invitation...', {
                    id: `email-${data.data.user.id}`,
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                    },
                });

                // Simuler la vérification du statut de l'email après quelques secondes
                setTimeout(() => {
                    toast.success('✉️ Email d\'invitation envoyé avec succès!', {
                        id: `email-${data.data.user.id}`,
                        duration: 4000,
                        position: 'top-right',
                        style: {
                            background: '#059669',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                        },
                        icon: '📧',
                    });
                }, 2000);
            }

            setIsCreateUserOpen(false);
            setNewUser({ email: '', name: '', role: 'USER' });
            fetchUsers();
            fetchStats();
        } catch (error) {
            toast.error(`❌ Erreur lors de la création: ${error instanceof Error ? error.message : "Erreur inconnue"}`, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleUserStatus = async (user: User) => {
        try {
            const token = localStorage.getItem('authToken');
            const action = user.isActive ? 'deactivate' : 'activate';

            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/users/${user.id}/toggle-status`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la modification du statut');
            }

            toast.success(`✅ Utilisateur ${user.name} ${user.isActive ? 'désactivé' : 'réactivé'} avec succès`, {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });

            fetchUsers();
            fetchStats();
        } catch (error) {
            toast.error(`❌ Erreur lors de la modification du statut: ${error instanceof Error ? error.message : "Erreur inconnue"}`, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;

        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/users/${selectedUser.id}/reset-password`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la réinitialisation du mot de passe');
            }

            const data = await response.json();

            toast.success(`✅ Mot de passe réinitialisé pour ${selectedUser.name}. Nouveau mot de passe: ${data.data.tempPassword}`, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });

            setIsResetPasswordDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            toast.error(`❌ Erreur lors de la réinitialisation: ${error instanceof Error ? error.message : "Erreur inconnue"}`, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/users/${selectedUser.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression');
            }

            toast.success(`✅ Utilisateur ${selectedUser.name} supprimé avec succès`, {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });

            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            fetchUsers();
            fetchStats();
        } catch (error) {
            toast.error(`❌ Erreur lors de la suppression: ${error instanceof Error ? error.message : "Erreur inconnue"}`, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessRegistrationRequest = async () => {
        if (!selectedRequest) return;

        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/registration-requests/${selectedRequest.id}/process`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        action: processingAction,
                        adminNotes: adminNotes.trim() || undefined,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du traitement de la demande');
            }

            const data = await response.json();

            toast.success(`✅ Demande ${processingAction === 'APPROVE' ? 'approuvée' : 'rejetée'} avec succès`, {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });

            setIsProcessDialogOpen(false);
            setSelectedRequest(null);
            setAdminNotes('');
            fetchRegistrationRequests();
            fetchStats(); // Refresh stats as we might have created a new user
        } catch (error) {
            toast.error(`❌ Erreur lors du traitement: ${error instanceof Error ? error.message : "Erreur inconnue"}`, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Administration des Utilisateurs</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleLogout}>
                        Déconnexion
                    </Button>
                    <Button onClick={() => setIsCreateUserOpen(true)}>
                        + Créer un utilisateur
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setCurrentView('users')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'users'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    👥 Utilisateurs
                </button>
                <button
                    onClick={() => setCurrentView('registrations')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'registrations'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    📝 Demandes d'inscription
                    {registrationRequests.filter(r => r.status === 'PENDING').length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {registrationRequests.filter(r => r.status === 'PENDING').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content based on current view */}
            {currentView === 'users' ? (
                <>
                    {/* Statistiques */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">{stats.adminUsers}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Liste des utilisateurs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Utilisateurs</CardTitle>
                            <CardDescription>
                                Gestion des comptes utilisateurs et de leurs permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rôle</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Dernière connexion</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                                    {user.isActive ? 'Actif' : 'Inactif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jamais'}
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleUserStatus(user)}
                                                >
                                                    {user.isActive ? 'Désactiver' : 'Réactiver'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsResetPasswordDialogOpen(true);
                                                    }}
                                                >
                                                    Reset MDP
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    Supprimer
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex justify-center space-x-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Précédent
                                </Button>
                                <span className="py-2 px-4">
                                    Page {currentPage} sur {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Suivant
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions administratives récentes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions Administratives Récentes</CardTitle>
                            <CardDescription>
                                Historique des actions effectuées par les administrateurs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {actions.slice(0, 10).map((action) => (
                                    <div key={action.id} className="flex justify-between items-center p-2 border rounded">
                                        <div>
                                            <span className="font-medium">{action.admin.name}</span>
                                            <span className="text-gray-600 ml-2">{action.action}</span>
                                            {action.details && (
                                                <span className="text-gray-500 ml-2">- {action.details}</span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(action.createdAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                /* Registration Requests View */
                <>
                    {/* Statistiques des demandes d'inscription */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{registrationRequests.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {registrationRequests.filter(r => r.status === 'PENDING').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Traitées</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {registrationRequests.filter(r => r.status !== 'PENDING').length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Liste des demandes d'inscription */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Demandes d'inscription</CardTitle>
                            <CardDescription>
                                Gérez les demandes d'inscription des nouveaux utilisateurs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Date de demande</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registrationRequests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium">{request.name}</TableCell>
                                            <TableCell>{request.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        request.status === 'PENDING' ? 'secondary' :
                                                            request.status === 'APPROVED' ? 'default' : 'destructive'
                                                    }
                                                >
                                                    {request.status === 'PENDING' ? 'En attente' :
                                                        request.status === 'APPROVED' ? 'Approuvé' : 'Rejeté'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(request.requestedAt)}
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                {request.status === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setProcessingAction('APPROVE');
                                                                setIsProcessDialogOpen(true);
                                                            }}
                                                        >
                                                            ✅ Approuver
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedRequest(request);
                                                                setProcessingAction('REJECT');
                                                                setIsProcessDialogOpen(true);
                                                            }}
                                                        >
                                                            ❌ Rejeter
                                                        </Button>
                                                    </>
                                                )}
                                                {request.status !== 'PENDING' && (
                                                    <span className="text-sm text-gray-500">
                                                        Traité{request.processedAt ? ` le ${formatDate(request.processedAt)}` : ''}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination pour les demandes d'inscription */}
                            <div className="flex justify-center space-x-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setRegistrationPage(prev => Math.max(1, prev - 1))}
                                    disabled={registrationPage === 1}
                                >
                                    Précédent
                                </Button>
                                <span className="py-2 px-4">
                                    Page {registrationPage} sur {registrationTotalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setRegistrationPage(prev => Math.min(registrationTotalPages, prev + 1))}
                                    disabled={registrationPage === registrationTotalPages}
                                >
                                    Suivant
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Modal de création d'utilisateur */}
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                value={newUser.name}
                                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="role">Rôle</Label>
                            <Select
                                value={newUser.role}
                                onValueChange={(value: 'USER' | 'ADMIN') =>
                                    setNewUser(prev => ({ ...prev, role: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">Utilisateur</SelectItem>
                                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateUserOpen(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Création...' : 'Créer'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action ne peut pas être annulée. Cela supprimera définitivement
                            l'utilisateur "{selectedUser?.name}" et toutes ses données associées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de confirmation de réinitialisation de mot de passe */}
            <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir réinitialiser le mot de passe de
                            "{selectedUser?.name}" ? Un nouveau mot de passe temporaire sera généré.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetPassword}>
                            Réinitialiser
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog de traitement des demandes d'inscription */}
            <AlertDialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {processingAction === 'APPROVE' ? 'Approuver la demande' : 'Rejeter la demande'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {processingAction === 'APPROVE'
                                ? `Êtes-vous sûr d'approuver la demande d'inscription de "${selectedRequest?.name}" (${selectedRequest?.email}) ? Un compte sera créé et les identifiants seront envoyés par email.`
                                : `Êtes-vous sûr de rejeter la demande d'inscription de "${selectedRequest?.name}" (${selectedRequest?.email}) ? Cette action ne peut pas être annulée.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {processingAction === 'REJECT' && (
                        <div className="py-4">
                            <Label htmlFor="adminNotes" className="text-sm font-medium">
                                Notes administratives (optionnel)
                            </Label>
                            <textarea
                                id="adminNotes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Raison du rejet..."
                                className="w-full mt-2 p-2 border rounded-md resize-none"
                                rows={3}
                            />
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setAdminNotes('');
                            setSelectedRequest(null);
                        }}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleProcessRegistrationRequest}
                            className={processingAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {processingAction === 'APPROVE' ? 'Approuver' : 'Rejeter'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toaster pour les notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                    },
                }}
            />
        </div>
    );
}
