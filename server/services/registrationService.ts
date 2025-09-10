import { prisma } from "../utils/prisma.js";
import { emailService } from "./emailService.js";
import {
  createConflictError,
  createValidationError,
  createNotFoundError,
  AppError,
  ErrorCode,
} from "../utils/errors.js";
import {
  USER_CONSTRAINTS,
  ADMIN_ACTION_TYPES,
  USER_ROLES,
  USER_STATUS,
} from "../constants/validation.js";
import type { User, UserRegistrationRequest } from "@prisma/client";
import type {
  CreateRegistrationRequest,
  RegistrationFilters,
  ProcessRegistrationRequest,
} from "../types/index.js";

export class RegistrationService {
  /**
   * Créer une nouvelle demande d'inscription
   */
  async createRegistrationRequest(data: CreateRegistrationRequest): Promise<{
    registration: Pick<
      UserRegistrationRequest,
      "id" | "email" | "name" | "status" | "requestedAt"
    >;
  }> {
    try {
      // Valider les données d'entrée
      this.validateRegistrationData(data);

      // Vérifier si une demande existe déjà pour cet email
      const existingRequest = await prisma.userRegistrationRequest.findFirst({
        where: { email: data.email, status: "PENDING" },
        select: { id: true, status: true },
      });

      if (existingRequest) {
        if (existingRequest.status === "PENDING") {
          throw createConflictError(
            "Une demande d'inscription est déjà en attente pour cet email"
          );
        } else if (existingRequest.status === "APPROVED") {
          throw createConflictError("Un compte existe déjà pour cet email");
        }
      }

      // Créer la demande d'inscription
      const registration = await prisma.userRegistrationRequest.create({
        data: {
          email: data.email,
          name: data.name,
          status: "PENDING",
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          requestedAt: true,
        },
      });

      // Notifier l'admin par email (optionnel - peut être désactivé)
      setImmediate(async () => {
        try {
          await this.notifyAdminOfNewRequest(registration);
        } catch (error) {
          console.error("Erreur lors de la notification admin:", error);
        }
      });

      return { registration };
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error(
        "Erreur lors de la création de la demande d'inscription:",
        error
      );
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la création de la demande d'inscription",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Récupérer les demandes d'inscription avec pagination et filtres
   */
  async getRegistrationRequests(filters: RegistrationFilters = {}): Promise<{
    requests: (UserRegistrationRequest & {
      admin?: Pick<User, "id" | "name" | "email"> | null;
    })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { status, page = 1, limit = 20 } = filters;

      const where = status ? { status } : {};

      const [requests, total] = await Promise.all([
        prisma.userRegistrationRequest.findMany({
          where,
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { requestedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.userRegistrationRequest.count({ where }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des demandes d'inscription:",
        error
      );
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la récupération des demandes d'inscription",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Traiter une demande d'inscription (approuver ou rejeter)
   */
  async processRegistrationRequest(
    adminId: number,
    data: ProcessRegistrationRequest
  ): Promise<{
    registration: UserRegistrationRequest & {
      admin?: Pick<User, "id" | "name" | "email"> | null;
    };
    user?: Pick<User, "id" | "email" | "name" | "role" | "isActive">;
  }> {
    try {
      // Vérifier que l'utilisateur est admin
      const isAdmin = await this.isAdmin(adminId);
      if (!isAdmin) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message:
            "Seuls les administrateurs peuvent traiter les demandes d'inscription",
        });
      }

      // Récupérer la demande
      const registration = await prisma.userRegistrationRequest.findUnique({
        where: { id: data.registrationId },
      });

      if (!registration) {
        throw createNotFoundError("Demande d'inscription");
      }

      if (registration.status !== "PENDING") {
        throw createValidationError("Cette demande a déjà été traitée");
      }

      let user:
        | Pick<User, "id" | "email" | "name" | "role" | "isActive">
        | undefined;

      if (data.action === "APPROVE") {
        // Créer l'utilisateur avec un mot de passe temporaire
        const tempPassword = this.generateTempPassword();

        user = await this.createUserFromRegistration(
          registration,
          tempPassword
        );

        // Envoyer l'email avec les identifiants
        setImmediate(async () => {
          try {
            await emailService.sendUserInvitation({
              email: user!.email,
              name: user!.name,
              tempPassword,
              loginUrl: process.env.FRONTEND_URL,
            });
          } catch (error) {
            console.error("Erreur lors de l'envoi d'email:", error);
          }
        });
      }

      // Mettre à jour la demande d'inscription
      const updatedRegistration = await prisma.userRegistrationRequest.update({
        where: { id: data.registrationId },
        data: {
          status: data.action === "APPROVE" ? "APPROVED" : "REJECTED",
          processedAt: new Date(),
          adminId,
          adminNotes: data.adminNotes,
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Enregistrer l'action administrative
      await prisma.adminAction.create({
        data: {
          action:
            data.action === "APPROVE"
              ? ADMIN_ACTION_TYPES.CREATE_USER
              : "REJECT_REGISTRATION_REQUEST",
          targetUserId: user?.id,
          details: `${
            data.action === "APPROVE" ? "Approuvé" : "Rejeté"
          } la demande d'inscription de ${registration.email}`,
          adminId,
        },
      });

      return {
        registration: updatedRegistration,
        user,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error(
        "Erreur lors du traitement de la demande d'inscription:",
        error
      );
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors du traitement de la demande d'inscription",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Supprimer une demande d'inscription
   */
  async deleteRegistrationRequest(
    adminId: number,
    registrationId: number
  ): Promise<void> {
    try {
      // Vérifier que l'utilisateur est admin
      const isAdmin = await this.isAdmin(adminId);
      if (!isAdmin) {
        throw new AppError({
          code: ErrorCode.FORBIDDEN,
          message:
            "Seuls les administrateurs peuvent supprimer les demandes d'inscription",
        });
      }

      const registration = await prisma.userRegistrationRequest.findUnique({
        where: { id: registrationId },
        select: { id: true, status: true },
      });

      if (!registration) {
        throw createNotFoundError("Demande d'inscription");
      }

      await prisma.userRegistrationRequest.delete({
        where: { id: registrationId },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error(
        "Erreur lors de la suppression de la demande d'inscription:",
        error
      );
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: "Erreur lors de la suppression de la demande d'inscription",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Validation des données de demande d'inscription
   */
  private validateRegistrationData(data: CreateRegistrationRequest): void {
    // Validation du nom
    if (!data.name || data.name.length < USER_CONSTRAINTS.NAME_MIN_LENGTH) {
      throw createValidationError(
        `Le nom doit contenir au moins ${USER_CONSTRAINTS.NAME_MIN_LENGTH} caractères`
      );
    }

    if (data.name.length > USER_CONSTRAINTS.NAME_MAX_LENGTH) {
      throw createValidationError(
        `Le nom ne peut pas dépasser ${USER_CONSTRAINTS.NAME_MAX_LENGTH} caractères`
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      throw createValidationError("Format d'email invalide");
    }

    if (data.email.length > USER_CONSTRAINTS.EMAIL_MAX_LENGTH) {
      throw createValidationError(
        `L'email ne peut pas dépasser ${USER_CONSTRAINTS.EMAIL_MAX_LENGTH} caractères`
      );
    }
  }

  /**
   * Générer un mot de passe temporaire sécurisé
   */
  private generateTempPassword(): string {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";

    for (let i = 0; i < USER_CONSTRAINTS.TEMP_PASSWORD_LENGTH; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * Créer un utilisateur à partir d'une demande d'inscription approuvée
   */
  private async createUserFromRegistration(
    registration: UserRegistrationRequest,
    tempPassword: string
  ): Promise<Pick<User, "id" | "email" | "name" | "role" | "isActive">> {
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    return await prisma.user.create({
      data: {
        email: registration.email,
        name: registration.name,
        password: hashedPassword,
        role: USER_ROLES.USER,
        isActive: USER_STATUS.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Vérifier si un utilisateur est administrateur
   */
  private async isAdmin(userId: number): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true },
      });

      return (
        user?.role === USER_ROLES.ADMIN && user.isActive === USER_STATUS.ACTIVE
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Notifier l'admin d'une nouvelle demande d'inscription
   */
  private async notifyAdminOfNewRequest(
    registration: Pick<
      UserRegistrationRequest,
      "id" | "email" | "name" | "requestedAt"
    >
  ): Promise<void> {
    try {
      // Récupérer tous les admins
      const admins = await prisma.user.findMany({
        where: {
          role: USER_ROLES.ADMIN,
          isActive: USER_STATUS.ACTIVE,
        },
        select: { email: true, name: true },
      });

      if (admins.length === 0) {
        console.warn("Aucun administrateur trouvé pour la notification");
        return;
      }

      const adminEmails = admins.map((admin) => admin.email);

      const subject = `🔔 Nouvelle demande d'inscription - ${registration.name}`;
      const html = this.generateAdminNotificationTemplate(registration);

      // Envoyer à tous les admins
      for (const email of adminEmails) {
        try {
          await emailService.sendEmail(email, subject, html);
        } catch (error) {
          console.error(
            `Erreur lors de l'envoi de notification à ${email}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la notification des admins:", error);
    }
  }

  /**
   * Générer le template HTML de notification pour les admins
   */
  private generateAdminNotificationTemplate(
    registration: Pick<
      UserRegistrationRequest,
      "id" | "email" | "name" | "requestedAt"
    >
  ): string {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173";
    const adminUrl = `${frontendUrl}/admin`;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle demande d'inscription</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #007bff; }
          .action-button { display: inline-block; background: #007bff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .action-button:hover { background: #0056b3; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Nouvelle demande d'inscription</h1>
          </div>

          <p>Une nouvelle demande d'inscription vient d'être soumise :</p>

          <div class="details">
            <h3>Informations du demandeur :</h3>
            <p><strong>Nom :</strong> ${registration.name}</p>
            <p><strong>Email :</strong> ${registration.email}</p>
            <p><strong>Date de demande :</strong> ${registration.requestedAt.toLocaleString(
              "fr-FR"
            )}</p>
          </div>

          <p>Veuillez examiner cette demande et l'approuver ou la rejeter selon les critères établis.</p>

          <div style="text-align: center;">
            <a href="${adminUrl}" class="action-button">
              📋 Accéder au panneau d'administration
            </a>
          </div>

          <div class="footer">
            <p>Cet email a été envoyé automatiquement par CineScan Connect.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Instance singleton du service d'inscription
export const registrationService = new RegistrationService();
