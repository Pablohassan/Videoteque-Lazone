import { Router } from "express";
import { reviewService } from "../services/reviewService.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validation.js";
import { AuthRequest } from "../types/index.js";
import { z } from "zod";

const router = Router();

// Schéma de validation pour la création d'une critique
const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(2000),
});

// Schéma de validation pour la mise à jour d'une critique
const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(2000),
});

// POST /api/reviews - Créer une nouvelle critique
router.post(
  "/",
  authenticateToken,
  validateBody(createReviewSchema),
  async (req: AuthRequest, res) => {
    try {
      const { rating, comment } = req.body;
      const movieId = parseInt(req.body.movieId);
      const authorId = req.user!.id; // Depuis le middleware d'authentification

      if (!movieId || isNaN(movieId)) {
        return res.status(400).json({
          success: false,
          message: "ID du film requis et valide",
        });
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
          return res.status(409).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("Film non trouvé")) {
          return res.status(404).json({
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
router.get("/movie/:movieId", async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      return res.status(400).json({
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
});

// PUT /api/reviews/:id - Mettre à jour une critique
router.put(
  "/:id",
  authenticateToken,
  validateBody(updateReviewSchema),
  async (req: AuthRequest, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { rating, comment } = req.body;
      const authorId = req.user!.id;

      if (isNaN(reviewId)) {
        return res.status(400).json({
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
          return res.status(403).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("non trouvée")) {
          return res.status(404).json({
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
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const authorId = req.user!.id;

    if (isNaN(reviewId)) {
      return res.status(400).json({
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
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("non trouvée")) {
        return res.status(404).json({
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
});

// GET /api/reviews/movie/:movieId/average - Récupérer la note moyenne d'un film
router.get("/movie/:movieId/average", async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);

    if (isNaN(movieId)) {
      return res.status(400).json({
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
});

export default router;
