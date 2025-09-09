// ========================================================================
// TYPES SPÉCIFIQUES À L'ADMINISTRATION
//
// Ce fichier contient tous les types spécifiques aux fonctionnalités
// d'administration pour éviter les répétitions et centraliser la logique.
// ========================================================================

import { Request } from "express";
import type { User } from "@prisma/client";

// Types pour les requêtes admin - étendent les types Express avec le bon User
export interface AdminRequest extends Request {
  user?: User;
}

export interface AdminPassportRequest extends Request {
  user?: User;
}

// Type helper pour les propriétés utilisateur dans les routes admin
export type AdminUser = NonNullable<AdminRequest["user"]>;

// Helper type pour les handlers admin
export type AdminHandler = (
  req: AdminRequest,
  res: Response
) => Promise<void> | void;

// Types pour les données admin
export interface AdminCreateUserRequest {
  email: string;
  name: string;
  role?: "USER" | "ADMIN";
}

export interface AdminUpdateUserRequest {
  name?: string;
  role?: "USER" | "ADMIN";
  isActive?: boolean;
}

// Types pour les réponses admin
export interface AdminUserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface AdminStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

export interface AdminActionResponse {
  id: number;
  action: string;
  targetUserId?: number;
  details?: string;
  adminId: number;
  createdAt: Date;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

// Types pour les opérations admin
export interface AdminUserUpdateData {
  name?: string;
  role?: "USER" | "ADMIN";
  isActive?: boolean;
}

export interface AdminUserCreateData {
  email: string;
  name: string;
  role?: "USER" | "ADMIN";
}

// Types pour les filtres et pagination admin
export interface AdminUserFilters {
  role?: "USER" | "ADMIN";
  isActive?: boolean;
  search?: string;
  sortBy?: "name" | "email" | "createdAt" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Types pour les logs d'action admin
export interface AdminLogEntry {
  id: number;
  action: string;
  targetUserId?: number;
  details?: string;
  adminId: number;
  createdAt: Date;
  admin: {
    name: string;
    email: string;
  };
  targetUser?: {
    name: string;
    email: string;
  };
}

// ========================================================================
// TYPES DE RÉPONSES ADMIN SPÉCIFIQUES
// ========================================================================

// Type pour la réponse de création d'utilisateur admin
export interface CreateUserResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  };
  message: string;
}

// Type pour la réponse de mise à jour d'utilisateur admin
export interface UpdateUserResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    updatedAt: Date;
  };
  message: string;
}

// Type pour la réponse de suppression d'utilisateur
export interface DeleteUserResponse {
  message: string;
  deletedUserId: number;
}

// Type pour les filtres de demandes d'inscription
export interface RegistrationFilters {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  email?: string;
  page?: number;
  limit?: number;
}

// Type pour la réponse de demandes d'inscription
export interface RegistrationRequestsResponse {
  requests: Array<{
    id: number;
    email: string;
    name: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    adminNotes?: string;
    processedBy?: {
      id: number;
      name: string;
    };
    createdAt: Date;
    processedAt?: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
