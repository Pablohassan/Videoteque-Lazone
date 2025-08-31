export enum ErrorCode {
  // Authentification
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_TOKEN = "INVALID_TOKEN",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

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
      [ErrorCode.NOT_FOUND]: 404,
      [ErrorCode.ALREADY_EXISTS]: 409,
      [ErrorCode.CONFLICT]: 409,
      [ErrorCode.INTERNAL_ERROR]: 500,
      [ErrorCode.SERVICE_UNAVAILABLE]: 503,
      [ErrorCode.ADMIN_REQUIRED]: 403,
      [ErrorCode.CANNOT_DELETE_SELF]: 400,
      [ErrorCode.USER_INACTIVE]: 403,
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
