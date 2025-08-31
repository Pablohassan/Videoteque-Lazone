// Index des schémas - Point d'entrée centralisé pour tous les schémas Zod

// Schémas d'administration
export {
  registerSchema as adminRegisterSchema,
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  paginationSchema,
  resetPasswordSchema,
  deleteUserSchema,
} from "./admin.js";

// Schémas d'authentification
export {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  verifyTokenSchema,
} from "./auth.js";

// Schémas de films
export {
  movieIdSchema,
  moviesQuerySchema,
  movieRequestSchema,
} from "./movies.js";

// Schémas de critiques
export {
  createReviewSchema,
  updateReviewSchema,
  reviewsQuerySchema,
  reviewIdSchema,
  movieIdSchema as reviewMovieIdSchema,
  createReviewWithMovieSchema,
} from "./reviews.js";

// Types - Exports explicites pour éviter les conflits
export type {
  // Admin
  PaginationQuery,
  UserFilters,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  DeleteUserRequest,
} from "./admin.js";

export type {
  // Auth
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  VerifyTokenRequest,
} from "./auth.js";

export type {
  // Movies
  MovieIdParams,
  MoviesQuery,
  MovieRequestPayload,
} from "./movies.js";

export type {
  // Reviews
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewIdParams,
  MovieIdParams as ReviewMovieParams,
  ReviewsQuery,
  CreateReviewWithMovieRequest,
} from "./reviews.js";
