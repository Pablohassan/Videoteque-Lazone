/**
 * Logger utilitaire pour le côté client (React) utilisant loglevel
 * Bibliothèque légère et maintenue pour le logging côté client
 */

import log from "loglevel";

// Configuration des niveaux de loglevel
const levels = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5,
};

// Configuration du logger principal
const setupLogger = () => {
  // Configuration depuis localStorage (pour le développement)
  if (typeof window !== "undefined") {
    const storedLevel = localStorage.getItem("LOG_LEVEL");
    if (storedLevel) {
      const level = storedLevel.toUpperCase();
      if (level in levels) {
        log.setLevel(level as log.LogLevelDesc);
      }
    }
  }

  // Configuration depuis les variables d'environnement du build
  if (import.meta.env?.VITE_LOG_LEVEL) {
    const envLevel = import.meta.env.VITE_LOG_LEVEL.toUpperCase();
    if (envLevel in levels) {
      log.setLevel(envLevel as log.LogLevelDesc);
    }
  }

  // Format personnalisé avec timestamp et contexte
  const originalFactory = log.methodFactory;

  log.methodFactory = (methodName, logLevel, loggerName) => {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);

    return (...args) => {
      const timestamp = new Date().toISOString();
      const context = loggerName ? `[${loggerName}]` : "";
      const formattedArgs = [
        `[${timestamp}] ${methodName.toUpperCase()} ${context}`,
        ...args,
      ];

      rawMethod(...formattedArgs);
    };
  };

  // Re-appliquer le niveau après configuration du factory
  log.setLevel(log.getLevel());
};

// Initialiser le logger
setupLogger();

// Classe wrapper pour faciliter l'usage
export class ClientLogger {
  private logger: log.Logger;

  constructor(context: string = "CLIENT") {
    this.logger = log.getLogger(context);
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (error) {
      this.logger.error(message, error.message, ...args);
    } else {
      this.logger.error(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    this.logger.warn(message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.logger.debug(message, ...args);
  }

  trace(message: string, ...args: unknown[]): void {
    this.logger.trace(message, ...args);
  }

  setLevel(level: log.LogLevelDesc): void {
    this.logger.setLevel(level);
  }

  getLevel(): log.LogLevelDesc {
    return this.logger.getLevel();
  }

  child(context: string): ClientLogger {
    const newContext = this.logger.name
      ? `${this.logger.name}:${context}`
      : context;
    return new ClientLogger(newContext);
  }
}

// Instance globale du logger client
export const clientLogger = new ClientLogger();

// Factory functions pour les contextes spécifiques
export const createComponentLogger = () => new ClientLogger("COMPONENT");
export const createAPIServiceLogger = () => new ClientLogger("API");
export const createFormLogger = () => new ClientLogger("FORM");
export const createAuthLogger = () => new ClientLogger("AUTH");

// Fonctions de compatibilité pour remplacer les anciens console.log
export const componentLogger = createComponentLogger();
export const apiServiceLogger = createAPIServiceLogger();
export const formLogger = createFormLogger();
export const authLogger = createAuthLogger();

// Hook React pour utiliser le logger dans les composants
export const useLogger = (context: string) => {
  return new ClientLogger(context);
};

// Export de loglevel pour configuration avancée si nécessaire
export { log };
