import express from "express";
import { adminService } from "../services/adminService.js";
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
import type {
  AdminRequest,
  AdminUser,
  CreateUserRequest,
  UpdateUserRequest,
} from "../types/index.js";

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

export default router;
