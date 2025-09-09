const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

async function fixMoviePaths() {
  console.log("🔧 Correction des chemins de films existants...");

  try {
    // Récupérer tous les films avec des chemins relatifs (commençant par ../../)
    const movies = await prisma.movie.findMany({
      where: {
        localPath: {
          startsWith: "../../",
        },
      },
      select: {
        id: true,
        localPath: true,
        filename: true,
        title: true,
      },
    });

    console.log(`📊 ${movies.length} films avec des chemins relatifs trouvés`);

    for (const movie of movies) {
      const relativePath = movie.localPath.replace("../../", "");
      const absolutePath = path.resolve(process.cwd(), relativePath);

      console.log(`🔄 ${movie.title}:`);
      console.log(`   Ancien: ${movie.localPath}`);
      console.log(`   Nouveau: ${absolutePath}`);

      // Vérifier que le fichier existe au nouveau chemin
      try {
        await fs.promises.access(absolutePath);
        console.log(`   ✅ Fichier accessible`);

        // Mettre à jour le chemin dans la base
        await prisma.movie.update({
          where: { id: movie.id },
          data: { localPath: absolutePath },
        });

        console.log(`   💾 Chemin mis à jour`);
      } catch (error) {
        console.log(`   ❌ Fichier inaccessible: ${error.message}`);
      }

      console.log("");
    }

    console.log("✅ Correction terminée");
  } catch (error) {
    console.error("❌ Erreur lors de la correction:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMoviePaths();
