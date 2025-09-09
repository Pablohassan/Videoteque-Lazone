// ========================================================================
// TYPES SPÉCIFIQUES AUX REVIEWS
//
// Ce fichier contient tous les types spécifiques aux fonctionnalités
// de critiques pour éviter les répétitions et centraliser la logique.
// ========================================================================

import { Request } from "express";
import type { User } from "@prisma/client";

// Types pour les requêtes de reviews - étendent les types Express avec le bon User
export interface ReviewRequest extends Request {
  user?: User;
}

export interface ReviewPassportRequest extends Request {
  user?: User;
}

// Type helper pour les propriétés utilisateur dans les routes de reviews
export type ReviewUser = NonNullable<ReviewRequest["user"]>;

// Helper type pour les handlers de reviews
export type ReviewHandler = (
  req: ReviewRequest,
  res: Response
) => Promise<void> | void;

// Types pour les données de reviews
export interface ReviewData {
  movieId: number;
  authorId: number;
  rating: number;
  comment: string;
}

export interface ReviewUpdateData {
  rating?: number;
  comment?: string;
}

// Types pour les critiques de films (anciennement dans movies.ts)
export interface MovieReviewData {
  id: number;
  rating: number;
  comment: string;
  createdAt: Date;
  authorId: number;
  author: {
    id: number;
    name: string;
    email: string;
  };
}

// Note: Les types de critiques de films ont été ajoutés depuis movies.ts
// pour consolider toutes les responsabilités liées aux critiques.

export interface ReviewFilters {
  movieId?: number;
  authorId?: number;
  rating?: number;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Types pour les réponses de reviews
export interface ReviewResponse {
  id: number;
  rating: number;
  comment: string;
  createdAt: Date;
  movieId: number;
  authorId: number;
  movie: {
    id: number;
    title: string;
    posterUrl: string;
  };
  author: {
    id: number;
    name: string;
    email: string;
  };
}
