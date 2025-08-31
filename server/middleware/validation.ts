import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";

// Types for better error handling
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

interface ValidationResult {
  success: boolean;
  message: string;
  errors?: ValidationError[];
}

// Generic validation middleware factory
const createValidationMiddleware = (
  schema: ZodSchema,
  source: "body" | "query" | "params",
  errorMessage: string
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);

      // Replace original data with validated data for type safety
      if (source === "query") {
        (req as Request & { query: typeof validatedData }).query =
          validatedData;
      } else if (source === "body") {
        (req as Request & { body: typeof validatedData }).body = validatedData;
      } else if (source === "params") {
        (req as Request & { params: typeof validatedData }).params =
          validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        const result: ValidationResult = {
          success: false,
          message: errorMessage,
          errors: validationErrors,
        };

        res.status(400).json(result);
        return;
      }

      // Handle unexpected errors
      console.error("Validation middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Validation error occurred",
      });
    }
  };
};

// Body validation middleware
export const validateBody = (
  schema: ZodSchema
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return createValidationMiddleware(schema, "body", "Invalid request body");
};

// Query parameters validation middleware
export const validateQuery = (
  schema: ZodSchema
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return createValidationMiddleware(
    schema,
    "query",
    "Invalid query parameters"
  );
};

// Route parameters validation middleware
export const validateParams = (
  schema: ZodSchema
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return createValidationMiddleware(
    schema,
    "params",
    "Invalid route parameters"
  );
};

// Utility function for manual validation
export const validateData = <T>(schema: ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
};
