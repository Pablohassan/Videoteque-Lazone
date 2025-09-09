// ========================================================================
// TYPES COMMUNS ET GÉNÉRIQUES
//
// Ce fichier contient les types partagés utilisés dans toute l'application.
// ========================================================================

// Types génériques pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Types pour les erreurs
export interface ErrorDetails {
  field?: string;
  code?: string;
  message?: string;
}

// Types pour les opérations CRUD génériques
export interface CreateOperation<T> {
  data: T;
}

export interface UpdateOperation<T> {
  id: number | string;
  data: Partial<T>;
}

export interface DeleteOperation {
  id: number | string;
}

// Types pour les filtres et tris génériques
export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Types pour les métadonnées
export interface Metadata {
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

// Types pour les fichiers
export interface FileData {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
}

// Types pour les statistiques génériques
export interface StatsData {
  total: number;
  active: number;
  inactive: number;
  recent: number;
}

// Types pour les actions administratives génériques
export interface AdminActionData {
  action: string;
  targetId?: number | string;
  details?: string;
  adminId: number;
}

// ========================================================================
// TYPES TMDB (The Movie Database)
// ========================================================================
// Note: Ces types sont maintenant définis dans movies.ts pour une meilleure séparation des concerns

// ========================================================================
// TYPES POUR LE SCANNER DE FILMS
// ========================================================================

export interface MovieScanResult {
  filename: string;
  title: string;
  year?: number;
  success: boolean;
  error?: string;
}

// ========================================================================
// TYPES POUR LES UTILITAIRES
// ========================================================================

// Types spécifiques aux utilisateurs (pour compatibilité avec l'existant)
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

// Type helper pour les IDs
export type ID = number | string;

// Type helper pour les timestamps
export type Timestamp = Date | string;

// Type helper pour les états booléens avec métadonnées
export interface StatusWithMetadata<T = unknown> {
  status: boolean;
  data?: T;
  message?: string;
  timestamp: Date;
}

// ========================================================================
// TYPES GÉNÉRIQUES DE RÉPONSE
// ========================================================================

// Type générique pour les réponses avec message
export interface MessageResponse {
  message: string;
}

// Type générique pour les réponses de succès avec données
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

// Type générique pour les réponses d'erreur
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
