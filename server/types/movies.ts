// ========================================================================
// TYPES POUR LES FILMS
//
// Ce fichier contient tous les types spécifiques aux films,
// demandes de films et opérations liées.
// ========================================================================

// ========================================================================
// TYPES TMDB (The Movie Database)
// ========================================================================

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  runtime: number;
  genre_ids: number[];
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
    }>;
  };
  credits?: {
    cast: Array<{
      name: string;
      character: string;
    }>;
  };
}

export interface TMDBGenre {
  id: number;
  name: string;
}

import { Request } from "express";
import type { User, Movie, Genre, Actor } from "@prisma/client";

// Types pour les requêtes de films
export interface MovieRequest extends Request {
  user?: User;
}

// Type helper pour les propriétés utilisateur dans les routes de films
export type MovieUser = NonNullable<MovieRequest["user"]>;

// Helper type pour les handlers de films
export type MovieHandler = (
  req: MovieRequest,
  res: Response
) => Promise<void> | void;

// Types pour les données de films
export interface MovieData {
  tmdbId?: number;
  title: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: Date;
  duration: number;
  rating?: number;
  isWeeklySuggestion?: boolean;
  localPath?: string;
  filename?: string;
  fileSize?: bigint;
  resolution?: string;
  codec?: string;
  container?: string;
  lastScanned?: Date;
}

// Types pour les genres de films
export interface MovieGenreData {
  genreId: number;
  genre: {
    id: number;
    name: string;
  };
}

// Types pour les acteurs de films
export interface MovieActorData {
  actorId: number;
  character?: string;
  actor: {
    id: number;
    name: string;
    profileUrl?: string;
  };
}

// Types pour les réponses de films
export interface MovieResponse {
  id: number;
  tmdbId?: number;
  title: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: Date;
  duration: number;
  rating?: number;
  isWeeklySuggestion: boolean;
  localPath?: string;
  filename?: string;
  fileSize?: bigint;
  resolution?: string;
  codec?: string;
  container?: string;
  lastScanned?: Date;
  genres: MovieGenreData[];
  actors: MovieActorData[];
  // Note: Les critiques sont maintenant gérées dans reviews.ts
  createdAt: Date;
  updatedAt: Date;
}

// Note: Les types de critiques ont été déplacés vers reviews.ts
// pour une meilleure séparation des responsabilités.

// Types pour les filtres de films
export interface MovieFilters {
  genre?: string;
  actor?: string;
  year?: number;
  rating?: number;
  search?: string;
  isWeeklySuggestion?: boolean;
  sortBy?: "title" | "releaseDate" | "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Note: Les types de demandes de films ont été déplacés vers movieRequests.ts
// pour une meilleure séparation des responsabilités.

// Types pour les statistiques de films
export interface MovieStats {
  totalMovies: number;
  totalGenres: number;
  totalActors: number;
  totalReviews: number;
  averageRating: number;
  recentMovies: number;
  weeklySuggestions: number;
}

// Types pour les sous-titres
export interface SubtitleData {
  path: string;
  filename: string;
  language: string;
  size: number;
  format: string;
}

export interface SubtitleScanResult {
  movieId: number;
  subtitles: SubtitleData[];
  scanDate: Date;
}
