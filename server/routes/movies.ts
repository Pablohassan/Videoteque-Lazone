import { Router, Request, Response } from "express";
import { movieService } from "../services/movieService.js";
import { validateParams, validateQuery } from "../middleware/validation.js";
import { optionalAuth } from "../middleware/passport-auth.js";
import { movieIdSchema, moviesQuerySchema } from "../schemas/movies.js";
import { prisma } from "../utils/prisma.js";
import type { MoviesQuery, MovieIdParams } from "../schemas/movies.js";

console.log("🎬 [MOVIES ROUTES] Chargement du fichier routes/movies.ts");

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

// GET /api/movies/:id/stream - Streaming vidéo par ID de film (plus sécurisé)
router.get(
  "/:id/stream",
  (req, res, next) => {
    console.log(`🎬 [STREAM] Route appelée - URL complète: ${req.originalUrl}`);
    console.log(`🎬 [STREAM] Méthode: ${req.method}`);
    console.log(`🎬 [STREAM] Params:`, req.params);
    next();
  },
  optionalAuth,
  async (req, res) => {
    try {
      console.log(`🎬 [STREAM] Après middleware - movieId: ${req.params.id}`);
      console.log(`🎬 [STREAM] Headers:`, req.headers);

      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        console.error(`❌ [STREAM] ID invalide: ${req.params.id}`);
        return res.status(400).json({
          success: false,
          message: "ID de film invalide",
        });
      }

      // Récupérer le film depuis la base
      console.log(`🎬 [STREAM] Recherche du film ID: ${movieId}`);
      const movie = await prisma.movie.findUnique({
        where: { id: movieId },
        select: {
          id: true,
          localPath: true,
          filename: true,
          fileSize: true,
          container: true,
        },
      });

      console.log(`🎬 [STREAM] Film trouvé:`, movie);

      if (!movie) {
        console.error(`❌ [STREAM] Film non trouvé pour ID: ${movieId}`);
        return res.status(404).json({
          success: false,
          message: "Film non trouvé",
        });
      }

      if (!movie.localPath) {
        return res.status(404).json({
          success: false,
          message: "Chemin du fichier non disponible",
        });
      }

      const filePath = movie.localPath;
      const range = req.headers.range;

      // Transformation Docker : convertir les chemins absolus de l'hôte vers les chemins du conteneur
      let processedFilePath = filePath;
      if (
        filePath &&
        filePath.includes("/Users/rusmirsadikovic/Downloads/films/")
      ) {
        processedFilePath = filePath.replace(
          "/Users/rusmirsadikovic/Downloads/films/",
          "/app/movies/"
        );
        console.log(
          `🔄 Transformation Docker: ${filePath} → ${processedFilePath}`
        );
      }

      console.log(`🎬 Streaming par ID: ${movieId} -> ${processedFilePath}`);
      console.log(`🎬 Range header:`, range);

      // Copier la logique de streaming depuis files.ts
      console.log(`🎬 [STREAM] Début du traitement du fichier`);
      const fs = (await import("fs-extra")).default;
      const path = (await import("path")).default;
      const { createReadStream } = await import("fs");
      const mime = (await import("mime-types")).default;

      // Résoudre et vérifier le chemin du fichier
      let resolvedPath = processedFilePath;
      let stats;

      try {
        // Essayer d'abord le chemin tel quel
        stats = await fs.stat(processedFilePath);
      } catch (error) {
        console.warn(
          `⚠️ Chemin direct inaccessible: ${processedFilePath}`,
          error
        );

        // Essayer de résoudre le chemin relatif si c'est un chemin relatif
        if (!path.isAbsolute(processedFilePath)) {
          resolvedPath = path.resolve(process.cwd(), processedFilePath);
          console.log(
            `🔄 Tentative de résolution: ${processedFilePath} → ${resolvedPath}`
          );

          try {
            stats = await fs.stat(resolvedPath);
          } catch (resolveError) {
            console.error(
              `❌ Chemin résolu également inaccessible: ${resolvedPath}`,
              resolveError
            );
            return res.status(404).json({
              success: false,
              message: "Fichier non trouvé - chemin inaccessible",
            });
          }
        } else {
          console.error(
            `❌ Chemin absolu inaccessible: ${processedFilePath}`,
            error
          );
          return res.status(404).json({
            success: false,
            message: "Fichier non trouvé",
          });
        }
      }

      // Vérifier que c'est bien un fichier
      if (!stats.isFile()) {
        return res.status(400).json({
          success: false,
          message: "Le chemin spécifié n'est pas un fichier",
        });
      }

      const fileSize = stats.size;
      const detectedMime = mime.lookup(resolvedPath);
      const mimeType =
        typeof detectedMime === "string" ? detectedMime : "video/mp4";

      const realFilename = path.basename(resolvedPath);

      if (range) {
        console.log(`🎬 [STREAM] Traitement du range: ${range}`);
        // Support des range headers pour la lecture partielle
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        console.log(
          `🎬 [STREAM] Range calculé: start=${start}, end=${end}, chunksize=${chunksize}`
        );

        // Validation des paramètres de range
        if (start >= fileSize || end >= fileSize || start > end) {
          console.error(
            `❌ [STREAM] Range invalide: start=${start}, end=${end}, fileSize=${fileSize}`
          );
          return res.status(416).json({
            success: false,
            message: "Range non satisfiable",
          });
        }

        console.log(`🎬 [STREAM] Envoi des headers 206`);
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": mimeType,
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD",
          "Access-Control-Allow-Headers": "Range",
        });

        const fileStream = createReadStream(resolvedPath, { start, end });

        fileStream.on("error", (error) => {
          console.error("Erreur du stream:", error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Erreur lors de la lecture du fichier",
            });
          }
        });

        fileStream.on("end", () => {
          res.end();
        });

        fileStream.pipe(res);
      } else {
        // Lecture complète du fichier
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD",
          "Access-Control-Allow-Headers": "Range",
        });

        const fileStream = createReadStream(resolvedPath);

        fileStream.on("error", (error) => {
          console.error("Erreur du stream:", error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Erreur lors de la lecture du fichier",
            });
          }
        });

        fileStream.on("end", () => {
          res.end();
        });

        fileStream.pipe(res);
      }
    } catch (error: unknown) {
      console.error("❌ Erreur dans /:id/stream:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du streaming",
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

      // Détecter les pistes audio avec movieService
      const audioTracks = await movieService.detectAudioTracks(
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
          audioTracks,
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
