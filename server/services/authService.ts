// Using proper ES module imports as recommended in documentation
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import { createConflictError, createValidationError } from "../utils/errors.js";
import { USER_ROLES, USER_STATUS } from "../constants/validation.js";
import type { RegisterRequest } from "../schemas/auth.js";
import type { User } from "@prisma/client";
import type {
  RegisterResponse,
  LoginResponse,
  PasswordResetResponse,
  TokenVerificationResponse,
} from "../types/auth.js";

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    // Normaliser l'email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw createConflictError("Un utilisateur avec cet email existe déjà");
    }

    // Valider le mot de passe
    if (!data.password || data.password.length < 8) {
      throw createValidationError(
        "Le mot de passe doit contenir au moins 8 caractères"
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: data.name.trim(),
        password: hashedPassword,
        role: USER_ROLES.USER, // Rôle par défaut
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

    // Générer le token JWT
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Connexion utilisateur (utilise Passport.js en arrière-plan)
   * Cette méthode est maintenant principalement utilisée pour la génération de tokens
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Normaliser l'email
    const normalizedEmail = email.toLowerCase().trim();

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw createValidationError("Email ou mot de passe incorrect");
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      throw createValidationError(
        "Compte désactivé. Contactez l'administrateur."
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createValidationError("Email ou mot de passe incorrect");
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Générer le token JWT
    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Connexion OAuth (Google, etc.)
   */
  async oauthLogin(
    profile: {
      emails?: Array<{ value: string }>;
      displayName?: string;
      name?: { givenName?: string };
    },
    provider: string
  ) {
    if (!profile.emails || !profile.emails[0]) {
      throw createValidationError(`Email ${provider} non disponible`);
    }

    const email = profile.emails[0].value.toLowerCase();
    const name =
      profile.displayName ||
      profile.name?.givenName ||
      `Utilisateur ${provider}`;

    // Rechercher l'utilisateur existant
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    if (user) {
      // Utilisateur existant - vérifier qu'il est actif
      if (!user.isActive) {
        throw createValidationError("Compte désactivé");
      }

      // Mettre à jour la dernière connexion
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      // Créer un nouvel utilisateur
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: "", // Pas de mot de passe pour les utilisateurs OAuth
          role: USER_ROLES.USER,
          isActive: USER_STATUS.ACTIVE,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
        },
      });
    }

    // Générer le token JWT
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Rafraîchir un token JWT
   */
  async refreshToken(currentToken: string) {
    // Vérifier le token actuel
    const decoded = jwt.verify(currentToken, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };

    if (!decoded.id || !decoded.email) {
      throw createValidationError("Token invalide");
    }

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw createValidationError("Utilisateur non trouvé ou compte désactivé");
    }

    // Vérifier que l'email correspond
    if (user.email !== decoded.email) {
      throw createValidationError("Token invalide");
    }

    // Générer un nouveau token
    const newToken = this.generateToken(user);

    return { user, token: newToken };
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    // Valider le nouveau mot de passe
    if (!newPassword || newPassword.length < 8) {
      throw createValidationError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères"
      );
    }

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      throw createValidationError("Utilisateur non trouvé");
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw createValidationError("Mot de passe actuel incorrect");
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: "Mot de passe modifié avec succès" };
  }

  /**
   * Déconnexion (invalidation du token côté client)
   */
  async logout(userId: number) {
    // En production, vous pourriez ajouter le token à une liste noire
    // ou utiliser Redis pour invalider les tokens

    // Pour l'instant, nous retournons juste un message de succès
    // La vraie invalidation se fait côté client en supprimant le token
    return { message: "Déconnexion réussie" };
  }

  /**
   * Obtenir les informations d'un utilisateur
   */
  async getUserById(
    id: number
  ): Promise<Pick<
    User,
    "id" | "email" | "name" | "role" | "isActive" | "lastLoginAt" | "createdAt"
  > | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw createValidationError("Utilisateur non trouvé");
    }

    return user;
  }

  /**
   * Générer un token JWT sécurisé
   */
  generateToken(user: {
    id: number;
    email: string;
    name: string;
    role: string;
  }): string {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 jours
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: "HS256",
      issuer: process.env.JWT_ISSUER || "videotek-app",
      audience: process.env.JWT_AUDIENCE || "videotek-users",
    });
  }

  /**
   * Vérifier un token JWT
   */
  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      throw createValidationError("Token invalide ou expiré");
    }
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, isActive: true },
    });

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    // On retourne toujours le même message
    if (!user || !user.isActive) {
      return {
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé",
      };
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = this.generateResetToken(user.id);
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Envoyer l'email de réinitialisation
    setImmediate(async () => {
      try {
        await this.sendPasswordResetEmail(user.name, normalizedEmail, resetUrl);
      } catch (error) {
        console.error(
          "Erreur lors de l'envoi d'email de réinitialisation:",
          error
        );
      }
    });

    return {
      message: "Si cet email existe, un lien de réinitialisation a été envoyé",
    };
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
        type: string;
      };

      if (decoded.type !== "password_reset") {
        throw createValidationError("Token invalide");
      }

      const userId = decoded.userId;

      // Vérifier que l'utilisateur existe et est actif
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw createValidationError("Utilisateur non trouvé ou inactif");
      }

      // Valider le nouveau mot de passe
      if (!newPassword || newPassword.length < 8) {
        throw createValidationError(
          "Le mot de passe doit contenir au moins 8 caractères"
        );
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      return { message: "Mot de passe réinitialisé avec succès" };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createValidationError("Token invalide ou expiré");
      }
      throw error;
    }
  }

  /**
   * Générer un token de réinitialisation de mot de passe
   */
  private generateResetToken(userId: number): string {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const payload = {
      userId,
      type: "password_reset",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 heure
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: "HS256",
    });
  }

  /**
   * Envoyer l'email de réinitialisation de mot de passe
   */
  private async sendPasswordResetEmail(
    name: string,
    email: string,
    resetUrl: string
  ): Promise<void> {
    const subject =
      "🔐 Réinitialisation de votre mot de passe - CineScan Connect";
    const html = this.generatePasswordResetTemplate(name, resetUrl);

    await import("../services/emailService.js").then(({ emailService }) => {
      return emailService.sendEmail(email, subject, html);
    });
  }

  /**
   * Générer le template HTML pour l'email de réinitialisation
   */
  private generatePasswordResetTemplate(
    name: string,
    resetUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; }
          .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e9ecef; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #dc3545; }
          .logo { font-size: 28px; font-weight: bold; color: #dc3545; margin-bottom: 10px; }
          .subtitle { color: #6c757d; font-size: 16px; }
          .reset-button { display: inline-block; background: linear-gradient(135deg, #dc3545, #c82333); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 30px 0; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3); transition: all 0.3s ease; }
          .reset-button:hover { box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4); transform: translateY(-2px); }
          .instructions { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 8px; margin: 30px 0; }
          .instructions h3 { color: #721c24; margin-top: 0; margin-bottom: 15px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎬 CineScan Connect</div>
            <div class="subtitle">Réinitialisation de mot de passe</div>
          </div>

          <h1 style="text-align: center; color: #2c3e50;">Bonjour ${name}</h1>

          <p style="text-align: center; font-size: 16px; color: #6c757d;">
            Vous avez demandé la réinitialisation de votre mot de passe.
            Cliquez sur le bouton ci-dessous pour procéder.
          </p>

          <div class="warning">
            <strong>⚠️ Sécurité :</strong> Ce lien est valide pendant 1 heure seulement.
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </div>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">
              🔐 Réinitialiser mon mot de passe
            </a>
          </div>

          <div class="instructions">
            <h3>📋 Instructions :</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Cliquez sur le bouton "Réinitialiser mon mot de passe" ci-dessus</li>
              <li>Saisissez votre nouveau mot de passe</li>
              <li>Confirmez la modification</li>
              <li>Connectez-vous avec votre nouveau mot de passe</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6c757d;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${resetUrl}
            </p>
          </div>

          <div class="footer">
            <p>
              Cet email a été envoyé automatiquement par CineScan Connect.<br>
              Si vous n'avez pas demandé cette réinitialisation, votre mot de passe reste inchangé.
            </p>
            <p style="margin-top: 15px;">
              <strong>CineScan Connect</strong> - Votre cinéma à portée de main 🎬
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const authService = new AuthService();
