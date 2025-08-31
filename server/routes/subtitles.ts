import express from "express";
import { SubtitleService } from "../services/subtitleService.js";
import { optionalAuth } from "../middleware/passport-auth.js";
import fs from "fs-extra";
import path from "path";

const router = express.Router();
const subtitleService = new SubtitleService();

/**
 * Route pour servir les sous-titres convertis en VTT
 * GET /api/subtitles/:filename
 */
router.get("/:filename", optionalAuth, async (req, res) => {
  try {
    console.log("🔍 Route sous-titres appelée avec:", req.params, req.query);

    const { filename } = req.params;
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== "string") {
      console.log("❌ Paramètre 'path' manquant ou invalide");
      return res.status(400).json({ error: "Paramètre 'path' requis" });
    }

    console.log("📁 Vérification du fichier:", filePath);

    // Vérifier que le fichier existe
    if (!(await fs.pathExists(filePath))) {
      console.log("❌ Fichier non trouvé:", filePath);
      return res
        .status(404)
        .json({ error: "Fichier de sous-titres non trouvé" });
    }

    console.log("✅ Fichier trouvé, détection du format...");

    // Détecter le format du fichier
    const ext = path.extname(filename).toLowerCase();
    console.log("📁 Extension détectée:", ext);

    let subtitleContent: string;
    let contentType: string;

    try {
      if (ext === ".vtt") {
        console.log("📝 Lecture fichier VTT natif...");
        // Fichier VTT natif
        subtitleContent = await fs.readFile(filePath, "utf-8");
        contentType = "text/vtt";
      } else if (ext === ".srt") {
        console.log("🔄 Conversion SRT vers VTT...");
        // Convertir SRT vers VTT
        subtitleContent = await subtitleService.convertSrtToVtt(filePath);
        contentType = "text/vtt";
      } else {
        console.log("❌ Format non supporté:", ext);
        // Autres formats non supportés
        return res
          .status(415)
          .json({ error: "Format de sous-titres non supporté" });
      }

      console.log("✅ Contenu généré, taille:", subtitleContent.length);
    } catch (conversionError) {
      console.error(
        "❌ Erreur lors de la conversion/lecture:",
        conversionError
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
