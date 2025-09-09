import fs from "fs";
import path from "path";
import { movieIndexingService } from "../services/movieIndexingService.js";
import { prisma } from "../utils/prisma.js";

/**
 * Script pour synchroniser manuellement la base de données avec le dossier de films
 * Supprime les films orphelins et met à jour l'état d'indexation
 */

// Fonction de synchronisation complète de l'état d'indexation
const synchronizeIndexState = async (): Promise<Set<string>> => {
  const moviesFolder = movieIndexingService.getMoviesFolderAbsolutePath();
  const currentFiles = new Set<string>();

  console.log("🔄 Synchronisation complète de l'état d'indexation...");

  const scanDirectory = (dir: string) => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (
          [
            ".mp4",
            ".mkv",
            ".avi",
            ".mov",
            ".wmv",
            ".flv",
            ".webm",
            ".m4v",
          ].includes(ext)
        ) {
          // Utiliser le même format que la DB : ../../Downloads/films/...
          const relativeFromMovies = path.relative(moviesFolder, fullPath);
          const dbFormatPath = `../../Downloads/films/${relativeFromMovies}`;
          currentFiles.add(dbFormatPath);
        }
      }
    }
  };

  scanDirectory(moviesFolder);
  console.log(`📋 État synchronisé: ${currentFiles.size} fichiers trouvés`);

  return currentFiles;
};

// Fonction de nettoyage des films orphelins
const cleanOrphanedMovies = async (
  currentFiles: Set<string>
): Promise<number> => {
  console.log("🧹 Nettoyage des films orphelins...");

  // Récupérer tous les films qui ont encore un localPath
  const dbMovies = await prisma.movie.findMany({
    where: { localPath: { not: null } },
    select: { id: true, title: true, localPath: true, filename: true },
  });

  let orphanedCount = 0;
  for (const movie of dbMovies) {
    if (!movie.localPath || !currentFiles.has(movie.localPath)) {
      // Supprimer complètement le film orphelin
      await prisma.movieGenre.deleteMany({
        where: { movieId: movie.id },
      });
      await prisma.movieActor.deleteMany({
        where: { movieId: movie.id },
      });
      await prisma.review.deleteMany({
        where: { movieId: movie.id },
      });

      await prisma.movie.delete({
        where: { id: movie.id },
      });

      console.log(`🗑️ Film orphelin supprimé: ${movie.title}`);
      orphanedCount++;
    }
  }

  return orphanedCount;
};

// Fonction de mise à jour de l'état d'indexation
const updateIndexState = async (currentFiles: Set<string>): Promise<void> => {
  const indexStateFile = path.join(process.cwd(), ".movie-index-state.json");

  const newState = {
    lastIndexedFiles: Array.from(currentFiles),
    lastIndexTime: Date.now(),
  };

  fs.writeFileSync(indexStateFile, JSON.stringify(newState, null, 2));
  console.log(`💾 État d'indexation mis à jour: ${currentFiles.size} fichiers`);
};

// Fonction principale
async function main() {
  try {
    console.log("🎬 Synchronisation manuelle de la base de données");
    console.log("==================================================");

    // 1. Synchroniser l'état d'indexation
    const currentFiles = await synchronizeIndexState();

    // 2. Nettoyer les films orphelins
    const orphanedCount = await cleanOrphanedMovies(currentFiles);

    // 3. Mettre à jour l'état d'indexation
    await updateIndexState(currentFiles);

    // 4. Résumé
    console.log("\n🎉 Synchronisation terminée!");
    console.log(`📊 Fichiers présents: ${currentFiles.size}`);
    console.log(`🗑️ Films orphelins supprimés: ${orphanedCount}`);
    console.log("✅ Base de données synchronisée avec le dossier");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as syncDatabase };
