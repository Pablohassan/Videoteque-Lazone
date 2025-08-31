import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

// Enhanced error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    path: string;
    method?: string;
  };
}

// Error details interface
interface ErrorDetails {
  field?: string;
  code?: string;
  target?: unknown;
  stack?: string;
  originalError?: string;
}

// Error classification
enum ErrorType {
  VALIDATION = "VALIDATION",
  DATABASE = "DATABASE",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL = "INTERNAL",
}

// Enhanced error handler with modern patterns
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with structured format
  const errorContext = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  console.error("🚨 Error intercepted:", errorContext);

  // Default error values
  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let message = "Internal server error";
  let details: ErrorDetails | undefined;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details as ErrorDetails;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Validation data is invalid";
    details = {
      field: error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", "),
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    errorCode = prismaError.errorCode;
    message = prismaError.message;
    details = prismaError.details;
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Invalid data for database";
  } else if (isJsonSyntaxError(error)) {
    statusCode = 400;
    errorCode = "INVALID_JSON";
    message = "Invalid JSON format";
  } else if (isPayloadTooLargeError(error)) {
    statusCode = 413;
    errorCode = "PAYLOAD_TOO_LARGE";
    message = "Data too large";
  }

  // Add development details
  if (process.env.NODE_ENV === "development") {
    details = {
      ...details,
      stack: error.stack,
      originalError: error.message,
    };
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      details: details as Record<string, unknown> | undefined,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  res.status(statusCode).json(errorResponse);
};

// Prisma error handler
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
  let statusCode = 400;
  let errorCode = "DATABASE_ERROR";
  let message = "Database error";
  let details: ErrorDetails | undefined;

  switch (error.code) {
    case "P2002":
      statusCode = 409;
      errorCode = "ALREADY_EXISTS";
      message = "Resource with this data already exists";
      details = { field: error.meta?.target as string };
      break;
    case "P2025":
      statusCode = 404;
      errorCode = "NOT_FOUND";
      message = "Resource not found";
      break;
    case "P2003":
      statusCode = 400;
      errorCode = "VALIDATION_ERROR";
      message = "Reference constraint violation";
      break;
    default:
      details = { code: error.code };
  }

  return { statusCode, errorCode, message, details };
};

// JSON syntax error checker
const isJsonSyntaxError = (error: Error): boolean => {
  return error instanceof SyntaxError && "body" in error;
};

// Payload too large error checker
const isPayloadTooLargeError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return message.includes("limit") || message.includes("size");
};

// Async error handler wrapper with enhanced type safety
export const asyncErrorHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
): ((req: T, res: U, next: NextFunction) => void) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  res.status(404).json(errorResponse);
};

// Request timeout middleware
export const createTimeoutMiddleware = (timeoutMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            code: "REQUEST_TIMEOUT",
            message: "Request timeout",
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timeout));
    next();
  };
};
