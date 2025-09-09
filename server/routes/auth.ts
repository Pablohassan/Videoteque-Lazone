import { Router, Request, Response } from "express";
import { authService } from "../services/authService.js";
import { registrationService } from "../services/registrationService.js";
import { validateBody } from "../middleware/validation.js";
import { registerSchema } from "../schemas/auth.js";
import { asyncErrorHandler } from "../middleware/errorHandler.js";
import {
  passportJwtAuth,
  requireRole,
  type PassportUser,
} from "../middleware/passport-auth.js";

const router = Router();

// ===== USER REGISTRATION =====
router.post(
  "/register",
  validateBody(registerSchema),
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, name, password } = req.body;

    const result = await authService.register({ email, name, password });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        message: "Registration successful",
      },
    });
  })
);

// ===== USER REGISTRATION REQUEST =====
router.post(
  "/register-request",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Email et nom sont requis",
        },
      });
      return;
    }

    const result = await registrationService.createRegistrationRequest({
      email,
      name,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: "Demande d'inscription créée avec succès",
    });
  })
);

// ===== PASSWORD RESET REQUEST =====
router.post(
  "/forgot-password",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_EMAIL",
          message: "Email requis",
        },
      });
      return;
    }

    const result = await authService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      data: result,
      message: "Si cet email existe, un lien de réinitialisation a été envoyé",
    });
  })
);

// ===== PASSWORD RESET =====
router.post(
  "/reset-password",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Token et nouveau mot de passe requis",
        },
      });
      return;
    }

    const result = await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      data: result,
      message: "Mot de passe réinitialisé avec succès",
    });
  })
);

// ===== USER LOGIN =====
router.post(
  "/login",
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
      return;
    }

    try {
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
        message: "Login successful",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur d'authentification";
      res.status(401).json({
        success: false,
        message,
      });
    }
  })
);

// ===== TOKEN VERIFICATION =====
router.get(
  "/verify",
  passportJwtAuth,
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    // If we reach here, the token is valid
    const user = req.user as PassportUser;

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: "Token is valid",
      },
    });
  })
);

// ===== USER PROFILE =====
router.get(
  "/profile",
  passportJwtAuth,
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as PassportUser).id;

    const user = await authService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

// ===== PASSWORD CHANGE =====
router.post(
  "/change-password",
  passportJwtAuth,
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req.user as PassportUser).id;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_PASSWORDS",
          message: "Current and new passwords are required",
        },
      });
      return;
    }

    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      data: result,
      message: "Password changed successfully",
    });
  })
);

// ===== USER LOGOUT =====
router.post(
  "/logout",
  passportJwtAuth,
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as PassportUser).id;

    const result = await authService.logout(userId);

    res.status(200).json({
      success: true,
      data: result,
      message: "Logout successful",
    });
  })
);

// ===== TOKEN REFRESH =====
router.post(
  "/refresh",
  passportJwtAuth,
  asyncErrorHandler(async (req: Request, res: Response): Promise<void> => {
    const currentToken = req.headers.authorization?.replace("Bearer ", "");

    if (!currentToken) {
      res.status(400).json({
        success: false,
        error: {
          code: "MISSING_TOKEN",
          message: "Token is required",
        },
      });
      return;
    }

    const result = await authService.refreshToken(currentToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        message: "Token refreshed successfully",
      },
    });
  })
);

export default router;
