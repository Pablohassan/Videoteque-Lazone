import express from "express";
import { SubtitleService } from "../services/subtitleService.js";
import { optionalAuth } from "../middleware/passport-auth.js";
import fs from "fs-extra";
import path from "path";
import { apiServiceLogger } from "../utils/logger.js";

const router = express.Router();
const subtitleService = new SubtitleService();

/**
 * Route pour servir les sous-titres convertis en VTT
 * GET /api/subtitles/:filename
 */
router.get("/:filename", optionalAuth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== "string") {
      apiServiceLogger.warn("Subtitle request with invalid path parameter", {
        filename,
      });
      return res.status(400).json({ error: "Paramètre 'path' requis" });
    }

    // Vérifier que le fichier existe
    if (!(await fs.pathExists(filePath))) {
      apiServiceLogger.warn("Subtitle file not found", {
        filename,
        requestedPath: filePath,
      });
      return res
        .status(404)
        .json({ error: "Fichier de sous-titres non trouvé" });
    }

    // Détecter le format du fichier
    const ext = path.extname(filename).toLowerCase();

    let subtitleContent: string;
    let contentType: string;

    try {
      if (ext === ".vtt") {
        apiServiceLogger.debug("Reading native VTT file", { filename, ext });
        // Fichier VTT natif
        subtitleContent = await fs.readFile(filePath, "utf-8");
        contentType = "text/vtt";
      } else if (ext === ".srt") {
        apiServiceLogger.debug("Converting SRT to VTT", { filename, ext });
        // Convertir SRT vers VTT
        subtitleContent = await subtitleService.convertSrtToVtt(filePath);
        contentType = "text/vtt";
      } else {
        apiServiceLogger.warn("Unsupported subtitle format requested", {
          filename,
          ext,
        });
        // Autres formats non supportés
        return res
          .status(415)
          .json({ error: "Format de sous-titres non supporté" });
      }

      apiServiceLogger.debug("Subtitle content generated", {
        filename,
        ext,
        contentLength: subtitleContent.length,
      });
    } catch (conversionError) {
      apiServiceLogger.error(
        "Error during subtitle conversion/reading",
        conversionError instanceof Error
          ? conversionError
          : new Error(String(conversionError)),
        {
          filename,
          ext,
          filePath,
        }
      );
      return res
        .status(500)
        .json({ error: "Erreur lors de la conversion des sous-titres" });
    }

    // Définir les headers pour éviter la mise en cache et permettre le streaming
    res.set({
      "Content-Type": contentType,
      "Content-Length": Buffer.byteLength(subtitleContent, "utf-8"),
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    res.send(subtitleContent);
  } catch (error) {
    console.error("Erreur lors de la récupération des sous-titres:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;
