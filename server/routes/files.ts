import { Router } from "express";
import { createReadStream } from "fs";
import { optionalAuth } from "../middleware/passport-auth.js";
import mime from "mime-types";
import fs from "fs-extra";
import path from "path";

const router = Router();

// GET /api/files/download/:filename - Téléchargement de fichier
router.get("/download/:filename", optionalAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({
        success: false,
        message: "Chemin du fichier requis",
      });
    }

    // Vérifier que le fichier existe avec fs-extra
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return res.status(400).json({
          success: false,
          message: "Le chemin spécifié n'est pas un fichier",
        });
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Fichier non trouvé",
      });
    }

    // Détecter automatiquement le type MIME
    const detectedMime = mime.lookup(filePath);
    const mimeType =
      typeof detectedMime === "string"
        ? detectedMime
        : "application/octet-stream";

    // Extraire le nom réel du fichier depuis le chemin
    const realFilename = path.basename(filePath);

    // Définir les headers pour le téléchargement avec le nom réel du fichier
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${realFilename}"`
    );
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", (await fs.stat(filePath)).size);

    // Créer le stream de lecture et l'envoyer
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Erreur lors de la lecture du fichier:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Erreur lors de la lecture du fichier",
        });
      }
    });
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du téléchargement",
      });
    }
  }
});

// GET /api/files/stream/:filename - Streaming vidéo avec support des range headers
router.get("/stream/:filename", optionalAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({
        success: false,
        message: "Chemin du fichier requis",
      });
    }

    // Vérifier que le fichier existe avec fs-extra
    let stats;
    try {
      stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return res.status(400).json({
          success: false,
          message: "Le chemin spécifié n'est pas un fichier",
        });
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Fichier non trouvé",
      });
    }

    const fileSize = stats.size;
    const range = req.headers.range;

    // Détecter automatiquement le type MIME
    const detectedMime = mime.lookup(filePath);
    const mimeType =
      typeof detectedMime === "string" ? detectedMime : "video/mp4";

    // Extraire le nom réel du fichier depuis le chemin pour les logs
    const realFilename = path.basename(filePath);

    if (range) {
      // Support des range headers pour la lecture partielle
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      // Validation des paramètres de range
      if (start >= fileSize || end >= fileSize || start > end) {
        return res.status(416).json({
          success: false,
          message: "Range non satisfiable",
        });
      }

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

      const fileStream = createReadStream(filePath, { start, end });

      // Gestion des erreurs du stream
      fileStream.on("error", (error) => {
        console.error("Erreur du stream:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Erreur lors de la lecture du fichier",
          });
        }
      });

      // Gestion de la fermeture du stream
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

      const fileStream = createReadStream(filePath);

      // Gestion des erreurs du stream
      fileStream.on("error", (error) => {
        console.error("Erreur du stream:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Erreur lors de la lecture du fichier",
          });
        }
      });

      // Gestion de la fermeture du stream
      fileStream.on("end", () => {
        res.end();
      });

      fileStream.pipe(res);
    }

    // Gestion des erreurs et de la fermeture
    req.on("close", () => {
      // Le client a fermé la connexion
      console.log("Client a fermé la connexion");
    });

    req.on("error", (error) => {
      console.error("Erreur de la requête:", error);
    });

    res.on("error", (error) => {
      console.error("Erreur de la réponse:", error);
    });
  } catch (error) {
    console.error("Erreur lors du streaming:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Erreur lors du streaming",
      });
    }
  }
});

// HEAD /api/files/stream/:filename - Vérification des métadonnées du fichier
router.head("/stream/:filename", optionalAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({
        success: false,
        message: "Chemin du fichier requis",
      });
    }

    // Vérifier que le fichier existe
    let stats;
    try {
      stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return res.status(400).json({
          success: false,
          message: "Le chemin spécifié n'est pas un fichier",
        });
      }
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Fichier non trouvé",
      });
    }

    const fileSize = stats.size;
    const detectedMime = mime.lookup(filePath);
    const mimeType =
      typeof detectedMime === "string" ? detectedMime : "video/mp4";

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD",
      "Access-Control-Allow-Headers": "Range",
    });

    res.end();
  } catch (error) {
    console.error("Erreur lors de la vérification HEAD:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification du fichier",
      });
    }
  }
});

export default router;
