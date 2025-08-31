// ========================================================================
// TYPES SPÉCIFIQUES AUX DEMANDES DE FILMS
//
// Ce fichier contient tous les types spécifiques aux fonctionnalités
// de demandes de films pour éviter les répétitions et centraliser la logique.
// ========================================================================

import { Request } from "express";
import type { User } from "@prisma/client";

// Types pour les requêtes de movieRequests - étendent les types Express avec le bon User
export interface MovieRequestRequest extends Request {
  user?: User;
}

export interface MovieRequestPassportRequest extends Request {
  user?: User;
}

// Type helper pour les propriétés utilisateur dans les routes de movieRequests
export type MovieRequestUser = NonNullable<MovieRequestRequest["user"]>;

// Helper type pour les handlers de movieRequests
export type MovieRequestHandler = (
  req: MovieRequestRequest,
  res: Response
) => Promise<void> | void;

// Types pour les données de movieRequests
export interface MovieRequestData {
  title: string;
  comment?: string;
  userId: number;
}

export interface MovieRequestUpdateData {
  title?: string;
  comment?: string;
  status?: "pending" | "processing" | "available";
}

// Types pour les réponses de movieRequests
export interface MovieRequestResponse {
  id: number;
  title: string;
  comment?: string;
  status: string;
  requestedAt: Date;
  updatedAt: Date;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}
