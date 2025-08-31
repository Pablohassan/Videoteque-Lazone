import { Router } from "express";
import { reviewService } from "../services/reviewService.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  createReviewSchema,
  movieIdSchema,
  reviewsQuerySchema,
} from "../utils/schemas.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// POST /api/reviews/movie/:id
router.post(
  "/movie/:id",
  validateParams(movieIdSchema),
  validateBody(createReviewSchema),
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const movieId = parseInt(req.params.id);
      const authorId = req.user!.id;

      const review = await reviewService.createReview(
        movieId,
        authorId,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Critique créée avec succès",
        data: { review },
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
);

// GET /api/reviews/movie/:id
router.get(
  "/movie/:id",
  validateParams(movieIdSchema),
  validateQuery(reviewsQuerySchema),
  async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      const result = await reviewService.getReviewsByMovie(
        movieId,
        req.query as Record<string, unknown>
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des critiques",
      });
    }
  }
);

// GET /api/reviews/user/me
router.get(
  "/user/me",
  validateQuery(reviewsQuerySchema),
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const authorId = req.user!.id;
      const result = await reviewService.getReviewsByUser(
        authorId,
        req.query as Record<string, unknown>
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de vos critiques",
      });
    }
  }
);

// PUT /api/reviews/:id
router.put(
  "/:id",
  validateBody(createReviewSchema),
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const authorId = req.user!.id;

      const review = await reviewService.updateReview(
        reviewId,
        authorId,
        req.body
      );

      res.json({
        success: true,
        message: "Critique mise à jour avec succès",
        data: { review },
      });
    } catch (error: unknown) {
      const status =
        error instanceof Error && error.message.includes("Non autorisé")
          ? 403
          : error instanceof Error && error.message.includes("non trouvée")
          ? 404
          : 400;

      res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
);

// DELETE /api/reviews/:id
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const authorId = req.user!.id;

    const result = await reviewService.deleteReview(reviewId, authorId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const status =
      error instanceof Error && error.message.includes("Non autorisé")
        ? 403
        : error instanceof Error && error.message.includes("non trouvée")
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
});

// GET /api/reviews/:id
router.get("/:id", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const review = await reviewService.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Critique non trouvée",
      });
    }

    res.json({
      success: true,
      data: { review },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la critique",
    });
  }
});

export default router;
