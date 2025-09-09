import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Fonction de nettoyage simple des orphelins
async function cleanOrphans() {
  console.log('🧹 Nettoyage des films orphelins...');

  try {
    // Récupérer tous les films avec leur chemin
    const allMovies = await prisma.movie.findMany({
      where: { localPath: { not: null } },
      select: { id: true, title: true, localPath: true, filename: true },
    });

    console.log(`📊 ${allMovies.length} films trouvés en DB`);

    const moviesFolder = '/Users/rusmirsadikovic/Downloads/films';
    let cleaned = 0;

    for (const movie of allMovies) {
      if (!movie.localPath) continue;

      // Convertir le chemin DB en chemin absolu
      const relativePath = movie.localPath.replace('../../../../Downloads/films/', '');
      const absolutePath = path.join(moviesFolder, relativePath);

      if (!fs.existsSync(absolutePath)) {
        console.log(`🗑️ Supprimant film orphelin: ${movie.title}`);

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

    console.log(`✅ ${cleaned} films orphelins supprimés`);

    // Maintenant réindexer les films restants
    console.log('🎬 Réindexation des films présents...');

    const existingMovies = await prisma.movie.findMany({
      select: { title: true, localPath: true },
    });

    console.log(`📊 ${existingMovies.length} films restants en DB:`);
    existingMovies.forEach(movie => {
      console.log(`   - ${movie.title}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphans();
