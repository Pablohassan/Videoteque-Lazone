#!/usr/bin/env tsx

import { movieWatcherService } from "../services/movieWatcherService.js";
import { prisma } from "../utils/prisma.js";

/**
 * Script pour démarrer la surveillance automatique des fichiers de films
 * Utilise Chokidar pour détecter les nouveaux fichiers et les indexer automatiquement
 */

// Gestion propre de l'arrêt
process.on("SIGINT", async () => {
  console.log("\n🛑 Signal d'arrêt reçu, arrêt de la surveillance...");
  try {
    await movieWatcherService.stop();
  } catch (error) {
    console.error("❌ Erreur lors de l'arrêt de la surveillance:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Signal de terminaison reçu, arrêt de la surveillance...");
  try {
    await movieWatcherService.stop();
  } catch (error) {
    console.error("❌ Erreur lors de l'arrêt de la surveillance:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
});

// Fonction principale
async function main() {
  try {
    console.log(
      "🎬 Démarrage du service de surveillance automatique des films"
    );
    console.log("==================================================");

    // Démarrer la surveillance
    await movieWatcherService.start();

    console.log("\n✅ Service de surveillance démarré avec succès!");
    console.log(
      "📁 Les nouveaux fichiers seront automatiquement détectés et indexés"
    );
    console.log("💡 Appuyez sur Ctrl+C pour arrêter le service");

    // Garder le processus en vie
    process.stdin.resume();
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du service:", error);

    if (error instanceof Error) {
      if (error.name === "AppError") {
        const appError = error as Error & {
          code?: string;
          statusCode?: number;
          details?: unknown;
        };
        console.error(`Code d'erreur: ${appError.code}`);
        console.error(`Status HTTP: ${appError.statusCode}`);
        if (appError.details) {
          console.error("Détails:", appError.details);
        }
      }
    }

    await prisma.$disconnect();
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on("uncaughtException", async (error) => {
  console.error("💥 Erreur non capturée:", error);
  try {
    await movieWatcherService.stop();
  } catch (stopError) {
    console.error("❌ Erreur lors de l'arrêt d'urgence:", stopError);
  } finally {
    await prisma.$disconnect();
    process.exit(1);
  }
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Promesse rejetée non gérée:", reason);
  try {
    await movieWatcherService.stop();
  } catch (stopError) {
    console.error("❌ Erreur lors de l'arrêt d'urgence:", stopError);
  } finally {
    await prisma.$disconnect();
    process.exit(1);
  }
});

// Lancer le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as startMovieWatcher };
