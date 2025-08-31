import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui/use-toast';
import { adminApi } from '../services/adminApi';

// Types pour les données
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

export interface AdminAction {
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

export interface CreateUserData {
  email: string;
  name: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserData {
  name?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}

export interface UserFilters {
  page: number;
  limit: number;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
  search?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

// Clés de requête
export const adminQueryKeys = {
  all: ['admin'] as const,
  users: (filters: UserFilters) => [...adminQueryKeys.all, 'users', filters] as const,
  user: (id: number) => [...adminQueryKeys.all, 'users', id] as const,
  stats: () => [...adminQueryKeys.all, 'stats'] as const,
  actions: (page: number, limit: number) => [...adminQueryKeys.all, 'actions', page, limit] as const,
};

// Hook pour récupérer la liste des utilisateurs
export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: adminQueryKeys.users(filters),
    queryFn: () => adminApi.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Ne pas réessayer en cas d'erreur 4xx
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 3;
    },
  });
}

// Hook pour récupérer les statistiques
export function useUserStats() {
  return useQuery({
    queryKey: adminQueryKeys.stats(),
    queryFn: () => adminApi.getUserStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer les actions administratives
export function useAdminActions(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: adminQueryKeys.actions(page, limit),
    queryFn: () => adminApi.getAdminActions(page, limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour créer un utilisateur
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateUserData) => adminApi.createUser(data),
    onSuccess: (data) => {
      // Invalider et refetch la liste des utilisateurs
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
      
      toast({
        title: "Succès",
        description: `Utilisateur créé avec succès. Mot de passe temporaire: ${data.tempPassword}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'utilisateur",
        variant: "destructive",
      });
    },
  });
}

// Hook pour mettre à jour un utilisateur
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) => 
      adminApi.updateUser(id, data),
    onSuccess: (user) => {
      // Mettre à jour le cache
      queryClient.setQueryData(adminQueryKeys.user(user.id), user);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
      
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });
}

// Hook pour réinitialiser le mot de passe
export function useResetPassword() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: number) => adminApi.resetPassword(userId),
    onSuccess: (data) => {
      toast({
        title: "Succès",
        description: `Mot de passe réinitialisé. Nouveau mot de passe: ${data.tempPassword}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la réinitialisation",
        variant: "destructive",
      });
    },
  });
}

// Hook pour changer le statut d'un utilisateur
export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      adminApi.toggleUserStatus(id, isActive),
    onSuccess: (user) => {
      // Mettre à jour le cache
      queryClient.setQueryData(adminQueryKeys.user(user.id), user);
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
      
      const action = user.isActive ? 'réactivé' : 'désactivé';
      toast({
        title: "Succès",
        description: `Utilisateur ${action} avec succès`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modification du statut",
        variant: "destructive",
      });
    },
  });
}

// Hook pour supprimer un utilisateur
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: number) => adminApi.deleteUser(userId),
    onSuccess: (user) => {
      // Invalider et refetch toutes les données admin
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
      
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
  });
}

// Hook pour optimiser les requêtes multiples
export function useAdminData(filters: UserFilters) {
  const usersQuery = useUsers(filters);
  const statsQuery = useUserStats();
  const actionsQuery = useAdminActions(1, 10); // 10 actions récentes

  return {
    users: usersQuery.data?.users || [],
    stats: statsQuery.data,
    actions: actionsQuery.data?.actions || [],
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading || statsQuery.isLoading || actionsQuery.isLoading,
    isError: usersQuery.isError || statsQuery.isError || actionsQuery.isError,
    error: usersQuery.error || statsQuery.error || actionsQuery.error,
    refetch: () => {
      usersQuery.refetch();
      statsQuery.refetch();
      actionsQuery.refetch();
    },
  };
}
