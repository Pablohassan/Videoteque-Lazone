import { Router } from "express";
import { authService } from "../services/authService.js";
import { validateBody } from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../utils/schemas.js";
import { AuthRequest } from "../types/index.js";

const router = Router();

// POST /api/auth/register
router.post("/register", validateBody(registerSchema), async (req, res) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: result,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
});

// POST /api/auth/login
router.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      message: "Connexion réussie",
      data: result,
    });
  } catch (error: unknown) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await authService.getUserById(req.user!.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// POST /api/auth/verify
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token requis",
      });
    }

    const decoded = authService.verifyToken(token);

    res.json({
      success: true,
      message: "Token valide",
      data: { decoded },
    });
  } catch (error: unknown) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
});

export default router;
