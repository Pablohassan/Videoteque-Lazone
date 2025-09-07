import { Router, Request, Response } from "express";
import { movieRequestService } from "../services/movieRequestService.js";
import { passportJwtAuth } from "../middleware/passport-auth.js";
import { validateBody } from "../middleware/validation.js";
import { movieRequestSchema } from "../schemas/movies.js";
import type { PassportRequest, AuthRequest } from "../types/index.js";
import type { MovieRequestUser } from "../types/movieRequests.js";
import type { MovieRequestPayload } from "../schemas/movies.js";

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(passportJwtAuth);

// Créer une nouvelle demande de film
router.post(
  "/",
  validateBody(movieRequestSchema),
  async (req: Request, res: Response) => {
    try {
      console.log("🎬 SERVEUR - Nouvelle demande de film reçue");
      console.log("📝 Données reçues:", {
        title: req.body.title,
        comment: req.body.comment,
      });
      console.log("👤 Utilisateur:", (req.user as MovieRequestUser)?.id);

      const { title, comment } = req.body;
      const userId = (req.user as MovieRequestUser).id; // Récupéré du middleware d'authentification

      console.log("🔄 Création de la demande...");
      const request = await movieRequestService.createRequest({
        title,
        comment,
        userId,
      });

      console.log("✅ Demande créée avec succès:", request.id);
      res.status(201).json({
        success: true,
        message: "Demande de film créée avec succès",
        data: request,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la création de la demande:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la création de la demande",
      });
    }
  }
);

// Obtenir toutes les demandes de l'utilisateur connecté
router.get("/my-requests", async (req: Request, res: Response) => {
  try {
    const userId = (req.user as MovieRequestUser).id;
    const requests = await movieRequestService.getUserRequests(userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes",
    });
  }
});

// Obtenir toutes les demandes (pour les admins)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await movieRequestService.getAllRequests();

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes",
    });
  }
});

// Obtenir une demande par ID
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const request = await movieRequestService.getRequestById(id);

    if (!request) {
      res.status(404).json({
        success: false,
        error: "Demande non trouvée",
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la demande:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la demande",
    });
  }
});

// Mettre à jour le statut d'une demande
router.patch(
  "/:id/status",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!["pending", "processing", "available"].includes(status)) {
        res.status(400).json({
          success: false,
          error: "Statut invalide",
        });
      }

      const request = await movieRequestService.updateRequestStatus(id, status);

      res.json({
        success: true,
        message: "Statut mis à jour avec succès",
        data: request,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la mise à jour du statut",
      });
    }
  }
);

// Mettre à jour une demande
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { title, comment } = req.body;

    const request = await movieRequestService.updateRequest(id, {
      title,
      comment,
    });

    res.json({
      success: true,
      message: "Demande mise à jour avec succès",
      data: request,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la demande:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de la demande",
    });
  }
});

// Supprimer une demande
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await movieRequestService.deleteRequest(id);

    res.json({
      success: true,
      message: "Demande supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la demande:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de la demande",
    });
  }
});

// Obtenir les statistiques des demandes
router.get(
  "/stats/overview",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await movieRequestService.getRequestStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération des statistiques",
      });
    }
  }
);

export default router;
