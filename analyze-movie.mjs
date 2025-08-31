const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function analyzeMovie() {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: 1 },
    });

    if (!movie) {
      console.log("Film avec ID 1 non trouvé");
      return;
    }

    console.log("Informations du film:");
    console.log("ID:", movie.id);
    console.log("Titre:", movie.title);
    console.log("Année:", movie.year);
    console.log("Chemin du fichier:", movie.filePath);
    console.log("Nom du fichier:", movie.filename);
    console.log("Taille du fichier:", movie.fileSize, "bytes");

    return movie;
  } catch (error) {
    console.error("Erreur lors de la récupération du film:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMovie();
