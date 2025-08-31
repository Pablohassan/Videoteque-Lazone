import { Router } from "express";
import { prisma } from "../utils/prisma.js";
import { validateBody } from "../middleware/validation.js";
import { movieRequestSchema } from "../utils/schemas.js";

const router = Router();

// POST /api/requests
router.post("/", validateBody(movieRequestSchema), async (req, res) => {
  try {
    const request = await prisma.movieRequest.create({
      data: {
        title: req.body.title,
        description: req.body.description,
      },
    });

    res.status(201).json({
      success: true,
      message: "Demande de film soumise avec succès",
      data: { request },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la soumission de la demande",
    });
  }
});

// GET /api/requests
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.movieRequest.findMany({
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.movieRequest.count(),
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des demandes",
    });
  }
});

// GET /api/requests/:id
router.get("/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const request = await prisma.movieRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Demande non trouvée",
      });
    }

    res.json({
      success: true,
      data: { request },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la demande",
    });
  }
});

// DELETE /api/requests/:id
router.delete("/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    const existingRequest = await prisma.movieRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Demande non trouvée",
      });
    }

    await prisma.movieRequest.delete({
      where: { id: requestId },
    });

    res.json({
      success: true,
      message: "Demande supprimée avec succès",
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la demande",
    });
  }
});

export default router;
