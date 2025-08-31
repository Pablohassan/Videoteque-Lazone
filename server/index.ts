import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MovieScanner } from "./scripts/movieScanner.js";

// Import routes
import authRoutes from "./routes/auth.js";
import movieRoutes from "./routes/movies.js";
import reviewRoutes from "./routes/reviews.js";
import requestRoutes from "./routes/requests.js";
import movieRequestRoutes from "./routes/movieRequests.js";
import fileRoutes from "./routes/files.js";
import subtitleRoutes from "./routes/subtitles.js";

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 3001;

// Configuration du scan automatique
const AUTO_SCAN_INTERVAL = parseInt(
  process.env.AUTO_SCAN_INTERVAL || "3600000"
); // 1 heure par défaut
const AUTO_SCAN_ENABLED = process.env.AUTO_SCAN_ENABLED !== "false"; // Activé par défaut

// Fonction de scan automatique
async function startAutoScan() {
  if (!AUTO_SCAN_ENABLED) {
    console.log("⚠️ Scan automatique désactivé");
    return;
  }

  try {
    const scanner = new MovieScanner();
    console.log("🔍 Démarrage du scan automatique...");
    await scanner.scanFolder();
    console.log("✅ Scan automatique terminé");
  } catch (error) {
    console.error("❌ Erreur lors du scan automatique:", error);
  }
}

async function createServer() {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:", "http:"],
          "connect-src": ["'self'", "https:", "http:"],
        },
      },
    })
  );

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    })
  );

  // Rate limiting - Temporairement plus permissif pour le développement
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per minute
    message: "Trop de requêtes, réessayez plus tard.",
  });
  app.use("/api/", limiter);

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/movies", movieRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/movie-requests", movieRequestRoutes);
  app.use("/api/files", fileRoutes);
  app.use("/api/subtitles", subtitleRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Déclencher un scan manuel
  app.post("/api/scan-now", async (req, res) => {
    try {
      await startAutoScan();
      res.json({ success: true, message: "Scan lancé avec succès" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Erreur lors du scan" });
    }
  });

  // En production seulement, servir les fichiers statiques du frontend
  if (isProduction) {
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../dist/index.html"));
    });
  }

  app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);

    // Démarrer le scan automatique
    if (AUTO_SCAN_ENABLED) {
      console.log(
        `⏰ Scan automatique configuré toutes les ${
          AUTO_SCAN_INTERVAL / 60000
        } minutes`
      );

      // Premier scan au démarrage
      startAutoScan();

      // Timer pour les scans suivants
      setInterval(startAutoScan, AUTO_SCAN_INTERVAL);
    }
  });
}

createServer().catch(console.error);
