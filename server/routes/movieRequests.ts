import { Router, Request, Response } from "express";
import { movieRequestService } from "../services/movieRequestService.js";
import { passportJwtAuth } from "../middleware/passport-auth.js";
import { validateBody } from "../middleware/validation.js";
import { asyncErrorHandler } from "../middleware/errorHandler.js";
import { movieRequestSchema } from "../schemas/movies.js";
import type {
  PassportRequest,
  AuthRequest,
  MovieRequestUser,
} from "../types/index.js";
import type { MovieRequestPayload } from "../schemas/movies.js";

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(passportJwtAuth);

// Créer une nouvelle demande de film
router.post(
  "/",
  validateBody(movieRequestSchema),
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
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
  })
);

// Obtenir toutes les demandes de l'utilisateur connecté
router.get(
  "/my-requests",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as MovieRequestUser).id;
    const requests = await movieRequestService.getUserRequests(userId);

    res.json({
      success: true,
      data: requests,
    });
  })
);

// Obtenir toutes les demandes (pour les admins)
router.get(
  "/",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const requests = await movieRequestService.getAllRequests();

    res.json({
      success: true,
      data: requests,
    });
  })
);

// Obtenir une demande par ID
router.get(
  "/:id",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const request = await movieRequestService.getRequestById(id);

    if (!request) {
      res.status(404).json({
        success: false,
        error: "Demande non trouvée",
      });
      return;
    }

    res.json({
      success: true,
      data: request,
    });
  })
);

// Mettre à jour le statut d'une demande
router.patch(
  "/:id/status",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!["pending", "processing", "available"].includes(status)) {
      res.status(400).json({
        success: false,
        error: "Statut invalide",
      });
      return;
    }

    const request = await movieRequestService.updateRequestStatus(id, status);

    res.json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: request,
    });
  })
);

// Mettre à jour une demande
router.put(
  "/:id",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
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
  })
);

// Supprimer une demande
router.delete(
  "/:id",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    await movieRequestService.deleteRequest(id);

    res.json({
      success: true,
      message: "Demande supprimée avec succès",
    });
  })
);

// Obtenir les statistiques des demandes
router.get(
  "/stats/overview",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await movieRequestService.getRequestStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;
