// Using proper ES module imports as recommended in documentation
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma.js";
import { createConflictError, createValidationError } from "../utils/errors.js";
import { USER_ROLES, USER_STATUS } from "../constants/validation.js";
import type { RegisterRequest } from "../schemas/auth.js";
import type { User } from "@prisma/client";

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterRequest): Promise<{
    user: Pick<User, "id" | "email" | "name" | "role" | "createdAt">;
    token: string;
  }> {
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
  async login(
    email: string,
    password: string
  ): Promise<{
    user: Pick<
      User,
      "id" | "email" | "name" | "role" | "isActive" | "lastLoginAt"
    >;
    token: string;
  }> {
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
}

export const authService = new AuthService();
