import { z } from "zod";
import { PAGINATION_CONSTRAINTS } from "../constants/validation.js";

// Schema pour la création d'une critique
export const createReviewSchema = z.object({
  rating: z.coerce
    .number({
      required_error: "La note est requise",
      invalid_type_error: "La note doit être un nombre",
    })
    .int("La note doit être un entier")
    .min(1, "La note doit être au minimum 1")
    .max(5, "La note ne peut pas dépasser 5"),

  comment: z
    .string({
      required_error: "Le commentaire est requis",
      invalid_type_error: "Le commentaire doit être une chaîne de caractères",
    })
    .min(10, "Le commentaire doit contenir au moins 10 caractères")
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Le commentaire ne peut pas être vide"),
});

// Schema pour la mise à jour d'une critique
export const updateReviewSchema = createReviewSchema.partial();

// Schema pour les paramètres d'ID de critique
export const reviewIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID de critique invalide")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "ID de critique doit être positif"),
});

// Schema pour les paramètres d'ID de film (pour les critiques)
export const movieIdSchema = z.object({
  movieId: z
    .string()
    .regex(/^\d+$/, "ID de film invalide")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "ID de film doit être positif"),
});

// Schema pour les requêtes de critiques
export const reviewsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Le numéro de page doit être un entier")
    .min(PAGINATION_CONSTRAINTS.MIN_PAGE, "Page minimum: 1")
    .default(PAGINATION_CONSTRAINTS.DEFAULT_PAGE),

  limit: z.coerce
    .number()
    .int("La limite doit être un entier")
    .min(1, "Limite minimum: 1")
    .max(50, "Limite maximum pour les critiques: 50")
    .default(10),

  sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schema combiné pour créer une critique avec l'ID du film
export const createReviewWithMovieSchema = createReviewSchema.extend({
  movieId: z.coerce
    .number()
    .int("ID de film invalide")
    .positive("ID de film doit être positif"),
});

// Types TypeScript dérivés des schémas
export type CreateReviewRequest = z.infer<typeof createReviewSchema>;
export type UpdateReviewRequest = z.infer<typeof updateReviewSchema>;
export type ReviewIdParams = z.infer<typeof reviewIdSchema>;
export type MovieIdParams = z.infer<typeof movieIdSchema>;
export type ReviewsQuery = z.infer<typeof reviewsQuerySchema>;
export type CreateReviewWithMovieRequest = z.infer<
  typeof createReviewWithMovieSchema
>;
