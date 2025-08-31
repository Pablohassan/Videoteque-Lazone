import { Router } from "express";
import { movieService } from "../services/movieService.js";
import { validateParams, validateQuery } from "../middleware/validation.js";
import { optionalAuth } from "../middleware/auth.js";
import { movieIdSchema, moviesQuerySchema } from "../utils/schemas.js";

const router = Router();

// GET /api/movies
router.get(
  "/",
  validateQuery(moviesQuerySchema),
  optionalAuth,
  async (req, res) => {
    try {
      const result = await movieService.getAllMovies({
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des films",
      });
    }
  }
);

// GET /api/movies/suggestions
router.get("/suggestions", optionalAuth, async (req, res) => {
  try {
    const movies = await movieService.getWeeklySuggestions();

    res.json({
      success: true,
      data: { movies },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des suggestions",
    });
  }
});

// GET /api/movies/genres
router.get("/genres", async (req, res) => {
  try {
    const genres = await movieService.getGenres();

    res.json({
      success: true,
      data: { genres },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des genres",
    });
  }
});

// GET /api/movies/search
router.get("/search", async (req, res) => {
  try {
    const { q: query, limit } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Paramètre de recherche requis",
      });
    }

    const movies = await movieService.searchMovies(
      query,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: { movies },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche",
    });
  }
});

// GET /api/movies/:id
router.get(
  "/:id",
  validateParams(movieIdSchema),
  optionalAuth,
  async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      const movie = await movieService.getMovieById(movieId);

      if (!movie) {
        return res.status(404).json({
          success: false,
          message: "Film non trouvé",
        });
      }

      res.json({
        success: true,
        data: { movie },
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du film",
      });
    }
  }
);

export default router;
