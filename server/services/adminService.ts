import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.js";
import { emailService } from "./emailService.js";
import {
  createAdminRequiredError,
  createConflictError,
  createNotFoundError,
  createValidationError,
  AppError,
  ErrorCode,
} from "../utils/errors.js";
import {
  USER_CONSTRAINTS,
  ADMIN_ACTION_TYPES,
  USER_ROLES,
  USER_STATUS,
} from "../constants/validation.js";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "../schemas/admin.js";
import type { User, AdminAction } from "@prisma/client";

export class AdminService {
  /**
   * Vérifier si un utilisateur a le rôle administrateur
   */
  async isAdmin(userId: number): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true },
      });

      return (
        user?.role === USER_ROLES.ADMIN && user.isActive === USER_STATUS.ACTIVE
      );
    } catch (error) {
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la vérification des droits d'administration",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Créer un nouvel utilisateur (admin seulement)
   */
  async createUser(
    adminId: number,
    data: CreateUserRequest
  ): Promise<{
    user: Pick<
      User,
      "id" | "email" | "name" | "role" | "isActive" | "createdAt"
    >;
    tempPassword: string;
  }> {
    // Vérifier que l'utilisateur est admin
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      });

      if (existingUser) {
        throw createConflictError("Un utilisateur avec cet email existe déjà");
      }

      // Générer un mot de passe temporaire sécurisé
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Créer l'utilisateur dans une transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            name: data.name,
            password: hashedPassword,
            role: data.role,
            isActive: USER_STATUS.ACTIVE,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        return user;
      });

      // Envoyer l'email d'invitation en arrière-plan (ne pas bloquer la réponse)
      setImmediate(async () => {
        try {
          const emailSent = await emailService.sendUserInvitation({
            email: result.email,
            name: result.name,
            tempPassword,
            loginUrl: process.env.FRONTEND_URL,
          });

          if (emailSent) {
            console.log(`✅ Email d'invitation envoyé à ${result.email}`);
          } else {
            console.warn(`⚠️ Échec de l'envoi d'email à ${result.email}`);
          }
        } catch (emailError) {
          console.error(
            `❌ Erreur lors de l'envoi d'email à ${result.email}:`,
            emailError
          );
        }
      });

      return {
        user: result,
        tempPassword,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Erreur lors de la création d'utilisateur:", error);

      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la création de l'utilisateur",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(adminId: number, userId: number, data: UpdateUserRequest) {
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!existingUser) {
        throw createNotFoundError("Utilisateur");
      }

      // Construire les données de mise à jour de manière sécurisée
      const updateData = this.buildUpdateData(data);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            updatedAt: true,
          },
        });

        // Enregistrer l'action administrative
        await tx.adminAction.create({
          data: {
            action: ADMIN_ACTION_TYPES.UPDATE_USER,
            targetUserId: userId,
            details: `Mise à jour de l'utilisateur ${user.email}`,
            adminId,
          },
        });

        return user;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la mise à jour de l'utilisateur",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetUserPassword(adminId: number, userId: number) {
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const tempPassword = this.generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const user = await tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        // Enregistrer l'action administrative
        await tx.adminAction.create({
          data: {
            action: ADMIN_ACTION_TYPES.RESET_PASSWORD,
            targetUserId: userId,
            details: `Réinitialisation du mot de passe pour ${user.email}`,
            adminId,
          },
        });

        return { user, tempPassword };
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la réinitialisation du mot de passe",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Changer le statut d'un utilisateur (activer/désactiver)
   */
  async toggleUserStatus(adminId: number, userId: number, isActive: boolean) {
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    try {
      const action = isActive
        ? ADMIN_ACTION_TYPES.ACTIVATE_USER
        : ADMIN_ACTION_TYPES.DEACTIVATE_USER;
      const actionText = isActive ? "réactivation" : "désactivation";

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: { isActive },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        });

        // Enregistrer l'action administrative
        await tx.adminAction.create({
          data: {
            action,
            targetUserId: userId,
            details: `${actionText} de l'utilisateur ${user.email}`,
            adminId,
          },
        });

        return user;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la modification du statut de l'utilisateur",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(adminId: number, userId: number) {
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    // Vérifier que l'admin ne se supprime pas lui-même
    if (adminId === userId) {
      throw new AppError({
        code: ErrorCode.CANNOT_DELETE_SELF,
        message: "Un administrateur ne peut pas se supprimer lui-même",
        statusCode: 400,
      });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.delete({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        // Enregistrer l'action administrative
        await tx.adminAction.create({
          data: {
            action: ADMIN_ACTION_TYPES.DELETE_USER,
            targetUserId: userId,
            details: `Suppression de l'utilisateur ${user.email}`,
            adminId,
          },
        });

        return user;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la suppression de l'utilisateur",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Lister les utilisateurs avec filtres et pagination
   */
  async listUsers(
    adminId: number,
    filters: UserFilters
  ): Promise<{
    users: Pick<
      User,
      | "id"
      | "email"
      | "name"
      | "role"
      | "isActive"
      | "lastLoginAt"
      | "createdAt"
      | "updatedAt"
    >[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    try {
      console.log("DEBUG: Filters reçus:", JSON.stringify(filters, null, 2));

      // Simplifier temporairement pour identifier le problème
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const total = users.length;

      return {
        users,
        pagination: {
          page: 1,
          limit: total,
          total,
          pages: 1,
        },
      };
    } catch (error) {
      console.error("DEBUG: Erreur complète:", error);
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la récupération des utilisateurs",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  async getUserStats(adminId: number) {
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    try {
      const [totalUsers, activeUsers, adminUsers, recentUsers] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.user.count({ where: { role: USER_ROLES.ADMIN } }),
          prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
              },
            },
          }),
        ]);

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        recentUsers,
      };
    } catch (error) {
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la récupération des statistiques",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Obtenir l'historique des actions administratives
   */
  async getAdminActions(adminId: number, page: number = 1, limit: number = 50) {
    if (!(await this.isAdmin(adminId))) {
      throw createAdminRequiredError();
    }

    try {
      const skip = (page - 1) * limit;

      const [actions, total] = await Promise.all([
        prisma.adminAction.findMany({
          skip,
          take: limit,
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.adminAction.count(),
      ]);

      return {
        actions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la récupération des actions administratives",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  // Méthodes privées utilitaires

  /**
   * Générer un mot de passe temporaire sécurisé
   */
  private generateTempPassword(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";

    for (let i = 0; i < USER_CONSTRAINTS.TEMP_PASSWORD_LENGTH; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }

  /**
   * Construire les données de mise à jour de manière sécurisée
   */
  private buildUpdateData(data: UpdateUserRequest) {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return updateData;
  }

  /**
   * Construire les filtres pour la recherche d'utilisateurs
   */
  private buildUserFilters(
    filters: Pick<UserFilters, "role" | "isActive" | "search">
  ) {
    const where: Record<string, unknown> = {};

    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }
}

export const adminService = new AdminService();
