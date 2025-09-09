import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Nettoyage final des orphelins
async function cleanOrphansFinal() {
  console.log("🧹 Nettoyage final des films orphelins...");

  try {
    // Récupérer tous les films avec leur chemin
    const allMovies = await prisma.movie.findMany({
      select: { id: true, title: true, localPath: true, filename: true },
    });

    console.log(`📊 ${allMovies.length} films trouvés en DB`);

    const moviesFolder = "/Users/rusmirsadikovic/Downloads/films";
    let cleaned = 0;

    for (const movie of allMovies) {
      if (!movie.localPath) continue;

      // Convertir le chemin DB en chemin absolu
      const relativePath = movie.localPath
        .replace("../../../../Downloads/films/", "")
        .replace("../../Downloads/films/", "");
      const absolutePath = path.join(moviesFolder, relativePath);

      const exists = fs.existsSync(absolutePath);

      console.log(`🔍 ${movie.title}: ${movie.localPath}`);
      console.log(`   -> ${absolutePath}`);
      console.log(`   -> EXISTS: ${exists}`);

      if (!exists) {
        console.log(`   🗑️ SUPPRESSION: ${movie.title}`);

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

        cleaned++;
      } else {
        console.log(`   ✅ GARDE: ${movie.title}`);
      }
    }

    console.log(`\n✅ ${cleaned} films orphelins supprimés`);

    // Vérifier l'état final
    const remainingMovies = await prisma.movie.findMany({
      select: { title: true, localPath: true },
    });

    console.log(`\n📊 État final:`);
    console.log(`   Films restants en DB: ${remainingMovies.length}`);
    remainingMovies.forEach((movie) => {
      console.log(`   - ${movie.title}`);
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphansFinal();
