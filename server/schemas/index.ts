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
  // Nouveaux schémas pour le scanner
  FolderPathSchema,
  FilePathSchema,
  VideoFileExtensionSchema,
  MovieFilenameSchema,
  ScanOptionsSchema,
  WatcherOptionsSchema,
  TMDBSearchSchema,
  IndexingOptionsSchema,
  ParsedMovieSchema,
  validateFolderPath,
  validateFilePath,
  validateVideoFile,
  validateMovieTitle,
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

// Note: Les types sont maintenant exportés UNIQUEMENT depuis types/index.ts
// pour éviter les duplications et respecter l'architecture modulaire.
// Utilisez toujours: import type { ... } from "../types/index.js";
