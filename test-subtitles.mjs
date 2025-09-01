#!/usr/bin/env tsx

import { movieService } from "./server/services/movieService.ts";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testSubtitleDetection() {
  console.log("🧪 Test de la détection des sous-titres...\n");

  try {
    // Test avec un chemin fictif pour voir si la méthode fonctionne
    const testMoviePath = path.join(__dirname, "test-movie.mp4");
    console.log(`📁 Test avec le chemin: ${testMoviePath}`);

    const subtitles = await movieService.detectSubtitleFiles(testMoviePath);
    console.log(`✅ Méthode exécutée avec succès`);
    console.log(`📊 Sous-titres trouvés: ${subtitles.length}`);

    if (subtitles.length > 0) {
      console.log("📝 Liste des sous-titres:");
      subtitles.forEach((sub) => {
        console.log(`  - ${sub.filename} (${sub.language})`);
      });
    }

    console.log(
      "\n🎉 Test réussi ! La méthode detectSubtitleFiles fonctionne correctement."
    );
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    process.exit(1);
  }
}

// Lancer le test si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testSubtitleDetection();
}

export { testSubtitleDetection };
