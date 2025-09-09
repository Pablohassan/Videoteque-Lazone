import { movieIndexingService } from "./server/services/movieIndexingService.js";

async function indexExisting() {
  try {
    console.log("🔄 Indexation des fichiers existants...");
    const results = await movieIndexingService.indexAllMovies();

    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`✅ ${success} fichiers indexés avec succès`);
    console.log(`❌ ${failed} fichiers en échec`);

    if (failed > 0) {
      console.log("\n📋 Détails des échecs:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.filename}: ${r.error}`);
        });
    }
  } catch (error) {
    console.error("💥 Erreur lors de l'indexation:", error);
  }
}

indexExisting();
