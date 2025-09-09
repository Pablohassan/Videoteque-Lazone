import express from "express";
import { adminService } from "../services/adminService.js";
import { registrationService } from "../services/registrationService.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validation.js";
import {
  createUserSchema,
  updateUserSchema,
  paginationSchema,
  userFiltersSchema,
  type UserFilters,
} from "../schemas/admin.js";
import { asyncErrorHandler } from "../middleware/errorHandler.js";
import {
  passportJwtAuth,
  requireRole,
  type PassportUser,
} from "../middleware/passport-auth.js";
import type { AdminRequest, AdminUser } from "../types/index.js";
import type { CreateUserRequest, UpdateUserRequest } from "../schemas/admin.js";

const router = express.Router();

// Utiliser Passport.js pour l'authentification JWT
router.use(passportJwtAuth);

// Vérifier que l'utilisateur est admin
router.use(requireRole("ADMIN"));

// Créer un utilisateur
router.post(
  "/users",
  validateBody(createUserSchema),
  asyncErrorHandler(async (req, res) => {
    const { email, name, role } = req.body;
    const adminId = (req.user as AdminUser).id;

    const result = await adminService.createUser(adminId, {
      email,
      name,
      role,
    });
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tempPassword: result.tempPassword,
        message: `Utilisateur créé avec succès. Mot de passe temporaire: ${result.tempPassword}`,
      },
    });
  })
);

// Lister les utilisateurs
router.get(
  "/users",
  validateQuery(userFiltersSchema),
  asyncErrorHandler(async (req, res) => {
    const filters = req.query as unknown as UserFilters;
    const adminId = (req.user as AdminUser).id;
    const result = await adminService.listUsers(adminId, filters);
    res.json({
      success: true,
      data: result,
    });
  })
);

// Statistiques des utilisateurs
router.get(
  "/users/stats",
  asyncErrorHandler(async (req, res) => {
    const adminId = (req.user as AdminUser).id;
    const stats = await adminService.getUserStats(adminId);
    res.json({
      success: true,
      data: stats,
    });
  })
);

// Mettre à jour un utilisateur
router.put(
  "/users/:userId",
  validateBody(updateUserSchema),
  asyncErrorHandler(async (req, res) => {
    const { userId } = req.params;
    const updateData = req.body;
    const adminId = (req.user as AdminUser).id;
    const result = await adminService.updateUser(
      adminId,
      parseInt(userId),
      updateData
    );
    res.json({
      success: true,
      data: result,
    });
  })
);

// Réinitialiser le mot de passe
router.post(
  "/users/:userId/reset-password",
  asyncErrorHandler(async (req, res) => {
    const { userId } = req.params;
    const adminId = (req.user as AdminUser).id;
    const result = await adminService.resetUserPassword(
      adminId,
      parseInt(userId)
    );
    res.json({
      success: true,
      data: {
        message: `Mot de passe réinitialisé. Nouveau mot de passe temporaire: ${result.tempPassword}`,
        tempPassword: result.tempPassword,
      },
    });
  })
);

// Basculer le statut d'un utilisateur
router.post(
  "/users/:userId/toggle-status",
  asyncErrorHandler(async (req, res) => {
    const { userId } = req.params;
    const adminId = (req.user as AdminUser).id;
    const targetUserId = parseInt(userId);

    // Récupérer l'utilisateur actuel pour connaître son statut
    const { prisma } = await import("../utils/prisma.js");
    const currentUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { isActive: true },
    });

    if (!currentUser) {
      throw new Error("Utilisateur non trouvé");
    }

    const newStatus = !currentUser.isActive;
    const result = await adminService.toggleUserStatus(
      adminId,
      targetUserId,
      newStatus
    );
    res.json({
      success: true,
      data: {
        message: `Statut modifié: ${result.isActive ? "activé" : "désactivé"}`,
        user: result,
      },
    });
  })
);

// Supprimer un utilisateur
router.delete(
  "/users/:userId",
  asyncErrorHandler(async (req, res) => {
    const { userId } = req.params;
    const adminId = (req.user as AdminUser).id;
    await adminService.deleteUser(adminId, parseInt(userId));
    res.json({
      success: true,
      data: {
        message: "Utilisateur supprimé avec succès",
      },
    });
  })
);

// Actions administratives
router.get(
  "/actions",
  validateQuery(paginationSchema),
  asyncErrorHandler(async (req, res) => {
    const { page, limit } = req.query;
    const adminId = (req.user as AdminUser).id;
    const result = await adminService.getAdminActions(
      adminId,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json({
      success: true,
      data: result,
    });
  })
);

// ===== REGISTRATION REQUESTS =====

// Récupérer les demandes d'inscription
router.get(
  "/registration-requests",
  validateQuery(paginationSchema),
  asyncErrorHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const filters = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
      status: status as "PENDING" | "APPROVED" | "REJECTED" | undefined,
    };

    const result = await registrationService.getRegistrationRequests(filters);
    res.json({
      success: true,
      data: result,
    });
  })
);

// Traiter une demande d'inscription (approuver/rejeter)
router.post(
  "/registration-requests/:requestId/process",
  asyncErrorHandler(async (req, res): Promise<void> => {
    const { requestId } = req.params;
    const { action, adminNotes } = req.body;
    const adminId = (req.user as AdminUser).id;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ACTION",
          message: "Action doit être APPROVE ou REJECT",
        },
      });
      return;
    }

    const result = await registrationService.processRegistrationRequest(
      adminId,
      {
        registrationId: parseInt(requestId),
        action,
        adminNotes,
      }
    );

    res.json({
      success: true,
      data: result,
      message:
        action === "APPROVE"
          ? "Demande approuvée avec succès"
          : "Demande rejetée",
    });
  })
);

// Supprimer une demande d'inscription
router.delete(
  "/registration-requests/:requestId",
  asyncErrorHandler(async (req, res) => {
    const { requestId } = req.params;
    const adminId = (req.user as AdminUser).id;

    await registrationService.deleteRegistrationRequest(
      adminId,
      parseInt(requestId)
    );
    res.json({
      success: true,
      data: {
        message: "Demande d'inscription supprimée avec succès",
      },
    });
  })
);

export default router;
