import { z } from "zod";
import { USER_CONSTRAINTS } from "../constants/validation.js";

// Schema de base pour l'authentification
const baseAuthSchema = z.object({
  email: z
    .string()
    .email("Format d'email invalide")
    .max(
      USER_CONSTRAINTS.EMAIL_MAX_LENGTH,
      `L'email ne peut pas dépasser ${USER_CONSTRAINTS.EMAIL_MAX_LENGTH} caractères`
    )
    .transform((email) => email.toLowerCase().trim())
    .refine((email) => email.length > 0, "L'email ne peut pas être vide"),

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

// Schema pour la connexion
export const loginSchema = baseAuthSchema;

// Schema pour la connexion (alias pour compatibilité)
export const authLoginSchema = baseAuthSchema;

// Schema pour l'inscription
export const registerSchema = baseAuthSchema.extend({
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
});

// Schema pour le changement de mot de passe
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),

  newPassword: z
    .string()
    .min(
      USER_CONSTRAINTS.PASSWORD_MIN_LENGTH,
      `Le nouveau mot de passe doit contenir au moins ${USER_CONSTRAINTS.PASSWORD_MIN_LENGTH} caractères`
    )
    .max(
      USER_CONSTRAINTS.PASSWORD_MAX_LENGTH,
      `Le nouveau mot de passe ne peut pas dépasser ${USER_CONSTRAINTS.PASSWORD_MAX_LENGTH} caractères`
    ),
});

// Schema pour la vérification de token
export const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token requis"),
});

// Types TypeScript dérivés des schémas
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type VerifyTokenRequest = z.infer<typeof verifyTokenSchema>;
