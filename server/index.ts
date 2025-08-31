import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MovieScanner } from "./scripts/movieScanner.js";
import { initializePassport } from "./middleware/passport-auth.js";

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
dotenv.config();

// Environment configuration with strict typing
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE_ENV = process.env.NODE_ENV as "development" | "production" | "test";
const isProduction = NODE_ENV === "production";
const port = parseInt(process.env.PORT ?? "3001", 10);

// Auto scan configuration with validation
const AUTO_SCAN_INTERVAL = Math.max(
  parseInt(process.env.AUTO_SCAN_INTERVAL ?? "3600000", 10),
  60000 // Minimum 1 minute
);
const AUTO_SCAN_ENABLED = process.env.AUTO_SCAN_ENABLED !== "false";

// Auto scan function with proper error handling
const startAutoScan = async (): Promise<void> => {
  if (!AUTO_SCAN_ENABLED) {
    console.log("⚠️ Auto scan disabled");
    return;
  }

  try {
    const scanner = new MovieScanner();
    console.log("🔍 Starting auto scan...");
    await scanner.scanFolder();
    console.log("✅ Auto scan completed");
  } catch (error) {
    console.error("❌ Auto scan error:", error);
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

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
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
        await startAutoScan();
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

  // Static file serving for production
  if (isProduction) {
    app.use(
      express.static(path.join(__dirname, "../dist"), {
        maxAge: "1d",
        etag: true,
      })
    );

    app.get("*", (req: Request, res: Response): void => {
      res.sendFile(path.join(__dirname, "../dist/index.html"));
    });
  }

  // Graceful server startup
  const server = app.listen(port, () => {
    console.log(`🚀 Server started on http://localhost:${port}`);
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(
      `🔒 Security: ${isProduction ? "Production mode" : "Development mode"}`
    );

    // Start auto scan if enabled
    if (AUTO_SCAN_ENABLED) {
      console.log(
        `⏰ Auto scan configured every ${AUTO_SCAN_INTERVAL / 60000} minutes`
      );

      // Initial scan
      startAutoScan();

      // Schedule recurring scans
      setInterval(startAutoScan, AUTO_SCAN_INTERVAL);
    }
  });

  // Graceful shutdown handling
  process.on("SIGTERM", () => {
    console.log("📴 SIGTERM received, shutting down gracefully");
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("📴 SIGINT received, shutting down gracefully");
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  });
};

createServer().catch(console.error);
