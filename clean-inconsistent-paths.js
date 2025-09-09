import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanInconsistentPaths() {
  console.log("🧹 Nettoyage des chemins incohérents...");

  try {
    const allMovies = await prisma.movie.findMany({
      select: { id: true, title: true, localPath: true },
    });

    console.log(`📊 ${allMovies.length} films trouvés en DB`);

    let cleaned = 0;
    for (const movie of allMovies) {
      if (movie.localPath && movie.localPath.startsWith("../../../../Downloads/films/")) {
        console.log(`🔄 Nettoyage chemin incohérent: ${movie.title}`);

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
      }
    }

    console.log(`✅ ${cleaned} films avec chemins incohérents supprimés`);

    // Vérifier l'état final
    const remainingMovies = await prisma.movie.findMany({
      select: { title: true, localPath: true },
    });

    console.log(`\n📊 État final:`);
    console.log(`   Films restants en DB: ${remainingMovies.length}`);
    remainingMovies.forEach(movie => {
      console.log(`   - ${movie.title}: ${movie.localPath}`);
    });

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanInconsistentPaths();
