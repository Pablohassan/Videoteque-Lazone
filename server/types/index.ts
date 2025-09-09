// ========================================================================
// TYPES DE L'APPLICATION - POINT D'ENTRÉE CENTRAL
//
// Ce fichier est le point d'entrée UNIQUE pour tous les types de l'application.
// Il réexporte tous les types depuis leurs fichiers spécialisés pour faciliter les imports.
//
// ARCHITECTURE :
// ✅ Chaque domaine a son propre fichier (auth.ts, admin.ts, movies.ts, etc.)
// ✅ Les types communs sont dans common.ts
// ✅ index.ts ne fait que réexporter pour faciliter les imports
//
// AVANTAGES :
// 🔍 Maintenabilité : types organisés par domaine
// 🚀 Performance : fichiers spécialisés moins volumineux
// 👥 Collaboration : travail simultané sur différents domaines
// 📈 Évolutivité : ajout de nouveaux domaines facile
//
// ========================================================================

// ========================================================================
// RÉEXPORT DES TYPES POUR FACILITER LES IMPORTS
// ========================================================================

// Types LoginRequest et RegisterRequest sont dans schemas/auth.ts
// Utiliser: import type { LoginRequest, RegisterRequest } from "../schemas/auth";

// Réexport des types communs
export type {
  ApiResponse,
  PaginatedResponse,
  UserStats,
  MovieScanResult,
  ErrorDetails,
  Metadata,
  FileData,
  StatsData,
  AdminActionData,
  ID,
  Timestamp,
  StatusWithMetadata,
  // Types génériques de réponse
  MessageResponse,
  SuccessResponse,
  ErrorResponse,
} from "./common.js";

// Réexport des types TMDB depuis movies.ts
export type { TMDBMovie, TMDBGenre } from "./movies.js";

// Réexport des types d'authentification
export type {
  AuthRequest,
  PassportRequest,
  AuthUser,
  AuthHandler,
  AuthUserData,
  SessionData,
  JWTPayload,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  AuthError,
  // Types de réponses spécifiques
  PasswordResetResponse,
  TokenVerificationResponse,
} from "./auth.js";

// Réexport des types de films
export type {
  MovieUser,
  MovieHandler,
  MovieData,
  MovieGenreData,
  MovieActorData,
  MovieResponse,
  MovieFilters,
  MovieStats,
  SubtitleData,
  SubtitleScanResult,
} from "./movies.js";

// Réexport des types Prisma les plus utilisés
export type {
  User,
  Movie,
  Review,
  MovieRequest,
  AdminAction,
  Genre,
  Actor,
  MovieGenre,
  MovieActor,
} from "@prisma/client";

// Note: Les types des schémas sont maintenant importés directement depuis les schémas
// Utilisez: import type { LoginRequest, RegisterRequest } from "../schemas/auth";

// Types spécifiques à l'application (définis ci-dessus)
export type {
  AdminRequest,
  AdminPassportRequest,
  AdminUser,
  AdminHandler,
  AdminUserResponse,
  AdminStatsResponse,
  AdminActionResponse,
  AdminUserUpdateData,
  AdminUserCreateData,
  AdminUserFilters,
  AdminLogEntry,
  // Types de réponses spécifiques
  CreateUserResponse,
  UpdateUserResponse,
  DeleteUserResponse,
  RegistrationFilters,
  RegistrationRequestsResponse,
} from "./admin.js";

// Types d'authentification sont déjà exportés plus haut dans ce fichier

// Types de reviews
export type {
  ReviewRequest,
  ReviewPassportRequest,
  ReviewUser,
  ReviewHandler,
  ReviewData,
  ReviewUpdateData,
  ReviewFilters,
  ReviewResponse,
} from "./reviews.js";

// Types de demandes de films
export type {
  MovieRequestRequest,
  MovieRequestPassportRequest,
  MovieRequestUser,
  MovieRequestHandler,
  MovieRequestData,
  MovieRequestUpdateData,
  MovieRequestResponse,
} from "./movieRequests.js";

// Types d'inscription
export type {
  CreateRegistrationRequest,
  ProcessRegistrationRequest,
} from "./registration.js";
