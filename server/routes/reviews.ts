import { Router, Request, Response } from "express";
import { reviewService } from "../services/reviewService.js";
import { passportJwtAuth } from "../middleware/passport-auth.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.js";
import { PassportRequest } from "../types/index.js";
import { ReviewUser } from "../types/reviews.js";

// Import des schémas centralisés
import {
  createReviewSchema,
  updateReviewSchema,
  reviewsQuerySchema,
  movieIdSchema,
  reviewIdSchema,
} from "../schemas/reviews.js";
import type {
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewsQuery,
  MovieIdParams,
  ReviewIdParams,
} from "../schemas/reviews.js";

const router = Router();

// POST /api/reviews - Créer une nouvelle critique
router.post(
  "/",
  passportJwtAuth,
  validateBody(createReviewSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { rating, comment } = req.body;
      const movieId = parseInt(req.body.movieId);
      const authorId = (req.user as ReviewUser).id; // Depuis le middleware d'authentification

      if (!movieId || isNaN(movieId)) {
        res.status(400).json({
          success: false,
          message: "ID du film requis et valide",
        });
        return;
      }

      const review = await reviewService.createReview({
        movieId,
        authorId,
        rating,
        comment,
      });

      res.status(201).json({
        success: true,
        data: { review },
        message: "Critique créée avec succès",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("déjà critiqué")) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("Film non trouvé")) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la critique",
      });
    }
  }
);

// GET /api/reviews/movie/:movieId - Récupérer les critiques d'un film
router.get(
  "/movie/:movieId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const movieId = parseInt(req.params.movieId);

      if (isNaN(movieId)) {
        res.status(400).json({
          success: false,
          message: "ID du film invalide",
        });
      }

      const reviews = await reviewService.getMovieReviews(movieId);

      res.json({
        success: true,
        data: { reviews },
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des critiques",
      });
    }
  }
);

// PUT /api/reviews/:id - Mettre à jour une critique
router.put(
  "/:id",
  passportJwtAuth,
  validateBody(updateReviewSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reviewId = parseInt(req.params.id);
      const { rating, comment } = req.body;
      const authorId = (req.user as ReviewUser).id;

      if (isNaN(reviewId)) {
        res.status(400).json({
          success: false,
          message: "ID de la critique invalide",
        });
      }

      const review = await reviewService.updateReview(reviewId, authorId, {
        rating,
        comment,
      });

      res.json({
        success: true,
        data: { review },
        message: "Critique mise à jour avec succès",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("non autorisée")) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("non trouvée")) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la critique",
      });
    }
  }
);

// DELETE /api/reviews/:id - Supprimer une critique
router.delete(
  "/:id",
  passportJwtAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reviewId = parseInt(req.params.id);
      const authorId = (req.user as ReviewUser).id;

      if (isNaN(reviewId)) {
        res.status(400).json({
          success: false,
          message: "ID de la critique invalide",
        });
      }

      await reviewService.deleteReview(reviewId, authorId);

      res.json({
        success: true,
        message: "Critique supprimée avec succès",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("non autorisée")) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("non trouvée")) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la critique",
      });
    }
  }
);

// GET /api/reviews/movie/:movieId/average - Récupérer la note moyenne d'un film
router.get(
  "/movie/:movieId/average",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const movieId = parseInt(req.params.movieId);

      if (isNaN(movieId)) {
        res.status(400).json({
          success: false,
          message: "ID du film invalide",
        });
      }

      const averageRating = await reviewService.getMovieAverageRating(movieId);

      res.json({
        success: true,
        data: { averageRating },
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du calcul de la note moyenne",
      });
    }
  }
);

export default router;
