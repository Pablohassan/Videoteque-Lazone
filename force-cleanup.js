import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fonction de nettoyage complet et forcé
async function forceCleanup() {
  console.log("🧹 Nettoyage complet et forcé");
  console.log("=============================");

  try {
    // 1. Scanner les fichiers actuels
    const moviesFolder = "/Users/rusmirsadikovic/Downloads/films";
    const currentFiles = new Set();

    if (fs.existsSync(moviesFolder)) {
      const files = fs.readdirSync(moviesFolder);

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
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
          const fullPath = path.join(moviesFolder, file);
          const relativePath = path.relative(process.cwd(), fullPath);
          const dbFormatPath = `../../${relativePath}`;
          currentFiles.add(dbFormatPath);
          console.log(`📁 Fichier présent: ${dbFormatPath}`);
        }
      }
    }

    console.log(`📊 ${currentFiles.size} fichiers trouvés dans le dossier`);

    // 2. Nettoyer la base de données
    console.log("🗑️ Nettoyage de la base de données...");

    // Récupérer tous les films
    const allMovies = await prisma.movie.findMany({
      select: { id: true, title: true, localPath: true, filename: true },
    });

    console.log(`🗄️ ${allMovies.length} films trouvés en DB`);

    let deletedCount = 0;
    for (const movie of allMovies) {
      if (!movie.localPath || !currentFiles.has(movie.localPath)) {
        console.log(`🗑️ Suppression du film orphelin: ${movie.title}`);

        // Supprimer les relations
        await prisma.movieGenre.deleteMany({
          where: { movieId: movie.id },
        });
        await prisma.movieActor.deleteMany({
          where: { movieId: movie.id },
        });
        await prisma.review.deleteMany({
          where: { movieId: movie.id },
        });

        // Supprimer le film
        await prisma.movie.delete({
          where: { id: movie.id },
        });

        deletedCount++;
      }
    }

    console.log(`✅ ${deletedCount} films orphelins supprimés de la DB`);

    // 3. Recréer l'état d'indexation
    console.log("📝 Recréation de l'état d'indexation...");

    const indexStateFile = path.join(process.cwd(), ".movie-index-state.json");
    const newState = {
      lastIndexedFiles: Array.from(currentFiles),
      lastIndexTime: Date.now(),
    };

    fs.writeFileSync(indexStateFile, JSON.stringify(newState, null, 2));
    console.log(
      `✅ État d\'indexation recréé avec ${currentFiles.size} fichiers`
    );

    // 4. Réindexer les fichiers actuels
    console.log("🎬 Réindexation des fichiers actuels...");

    if (currentFiles.size > 0) {
      // Importer dynamiquement le service d'indexation
      const { movieIndexingService } = await import(
        "./server/services/movieIndexingService.js"
      );

      const results = await movieIndexingService.indexAllMovies();
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(`✅ ${successful} films indexés avec succès`);
      if (failed > 0) {
        console.log(`❌ ${failed} films non indexés`);
      }
    }

    console.log("\n🎉 Nettoyage terminé avec succès!");
    console.log(`📊 État final: ${currentFiles.size} fichiers synchronisés`);
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  } finally {
    await prisma.$disconnect();
  }
}

forceCleanup();
