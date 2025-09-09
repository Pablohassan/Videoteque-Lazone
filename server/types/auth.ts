// ========================================================================
// TYPES D'AUTHENTIFICATION
//
// Ce fichier contient tous les types liés à l'authentification,
// l'autorisation et les sessions utilisateur.
// ========================================================================

import { Request } from "express";
import type { User } from "@prisma/client";

// Types pour les requêtes authentifiées - étendent les types Express avec le bon User
export interface AuthRequest extends Request {
  user?: User;
}

// Type pour les routes Passport.js
export interface PassportRequest extends Request {
  user?: User;
}

// Type helper pour les propriétés utilisateur dans les routes authentifiées
export type AuthUser = NonNullable<AuthRequest["user"]>;

// Types pour les données d'authentification
export interface AuthUserData {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

// Helper type pour les handlers authentifiés
export type AuthHandler = (
  req: AuthRequest,
  res: Response
) => Promise<void> | void;

// Types pour les sessions
export interface SessionData {
  userId: number;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

// Types pour les tokens JWT
export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Types pour les réponses d'authentification
export interface AuthResponse {
  user: AuthUserData;
  token: string;
  refreshToken?: string;
}

// Types pour les erreurs d'authentification
export interface AuthError {
  code:
    | "INVALID_CREDENTIALS"
    | "USER_NOT_FOUND"
    | "USER_INACTIVE"
    | "TOKEN_EXPIRED"
    | "INVALID_TOKEN";
  message: string;
}

// ========================================================================
// TYPES DE RÉPONSES SPÉCIFIQUES
// ========================================================================

// Type spécifique pour la réponse d'inscription (avec champs de création)
export interface RegisterResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
  };
  token: string;
}

// Type spécifique pour la réponse de connexion (avec champs de session)
export interface LoginResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

// Type pour la réponse de demande de réinitialisation de mot de passe
export interface PasswordResetResponse {
  message: string;
}

// Type pour la réponse de vérification de token
export interface TokenVerificationResponse {
  valid: boolean;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}
