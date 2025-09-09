import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fonction pour vérifier la synchronisation
async function checkSynchronization() {
  console.log(
    "🔍 Vérification de la synchronisation base de données <-> dossier"
  );
  console.log(
    "================================================================"
  );

  try {
    // 1. Lire l'état d'indexation
    const indexStateFile = path.join(process.cwd(), ".movie-index-state.json");
    let indexState = { lastIndexedFiles: [] };

    if (fs.existsSync(indexStateFile)) {
      indexState = JSON.parse(fs.readFileSync(indexStateFile, "utf-8"));
      console.log(
        `📊 État d'indexation: ${indexState.lastIndexedFiles.length} fichiers`
      );
    } else {
      console.log("❌ Fichier .movie-index-state.json non trouvé");
    }

    // 2. Compter les films en base de données
    const dbMovies = await prisma.movie.findMany({
      where: { localPath: { not: null } },
      select: { id: true, title: true, localPath: true, filename: true },
    });

    console.log(`🗄️  Films en base de données: ${dbMovies.length}`);

    // 3. Scanner le dossier actuel
    const moviesFolder = "/Users/rusmirsadikovic/Downloads/films";
    const currentFiles = [];

    if (fs.existsSync(moviesFolder)) {
      const scanDirectory = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath); // Récursion pour les sous-dossiers
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
              // Utiliser la même logique que dans le serveur
              const relativeFromMovies = path.relative(moviesFolder, fullPath);
              const dbFormatPath = `../../Downloads/films/${relativeFromMovies}`;
              currentFiles.push(dbFormatPath);

              // Debug: Afficher le mapping
              console.log(`   ${item} -> ${dbFormatPath}`);
            }
          }
        }
      };

      scanDirectory(moviesFolder);
    }

    console.log(`📁 Fichiers dans le dossier: ${currentFiles.length}`);

    // 4. Comparer les états
    const indexSet = new Set(indexState.lastIndexedFiles);
    const currentSet = new Set(currentFiles);

    const missingInIndex = currentFiles.filter((f) => !indexSet.has(f));
    const extraInIndex = Array.from(indexSet).filter((f) => !currentSet.has(f));

    const missingInDB = currentFiles.filter(
      (f) => !dbMovies.some((m) => m.localPath === f)
    );
    const extraInDB = dbMovies.filter(
      (m) => m.localPath && !currentSet.has(m.localPath)
    );

    console.log("\n📋 Comparaisons:");
    console.log(`   Fichiers manquants dans l'index: ${missingInIndex.length}`);
    console.log(`   Fichiers en trop dans l'index: ${extraInIndex.length}`);
    console.log(`   Fichiers manquants en DB: ${missingInDB.length}`);
    console.log(`   Fichiers en trop en DB: ${extraInDB.length}`);

    if (extraInIndex.length > 0) {
      console.log("\n❌ Fichiers en trop dans l'index:");
      extraInIndex.forEach((f) => console.log(`   - ${f}`));
    }

    if (extraInDB.length > 0) {
      console.log("\n❌ Fichiers en trop en DB:");
      extraInDB.forEach((m) => console.log(`   - ${m.title}: ${m.localPath}`));
    }

    if (missingInDB.length > 0) {
      console.log("\n✅ Fichiers manquants en DB (à indexer):");
      missingInDB.forEach((f) => console.log(`   - ${f}`));
    }

    // 5. Résumé
    const isSynced = extraInIndex.length === 0 && extraInDB.length === 0;
    console.log(
      `\n🎯 État de synchronisation: ${
        isSynced ? "✅ SYNCHRONISÉ" : "❌ DÉSYNCHRONISÉ"
      }`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSynchronization();
