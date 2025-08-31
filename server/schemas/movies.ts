import { z } from "zod";
import { PAGINATION_CONSTRAINTS } from "../constants/validation.js";

// Schema pour les paramètres d'ID de film
export const movieIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID de film invalide")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "ID de film doit être positif"),
});

// Schema pour les paramètres de recherche de films
export const moviesQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Le numéro de page doit être un entier")
    .min(PAGINATION_CONSTRAINTS.MIN_PAGE, "Page minimum: 1")
    .default(PAGINATION_CONSTRAINTS.DEFAULT_PAGE),

  limit: z.coerce
    .number()
    .int("La limite doit être un entier")
    .min(1, "Limite minimum: 1")
    .max(
      PAGINATION_CONSTRAINTS.MAX_LIMIT,
      `Limite maximum: ${PAGINATION_CONSTRAINTS.MAX_LIMIT}`
    )
    .default(PAGINATION_CONSTRAINTS.DEFAULT_LIMIT),

  search: z
    .string()
    .optional()
    .transform((val) => val?.trim()),

  genre: z
    .string()
    .optional()
    .transform((val) => val?.trim()),

  year: z.coerce
    .number()
    .int("L'année doit être un entier")
    .min(1900, "Année minimum: 1900")
    .max(new Date().getFullYear() + 5, "Année trop éloignée")
    .optional(),

  sortBy: z
    .enum(["title", "releaseDate", "rating", "createdAt"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schema pour la création d'une demande de film
export const movieRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(500, "Le titre ne peut pas dépasser 500 caractères")
    .transform((val) => val.trim()),

  comment: z
    .string()
    .max(2000, "Le commentaire ne peut pas dépasser 2000 caractères")
    .optional()
    .transform((val) => val?.trim() || null),
});

// Types TypeScript dérivés des schémas
export type MovieIdParams = z.infer<typeof movieIdSchema>;
export type MoviesQuery = z.infer<typeof moviesQuerySchema>;
export type MovieRequestPayload = z.infer<typeof movieRequestSchema>;
