/**
 * Logger utilitaire pour l'application utilisant Winston
 * Bibliothèque de logging professionnelle et maintenue en 2025
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// Configuration des niveaux de log Winston
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
  trace: "magenta",
};

winston.addColors(colors);

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const ctx = context ? `[${context}]` : "";
    const metaStr =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
  })
);

// Format console avec couleurs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const ctx = context ? `[${context}]` : "";
    const metaStr =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
  })
);

// Configuration des transports
const transports: winston.transport[] = [
  // Log console
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || "info",
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
];

// Log fichier en production
if (
  process.env.NODE_ENV === "production" ||
  process.env.LOG_TO_FILE === "true"
) {
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), "logs");

  transports.push(
    // Log général avec rotation quotidienne
    new DailyRotateFile({
      filename: path.join(logDir, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      level: "info",
      format: customFormat,
    }),

    // Log erreurs séparé
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      level: "error",
      format: customFormat,
    })
  );
}

// Création du logger Winston
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  format: customFormat,
  transports,
  exitOnError: false,
});

// Classe wrapper pour faciliter l'usage
export class AppLogger {
  private context: string;

  constructor(context: string = "APP") {
    this.context = context;
  }

  private log(
    level: keyof typeof levels,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    winstonLogger.log(level, message, { context: this.context, ...meta });
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const logMeta = error
      ? { error: error.message, stack: error.stack, ...meta }
      : meta;
    this.log("error", message, logMeta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.log("trace", message, meta);
  }

  child(context: string): AppLogger {
    return new AppLogger(`${this.context}:${context}`);
  }
}

// Instance globale du logger
export const logger = new AppLogger();

// Factory functions pour les contextes spécifiques
export const createMovieLogger = () => new AppLogger("MOVIES");
export const createWatcherLogger = () => new AppLogger("WATCHER");
export const createAdminLogger = () => new AppLogger("ADMIN");
export const createAPIServiceLogger = () => new AppLogger("API");
export const createAuthLogger = () => new AppLogger("AUTH");

// Fonctions de compatibilité pour remplacer les anciens console.log
export const movieLogger = createMovieLogger();
export const watcherLogger = createWatcherLogger();
export const adminLogger = createAdminLogger();
export const apiServiceLogger = createAPIServiceLogger();
export const authLogger = createAuthLogger();

// Export de winston pour configuration avancée si nécessaire
export { winstonLogger as winston };
