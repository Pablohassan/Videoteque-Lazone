export const USER_CONSTRAINTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  TEMP_PASSWORD_LENGTH: 12,
} as const;

export const PAGINATION_CONSTRAINTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_PAGE: 1,
} as const;

export const ADMIN_ACTION_TYPES = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  RESET_PASSWORD: 'RESET_PASSWORD',
  ACTIVATE_USER: 'ACTIVATE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  CHANGE_ROLE: 'CHANGE_ROLE',
} as const;

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

// Messages d'erreur centralisés
export const ERROR_MESSAGES = {
  VALIDATION: {
    EMAIL_INVALID: 'Format d\'email invalide',
    EMAIL_TOO_LONG: 'Email trop long',
    NAME_TOO_SHORT: 'Nom trop court',
    NAME_TOO_LONG: 'Nom trop long',
    PASSWORD_TOO_SHORT: 'Mot de passe trop court',
    PASSWORD_TOO_LONG: 'Mot de passe trop long',
    REQUIRED_FIELD: 'Ce champ est requis',
  },
  AUTH: {
    UNAUTHORIZED: 'Accès non autorisé',
    FORBIDDEN: 'Accès interdit',
    ADMIN_REQUIRED: 'Rôle administrateur requis',
    INVALID_CREDENTIALS: 'Identifiants invalides',
    ACCOUNT_DISABLED: 'Compte désactivé',
  },
  USER: {
    NOT_FOUND: 'Utilisateur non trouvé',
    ALREADY_EXISTS: 'Un utilisateur avec cet email existe déjà',
    CANNOT_DELETE_SELF: 'Un administrateur ne peut pas se supprimer lui-même',
    INVALID_ROLE: 'Rôle invalide',
  },
  ADMIN: {
    ACTION_FAILED: 'Action administrative échouée',
    INSUFFICIENT_PERMISSIONS: 'Permissions insuffisantes',
  },
} as const;
