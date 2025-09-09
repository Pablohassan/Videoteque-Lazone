import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MovieScanner } from "./scripts/movieScanner.js";
import { initializePassport } from "./middleware/passport-auth.js";
import { movieWatcherService } from "./services/movieWatcherService.js";
import { movieIndexingService } from "./services/movieIndexingService.js";

// Import routes with proper typing
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import reviewRoutes from "./routes/reviews.js";
import requestRoutes from "./routes/requests.js";
import movieRequestRoutes from "./routes/movieRequests.js";
import fileRoutes from "./routes/files.js";
import subtitleRoutes from "./routes/subtitles.js";
import adminRoutes from "./routes/admin.js";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Réinitialiser le TMDBClient avec les nouvelles variables d'environnement
movieIndexingService.reinitializeTMDBClient();

// Mettre à jour la configuration du MovieWatcherService avec les nouvelles variables d'environnement
// Forcer la revalidation du chemin dans le service d'indexation
movieIndexingService.getMoviesFolderPath(); // Cela déclenche ensureValidPath()

// Mettre à jour avec le chemin relatif validé
movieWatcherService.updateConfiguration({
  watchPath: movieIndexingService.getMoviesFolderPath(),
});

// Environment configuration with strict typing
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE_ENV = process.env.NODE_ENV as "development" | "production" | "test";
const isProduction = NODE_ENV === "production";
const port = parseInt(process.env.PORT ?? "3001", 10);

// Auto watch configuration with validation
const AUTO_WATCH_ENABLED = process.env.AUTO_WATCH_ENABLED !== "false";
const FORCE_FULL_REINDEX = process.env.FORCE_FULL_REINDEX === "true";

// Fonction d'indexation intelligente avec diff
const performSmartIndexing = async (): Promise<void> => {
  const fs = await import("fs");
  const path = await import("path");

  const moviesFolder = movieIndexingService.getMoviesFolderAbsolutePath();
  const indexStateFile = path.join(process.cwd(), ".movie-index-state.json");

  try {
    // Vérifier si un état d'indexation existe
    const indexState = {
      lastIndexedFiles: new Set<string>(),
      lastIndexTime: 0,
    };

    if (fs.existsSync(indexStateFile) && !FORCE_FULL_REINDEX) {
      // Charger l'état existant
      const stateData = JSON.parse(fs.readFileSync(indexStateFile, "utf-8"));
      indexState.lastIndexedFiles = new Set(stateData.lastIndexedFiles || []);
      indexState.lastIndexTime = stateData.lastIndexTime || 0;
      console.log(
        `📊 État d'indexation chargé: ${indexState.lastIndexedFiles.size} fichiers`
      );
    }

    // Scanner tous les fichiers actuels
    const currentFiles = new Set<string>();
    const scanDirectory = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (
            [
              ".mp4",
              ".mkv",
              ".avi",
              ".mov",
              ".wmv",
              ".flv",
              ".webm",
              ".m4v",
            ].includes(ext)
          ) {
            // Utiliser le même format que la DB : ../../Downloads/films/...
            const relativeFromMovies = path.relative(moviesFolder, fullPath);
            const dbFormatPath = `../../Downloads/films/${relativeFromMovies}`;
            currentFiles.add(dbFormatPath);
          }
        }
      }
    };

    console.log("🔍 Scan du dossier films en cours...");
    console.log(`🔍 Dossier scanné: ${moviesFolder}`);
    scanDirectory(moviesFolder);
    console.log(`📁 ${currentFiles.size} fichiers vidéo trouvés`);

    // Debug: Afficher les fichiers trouvés
    console.log("📋 Fichiers trouvés:");
    Array.from(currentFiles)
      .slice(0, 10)
      .forEach((file) => {
        console.log(`   - ${file}`);
      });
    if (currentFiles.size > 10) {
      console.log(`   ... et ${currentFiles.size - 10} autres`);
    }

    // Identifier les nouveaux fichiers et les fichiers supprimés
    const newFiles = Array.from(currentFiles).filter(
      (file) => !indexState.lastIndexedFiles.has(file)
    );
    const deletedFiles = Array.from(indexState.lastIndexedFiles).filter(
      (file) => !currentFiles.has(file)
    );

    // Debug: Afficher les différences avec les vrais chemins
    if (deletedFiles.length > 0) {
      console.log("🗑️ Fichiers supprimés (DB vs Disque):");
      deletedFiles.slice(0, 3).forEach((file) => {
        console.log(`   - DB: ${file}`);
        // Essayer de trouver le chemin correspondant dans currentFiles
        const matching = Array.from(currentFiles).find((f) =>
          f.includes(path.basename(file))
        );
        if (matching) {
          console.log(`   - Disque: ${matching}`);
        }
      });
    }

    console.log(`➕ ${newFiles.length} nouveaux fichiers`);
    console.log(`➖ ${deletedFiles.length} fichiers supprimés`);

    // Debug: Afficher les différences
    if (newFiles.length > 0) {
      console.log("📄 Nouveaux fichiers:");
      newFiles.slice(0, 5).forEach((file) => console.log(`   + ${file}`));
    }
    if (deletedFiles.length > 0) {
      console.log("🗑️ Fichiers supprimés:");
      deletedFiles.slice(0, 5).forEach((file) => console.log(`   - ${file}`));
    }

    // DEBUG: Afficher l'état complet
    console.log(`\n🔍 ÉTAT DÉTAILLÉ:`);
    console.log(`   Fichiers dans le dossier: ${currentFiles.size}`);
    console.log(`   Fichiers dans l'état: ${indexState.lastIndexedFiles.size}`);
    console.log(`   Fichiers nouveaux: ${newFiles.length}`);
    console.log(`   Fichiers supprimés: ${deletedFiles.length}`);

    // METTRE À JOUR L'ÉTAT D'INDEXATION AVANT TOUT TRAITEMENT
    // L'état doit toujours refléter UNIQUEMENT les fichiers qui existent réellement
    const newIndexState = new Set();

    console.log(`🔍 DEBUG - Reconstruction de l'état:`);
    console.log(`   currentFiles.size: ${currentFiles.size}`);
    console.log(`   currentFiles contenu:`, Array.from(currentFiles));

    // Ajouter TOUS les fichiers présents dans le dossier (ils existent forcément)
    for (const currentFile of currentFiles) {
      newIndexState.add(currentFile);
      console.log(`   ✅ Ajouté: ${currentFile}`);
    }

    console.log(
      `📝 État reconstruit avec ${newIndexState.size} fichiers existants réels`
    );

    // Sauvegarder immédiatement l'état mis à jour
    const updatedIndexState = {
      lastIndexedFiles: Array.from(newIndexState),
      lastIndexTime: Date.now(),
    };

    fs.writeFileSync(
      indexStateFile,
      JSON.stringify(updatedIndexState, null, 2)
    );
    console.log(
      `💾 État d'indexation mis à jour: ${newIndexState.size} fichiers réels`
    );

    // Maintenant traiter l'indexation (cette étape peut échouer, mais l'état est déjà cohérent)

    // INDEXER TOUS LES FICHIERS AU DÉMARRAGE (pas seulement les nouveaux)
    console.log("🎬 Indexation de TOUS les fichiers...");
    let successCount = 0;
    let errorCount = 0;

    for (const relativePath of currentFiles) {
      const fullPath = path.join(moviesFolder, relativePath);
      try {
        console.log(`🔄 Indexation de: ${path.basename(relativePath)}`);
        const result = await movieIndexingService.indexSingleFile(fullPath);
        if (result.success) {
          console.log(`✅ Indexé: ${path.basename(relativePath)}`);
          successCount++;
        } else {
          console.log(
            `❌ Échec indexation: ${path.basename(relativePath)} - ${
              result.error
            }`
          );
          errorCount++;
        }
      } catch (error) {
        console.error(
          `💥 Erreur indexation ${path.basename(relativePath)}:`,
          error
        );
        errorCount++;
      }
    }

    console.log(`📊 Résultats: ${successCount} succès, ${errorCount} échecs`);

    // Nettoyer les films orphelins de la DB UNIQUEMENT pour les fichiers vraiment supprimés
    if (deletedFiles.length > 0) {
      console.log("🗑️ Nettoyage des vrais films orphelins...");
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      try {
        let cleanedCount = 0;
        for (const deletedFile of deletedFiles) {
          // Vérifier que le fichier n'existe vraiment plus
          const relativePath = deletedFile.replace(
            "../../Downloads/films/",
            ""
          );
          const absolutePath = path.join(moviesFolder, relativePath);
          const fileStillExists = fs.existsSync(absolutePath);

          if (!fileStillExists) {
            // Le fichier n'existe vraiment plus, on peut nettoyer
            const movie = await prisma.movie.findFirst({
              where: { localPath: deletedFile },
            });

            if (movie) {
              // Supprimer les relations
              await prisma.movieGenre.deleteMany({
                where: { movieId: movie.id },
              });
              await prisma.movieActor.deleteMany({
                where: { movieId: movie.id },
              });
              await prisma.review.deleteMany({
                where: { movieId: movie.id },
              });

              // Supprimer le film
              await prisma.movie.delete({
                where: { id: movie.id },
              });

              console.log(`🗑️ Film orphelin nettoyé: ${movie.title}`);
              cleanedCount++;
            }
          } else {
            console.log(
              `⏳ Film conservé (fichier existe toujours): ${deletedFile}`
            );
          }
        }

        console.log(`✅ ${cleanedCount} vrais films orphelins nettoyés`);
      } catch (error) {
        console.error("❌ Erreur lors du nettoyage:", error);
      } finally {
        await prisma.$disconnect();
      }
    }

    console.log(
      `🎉 Indexation intelligente terminée: ${newFiles.length} nouveaux, ${deletedFiles.length} supprimés`
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'indexation intelligente:", error);
  }
};

// Auto watch function with proper error handling
const startAutoWatch = async (): Promise<void> => {
  if (!AUTO_WATCH_ENABLED) {
    console.log("⚠️ Auto watch disabled");
    return;
  }

  try {
    console.log("🔍 Démarrage de la surveillance automatique...");

    // Indexation intelligente (diff au lieu de full reindex)
    console.log("🧠 Démarrage de l'indexation intelligente...");
    await performSmartIndexing();

    // Démarrer la surveillance
    await movieWatcherService.start();
  } catch (error) {
    console.error("❌ Erreur lors du démarrage de la surveillance:", error);
  }
};

const createServer = async (): Promise<void> => {
  const app = express();

  // Security middleware with modern configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", "https:", "http:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https:", "http:"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration - Support multiple development ports
  const allowedOrigins = [
    process.env.CLIENT_URL ?? "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, origin); // Return the origin to set the header
        } else {
          console.log(`🚫 CORS blocked: ${origin} not in allowed origins`);
          return callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Rate limiting with environment-based configuration
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: NODE_ENV === "production" ? 100 : 1000, // Stricter in production
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);

  // Body parsing middleware with limits
  app.use(
    express.json({
      limit: "10mb",
      strict: true,
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    })
  );

  // Initialize Passport.js
  const passport = initializePassport();
  app.use(passport.initialize());

  // API routes with proper organization
  app.use("/api/auth", authRoutes);
  app.use("/api/movies", movieRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/movie-requests", movieRequestRoutes);
  app.use("/api/files", fileRoutes);
  app.use("/api/subtitles", subtitleRoutes);
  app.use("/api/admin", adminRoutes);

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response): void => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      uptime: process.uptime(),
    });
  });

  // Manual scan trigger endpoint
  app.post(
    "/api/scan-now",
    async (req: Request, res: Response): Promise<void> => {
      try {
        await movieWatcherService.indexExistingFiles();
        res.status(200).json({
          success: true,
          message: "Scan started successfully",
        });
      } catch (error) {
        console.error("Manual scan error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to start scan",
        });
      }
    }
  );

  // Watcher status endpoint
  app.get("/api/watcher/status", (req: Request, res: Response): void => {
    const stats = movieWatcherService.getStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  // Static file serving for production
  if (isProduction) {
    app.use(
      express.static(path.join(__dirname, "../client"), {
        maxAge: "1d",
        etag: true,
      })
    );

    app.get("*", (req: Request, res: Response): void => {
      res.sendFile(path.join(__dirname, "../client/index.html"));
    });
  }

  // Graceful server startup
  const server = app.listen(port, () => {
    console.log(`🚀 Server started on http://localhost:${port}`);
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(
      `🔒 Security: ${isProduction ? "Production mode" : "Development mode"}`
    );

    // Start auto watch if enabled
    if (AUTO_WATCH_ENABLED) {
      console.log("👀 Surveillance automatique activée");
      console.log("🧠 Indexation intelligente activée");

      // Démarrer la surveillance automatique avec indexation intelligente
      startAutoWatch();
    }
  });

  // Graceful shutdown handling
  process.on("SIGTERM", async () => {
    console.log("📴 SIGTERM received, shutting down gracefully");
    await movieWatcherService.stop();
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    console.log("📴 SIGINT received, shutting down gracefully");
    await movieWatcherService.stop();
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });
};

createServer().catch(console.error);
