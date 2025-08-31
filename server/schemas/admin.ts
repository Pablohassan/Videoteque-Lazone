import { z } from "zod";
import {
  USER_CONSTRAINTS,
  USER_ROLES,
  PAGINATION_CONSTRAINTS,
} from "../constants/validation.js";

// Schéma de base pour les utilisateurs
const baseUserSchema = z.object({
  name: z
    .string()
    .min(
      USER_CONSTRAINTS.NAME_MIN_LENGTH,
      `Le nom doit contenir au moins ${USER_CONSTRAINTS.NAME_MIN_LENGTH} caractères`
    )
    .max(
      USER_CONSTRAINTS.NAME_MAX_LENGTH,
      `Le nom ne peut pas dépasser ${USER_CONSTRAINTS.NAME_MAX_LENGTH} caractères`
    )
    .transform((name) => name.trim())
    .refine((name) => name.length > 0, "Le nom ne peut pas être vide"),

  email: z
    .string()
    .email("Format d'email invalide")
    .max(
      USER_CONSTRAINTS.EMAIL_MAX_LENGTH,
      `L'email ne peut pas dépasser ${USER_CONSTRAINTS.EMAIL_MAX_LENGTH} caractères`
    )
    .transform((email) => email.toLowerCase().trim())
    .refine((email) => email.length > 0, "L'email ne peut pas être vide"),
});

// Schéma pour l'inscription d'utilisateur
export const registerSchema = baseUserSchema.extend({
  password: z
    .string()
    .min(
      USER_CONSTRAINTS.PASSWORD_MIN_LENGTH,
      `Le mot de passe doit contenir au moins ${USER_CONSTRAINTS.PASSWORD_MIN_LENGTH} caractères`
    )
    .max(
      USER_CONSTRAINTS.PASSWORD_MAX_LENGTH,
      `Le mot de passe ne peut pas dépasser ${USER_CONSTRAINTS.PASSWORD_MAX_LENGTH} caractères`
    ),
});

// Schéma pour la création d'utilisateur (admin)
export const createUserSchema = baseUserSchema.extend({
  role: z
    .enum([USER_ROLES.USER, USER_ROLES.ADMIN])
    .default(USER_ROLES.USER)
    .describe("Rôle de l'utilisateur"),
});

// Schéma pour la mise à jour d'utilisateur
export const updateUserSchema = baseUserSchema.partial().extend({
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).optional(),
  isActive: z.boolean().optional(),
});

// Schéma pour la pagination
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int("Le numéro de page doit être un entier")
    .min(
      PAGINATION_CONSTRAINTS.MIN_PAGE,
      `Le numéro de page doit être au moins ${PAGINATION_CONSTRAINTS.MIN_PAGE}`
    )
    .default(PAGINATION_CONSTRAINTS.DEFAULT_PAGE),

  limit: z.coerce
    .number()
    .int("La limite doit être un entier")
    .min(1, "La limite doit être au moins 1")
    .max(
      PAGINATION_CONSTRAINTS.MAX_LIMIT,
      `La limite ne peut pas dépasser ${PAGINATION_CONSTRAINTS.MAX_LIMIT}`
    )
    .default(PAGINATION_CONSTRAINTS.DEFAULT_LIMIT),
});

// Schéma pour les filtres utilisateur
export const userFiltersSchema = paginationSchema.extend({
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z
    .string()
    .optional()
    .transform((s) => s?.trim()),
  sortBy: z
    .enum(["name", "email", "createdAt", "lastLoginAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schéma pour la réinitialisation de mot de passe
export const resetPasswordSchema = z.object({
  userId: z.coerce
    .number()
    .int("ID utilisateur invalide")
    .positive("ID utilisateur invalide"),
});

// Schéma pour la suppression d'utilisateur
export const deleteUserSchema = z.object({
  userId: z.coerce
    .number()
    .int("ID utilisateur invalide")
    .positive("ID utilisateur invalide"),
});

// Types TypeScript dérivés des schémas
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type DeleteUserRequest = z.infer<typeof deleteUserSchema>;
