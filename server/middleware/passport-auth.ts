import passport from "passport";
import { Strategy as LocalStrategy, VerifyFunction } from "passport-local";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  VerifyCallback,
} from "passport-jwt";
// Using proper ES module imports as recommended in documentation
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../utils/prisma.js";
import { Request, Response, NextFunction } from "express";

// Types for better type safety
interface AuthError extends Error {
  status?: number;
}

interface JwtPayload {
  id: number;
  email: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Local strategy verification function
const verifyLocal: VerifyFunction = async (
  email: string,
  password: string,
  done: (
    error: Error | null,
    user?: Express.User | false,
    options?: { message: string }
  ) => void
): Promise<void> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate input
    if (!normalizedEmail || !password) {
      return done(null, false, { message: "Email and password are required" });
    }

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
        createdAt: true,
      },
    });

    if (!user) {
      return done(null, false, { message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return done(null, false, {
        message: "Account is deactivated. Contact administrator.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return done(null, false, { message: "Invalid email or password" });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    return done(null, userWithoutPassword);
  } catch (error) {
    console.error("Local auth error:", error);
    return done(null, false, {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

// Configure local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: false,
    },
    verifyLocal
  )
);

// JWT strategy verification function
const verifyJwt: VerifyCallback = async (
  payload: JwtPayload,
  done: (
    error: Error | null,
    user?: Express.User | false,
    info?: { message: string }
  ) => void
): Promise<void> => {
  try {
    console.log("🔐 JWT verification started");
    console.log("📋 Payload received:", {
      id: payload.id,
      email: payload.email,
      exp: payload.exp,
    });

    // Validate payload structure
    if (!payload.id || !payload.email) {
      console.log("❌ Invalid payload structure");
      return done(null, false, {
        message: "Invalid token - missing information",
      });
    }

    // Validate token expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("❌ Token expired:", new Date(payload.exp * 1000));
      return done(null, false, { message: "Token has expired" });
    }

    console.log("✅ Token structure and expiration OK");

    console.log("👤 Searching for user ID:", payload.id);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
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
      console.log("❌ User not found in database");
      return done(null, false, { message: "User not found" });
    }

    console.log("✅ User found:", {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
    });

    if (!user.isActive) {
      console.log("❌ User account deactivated");
      return done(null, false, { message: "Account is deactivated" });
    }

    if (user.email !== payload.email) {
      console.log("❌ Email mismatch:", {
        db: user.email,
        token: payload.email,
      });
      return done(null, false, { message: "Invalid token - email mismatch" });
    }

    console.log("✅ JWT verification successful");
    return done(null, user);
  } catch (error) {
    console.error("JWT auth error:", error);
    return done(
      error instanceof Error ? error : new Error("JWT verification failed"),
      false,
      { message: "Token verification failed" }
    );
  }
};

// Configure JWT strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        process.env.JWT_SECRET ?? "fallback-secret-change-in-production",
      issuer: process.env.JWT_ISSUER ?? "videotek-app",
      audience: process.env.JWT_AUDIENCE ?? "videotek-users",
      algorithms: ["HS256"],
      ignoreExpiration: false,
      passReqToCallback: false,
    },
    verifyJwt
  )
);

// Authentication middleware exports
export const passportLocalAuth = passport.authenticate("local", {
  session: false,
  failureMessage: true,
});

// Fixed Passport JWT authentication middleware
export const passportJwtAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: any, info: any) => {
      // Handle authentication errors
      if (err) {
        console.error("Passport JWT authentication error:", err);
        return res.status(500).json({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Authentication service error",
          },
        });
      }

      // Handle authentication failure
      if (!user) {
        const message = info?.message || "Invalid or expired token";
        console.log("🚫 JWT authentication failed:", message);
        console.log(
          "🚫 Request headers:",
          req.headers.authorization
            ? "Bearer token present"
            : "No Authorization header"
        );
        console.log(
          "🚫 Token preview:",
          req.headers.authorization?.substring(0, 50) + "..." || "No token"
        );

        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: message,
          },
        });
      }

      // Authentication successful
      req.user = user;
      next();
    }
  )(req, res, next);
};

// Role-based authorization middleware
export const requireRole = (
  roles: string | string[]
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Handle Passport authentication errors
    if (req.authInfo && req.authInfo.message) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: req.authInfo.message,
        },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    const user = req.user as PassportUser;
    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
      return;
    }

    next();
  };
};

// Active user verification middleware
export const requireActiveUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const user = req.user as PassportUser;
  if (!user.isActive) {
    res.status(403).json({
      success: false,
      error: {
        code: "USER_INACTIVE",
        message: "Account is deactivated",
      },
    });
    return;
  }

  next();
};

// Enhanced user interface for Passport.js
export interface PassportUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
}

// Passport initialization function
export const initializePassport = () => {
  // Ensure passport is properly imported and has the use method
  if (!passport || typeof passport.use !== "function") {
    throw new Error("Passport not properly imported or initialized");
  }

  // Ensure passport is properly initialized with all strategies
  if (!passport._strategies || Object.keys(passport._strategies).length === 0) {
    throw new Error("Passport strategies not configured");
  }

  return passport;
};

// Legacy compatibility alias
export const authenticateToken = passport.authenticate("jwt", {
  session: false,
  failureMessage: true,
});

// Optional authentication middleware
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token) {
    // If token is provided, try to authenticate
    passport.authenticate("jwt", { session: false })(req, res, next);
  } else {
    // If no token, continue without authenticated user
    next();
  }
};
