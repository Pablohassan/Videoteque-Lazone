export enum ErrorCode {
  // Authentification
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_TOKEN = "INVALID_TOKEN",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_FILE_PATH = "INVALID_FILE_PATH",
  INVALID_FILE_EXTENSION = "INVALID_FILE_EXTENSION",
  FILE_NOT_ACCESSIBLE = "FILE_NOT_ACCESSIBLE",

  // Ressources
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Serveur
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Administration
  ADMIN_REQUIRED = "ADMIN_REQUIRED",
  CANNOT_DELETE_SELF = "CANNOT_DELETE_SELF",
  USER_INACTIVE = "USER_INACTIVE",

  // Scanner de films
  MOVIE_FOLDER_NOT_FOUND = "MOVIE_FOLDER_NOT_FOUND",
  MOVIE_FOLDER_NOT_ACCESSIBLE = "MOVIE_FOLDER_NOT_ACCESSIBLE",
  MOVIE_SCAN_FAILED = "MOVIE_SCAN_FAILED",
  MOVIE_INDEXING_FAILED = "MOVIE_INDEXING_FAILED",
  TMDB_API_ERROR = "TMDB_API_ERROR",
  TMDB_MOVIE_NOT_FOUND = "TMDB_MOVIE_NOT_FOUND",
  MOVIE_PARSING_ERROR = "MOVIE_PARSING_ERROR",
  MOVIE_ALREADY_EXISTS = "MOVIE_ALREADY_EXISTS",

  // Surveillance de fichiers
  WATCHER_START_FAILED = "WATCHER_START_FAILED",
  WATCHER_STOP_FAILED = "WATCHER_STOP_FAILED",
  WATCHER_ALREADY_RUNNING = "WATCHER_ALREADY_RUNNING",
  WATCHER_NOT_RUNNING = "WATCHER_NOT_RUNNING",

  // Base de données
  DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
  DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",
  DATABASE_TRANSACTION_ERROR = "DATABASE_TRANSACTION_ERROR",
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
  statusCode?: number;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly statusCode: number;
  public readonly cause?: Error;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
    this.statusCode =
      options.statusCode || this.getDefaultStatusCode(options.code);
  }

  private getDefaultStatusCode(code: ErrorCode): number {
    const statusMap: Record<ErrorCode, number> = {
      [ErrorCode.UNAUTHORIZED]: 401,
      [ErrorCode.FORBIDDEN]: 403,
      [ErrorCode.INVALID_TOKEN]: 401,
      [ErrorCode.VALIDATION_ERROR]: 400,
      [ErrorCode.INVALID_INPUT]: 400,
      [ErrorCode.INVALID_FILE_PATH]: 400,
      [ErrorCode.INVALID_FILE_EXTENSION]: 400,
      [ErrorCode.FILE_NOT_ACCESSIBLE]: 403,
      [ErrorCode.NOT_FOUND]: 404,
      [ErrorCode.ALREADY_EXISTS]: 409,
      [ErrorCode.CONFLICT]: 409,
      [ErrorCode.INTERNAL_ERROR]: 500,
      [ErrorCode.SERVICE_UNAVAILABLE]: 503,
      [ErrorCode.ADMIN_REQUIRED]: 403,
      [ErrorCode.CANNOT_DELETE_SELF]: 400,
      [ErrorCode.USER_INACTIVE]: 403,
      [ErrorCode.MOVIE_FOLDER_NOT_FOUND]: 404,
      [ErrorCode.MOVIE_FOLDER_NOT_ACCESSIBLE]: 403,
      [ErrorCode.MOVIE_SCAN_FAILED]: 500,
      [ErrorCode.MOVIE_INDEXING_FAILED]: 500,
      [ErrorCode.TMDB_API_ERROR]: 502,
      [ErrorCode.TMDB_MOVIE_NOT_FOUND]: 404,
      [ErrorCode.MOVIE_PARSING_ERROR]: 400,
      [ErrorCode.MOVIE_ALREADY_EXISTS]: 409,
      [ErrorCode.WATCHER_START_FAILED]: 500,
      [ErrorCode.WATCHER_STOP_FAILED]: 500,
      [ErrorCode.WATCHER_ALREADY_RUNNING]: 409,
      [ErrorCode.WATCHER_NOT_RUNNING]: 400,
      [ErrorCode.DATABASE_CONNECTION_ERROR]: 500,
      [ErrorCode.DATABASE_QUERY_ERROR]: 500,
      [ErrorCode.DATABASE_TRANSACTION_ERROR]: 500,
    };
    return statusMap[code] || 500;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
    };
  }
}

// Factory functions pour créer des erreurs communes
export const createUnauthorizedError = (message = "Accès non autorisé") =>
  new AppError({ code: ErrorCode.UNAUTHORIZED, message });

export const createForbiddenError = (message = "Accès interdit") =>
  new AppError({ code: ErrorCode.FORBIDDEN, message });

export const createValidationError = (
  message = "Données invalides",
  details?: Record<string, unknown>
) => new AppError({ code: ErrorCode.VALIDATION_ERROR, message, details });

export const createNotFoundError = (resource = "Ressource") =>
  new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `${resource} non trouvé`,
  });

export const createConflictError = (message = "Conflit de données") =>
  new AppError({ code: ErrorCode.CONFLICT, message });

export const createAdminRequiredError = () =>
  new AppError({
    code: ErrorCode.ADMIN_REQUIRED,
    message: "Rôle administrateur requis",
  });

// Factory functions pour les erreurs de films
export const createMovieFolderNotFoundError = (folderPath: string) =>
  new AppError({
    code: ErrorCode.MOVIE_FOLDER_NOT_FOUND,
    message: `Dossier de films non trouvé: ${folderPath}`,
    details: { folderPath },
  });

export const createMovieFolderNotAccessibleError = (folderPath: string) =>
  new AppError({
    code: ErrorCode.MOVIE_FOLDER_NOT_ACCESSIBLE,
    message: `Dossier de films non accessible: ${folderPath}`,
    details: { folderPath },
  });

export const createMovieScanFailedError = (details?: Record<string, unknown>) =>
  new AppError({
    code: ErrorCode.MOVIE_SCAN_FAILED,
    message: "Échec du scan des films",
    details,
  });

export const createMovieIndexingFailedError = (
  filename: string,
  cause?: Error
) =>
  new AppError({
    code: ErrorCode.MOVIE_INDEXING_FAILED,
    message: `Échec de l'indexation du film: ${filename}`,
    details: { filename },
    cause,
  });

export const createTMDBApiError = (cause?: Error) =>
  new AppError({
    code: ErrorCode.TMDB_API_ERROR,
    message: "Erreur lors de l'appel à l'API TMDB",
    cause,
  });

export const createTMDBMovieNotFoundError = (title: string, year?: number) =>
  new AppError({
    code: ErrorCode.TMDB_MOVIE_NOT_FOUND,
    message: `Film non trouvé sur TMDB: ${title}${year ? ` (${year})` : ""}`,
    details: { title, year },
  });

export const createMovieParsingError = (filename: string, cause?: Error) =>
  new AppError({
    code: ErrorCode.MOVIE_PARSING_ERROR,
    message: `Impossible de parser le fichier: ${filename}`,
    details: { filename },
    cause,
  });

export const createMovieAlreadyExistsError = (title: string, year?: number) =>
  new AppError({
    code: ErrorCode.MOVIE_ALREADY_EXISTS,
    message: `Film déjà présent en base: ${title}${year ? ` (${year})` : ""}`,
    details: { title, year },
  });

export const createInvalidFilePathError = (filePath: string) =>
  new AppError({
    code: ErrorCode.INVALID_FILE_PATH,
    message: `Chemin de fichier invalide: ${filePath}`,
    details: { filePath },
  });

export const createInvalidFileExtensionError = (
  extension: string,
  supportedExtensions: string[]
) =>
  new AppError({
    code: ErrorCode.INVALID_FILE_EXTENSION,
    message: `Extension de fichier non supportée: ${extension}`,
    details: { extension, supportedExtensions },
  });

export const createFileNotAccessibleError = (filePath: string) =>
  new AppError({
    code: ErrorCode.FILE_NOT_ACCESSIBLE,
    message: `Fichier non accessible: ${filePath}`,
    details: { filePath },
  });

// Factory functions pour les erreurs de surveillance
export const createWatcherStartFailedError = (cause?: Error) =>
  new AppError({
    code: ErrorCode.WATCHER_START_FAILED,
    message: "Échec du démarrage de la surveillance",
    cause,
  });

export const createWatcherStopFailedError = (cause?: Error) =>
  new AppError({
    code: ErrorCode.WATCHER_STOP_FAILED,
    message: "Échec de l'arrêt de la surveillance",
    cause,
  });

export const createWatcherAlreadyRunningError = () =>
  new AppError({
    code: ErrorCode.WATCHER_ALREADY_RUNNING,
    message: "Le service de surveillance est déjà en cours d'exécution",
  });

export const createWatcherNotRunningError = () =>
  new AppError({
    code: ErrorCode.WATCHER_NOT_RUNNING,
    message: "Le service de surveillance n'est pas en cours d'exécution",
  });

// Factory functions pour les erreurs de base de données
export const createDatabaseConnectionError = (cause?: Error) =>
  new AppError({
    code: ErrorCode.DATABASE_CONNECTION_ERROR,
    message: "Erreur de connexion à la base de données",
    cause,
  });

export const createDatabaseQueryError = (query: string, cause?: Error) =>
  new AppError({
    code: ErrorCode.DATABASE_QUERY_ERROR,
    message: "Erreur lors de l'exécution de la requête",
    details: { query },
    cause,
  });

export const createDatabaseTransactionError = (cause?: Error) =>
  new AppError({
    code: ErrorCode.DATABASE_TRANSACTION_ERROR,
    message: "Erreur lors de la transaction en base de données",
    cause,
  });
