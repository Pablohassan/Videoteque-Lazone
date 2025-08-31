import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

export interface MovieRequestPayload {
  title: string;
  description?: string;
}

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

export interface MovieScanResult {
  filename: string;
  title: string;
  year?: number;
  success: boolean;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
