import { Router, Request, Response } from "express";
import { movieService } from "../services/movieService.js";
import { validateParams, validateQuery } from "../middleware/validation.js";
import { optionalAuth } from "../middleware/passport-auth.js";
import { movieIdSchema, moviesQuerySchema } from "../schemas/movies.js";
import { prisma } from "../utils/prisma.js";
import type { MoviesQuery, MovieIdParams } from "../schemas/movies.js";

const router = Router();

// GET /api/movies
router.get(
  "/",
  validateQuery(moviesQuerySchema),
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
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
router.get(
  "/suggestions",
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

// GET /api/movies/genres
router.get("/genres", async (req: Request, res: Response): Promise<void> => {
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
router.get("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query, limit } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        success: false,
        message: "Paramètre de recherche requis",
      });
    }

    const movies = await movieService.searchMovies(
      query as string,
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const movieId = parseInt(req.params.id);
      const movie = await movieService.getMovieById(movieId);

      if (!movie) {
        res.status(404).json({
          success: false,
          message: "Film non trouvé",
        });
        return;
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

// GET /api/movies/:id/files-info
router.get(
  "/:id/files-info",
  validateParams(movieIdSchema),
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const movieId = parseInt(req.params.id);

      // Récupérer directement les informations de fichiers depuis la base
      const movie = await prisma.movie.findUnique({
        where: { id: movieId },
        select: {
          id: true,
          localPath: true,
          filename: true,
          fileSize: true,
          resolution: true,
          codec: true,
          container: true,
          lastScanned: true,
        },
      });

      if (!movie) {
        res.status(404).json({
          success: false,
          message: "Film non trouvé",
        });
        return;
      }

      // Détecter les sous-titres avec movieService
      const subtitleFiles = await movieService.detectSubtitleFiles(
        movie.localPath || ""
      );

      res.json({
        success: true,
        data: {
          movieId: movie.id,
          localPath: movie.localPath,
          filename: movie.filename,
          fileSize: movie.fileSize ? Number(movie.fileSize) : null,
          resolution: movie.resolution,
          codec: movie.codec,
          container: movie.container,
          lastScanned: movie.lastScanned,
          subtitleFiles,
        },
      });
    } catch (error: unknown) {
      console.error("❌ Erreur dans /:id/files-info:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des informations de fichiers",
      });
    }
  }
);

export default router;
