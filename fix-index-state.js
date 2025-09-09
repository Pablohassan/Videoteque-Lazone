import fs from "fs";
import path from "path";

// Corriger l'état d'indexation pour utiliser le bon format de chemins
const indexStateFile = path.join(process.cwd(), ".movie-index-state.json");

console.log("🔧 Correction de l'état d'indexation...");

if (fs.existsSync(indexStateFile)) {
  const stateData = JSON.parse(fs.readFileSync(indexStateFile, "utf-8"));

  console.log(
    `📊 ${stateData.lastIndexedFiles.length} fichiers dans l'état actuel`
  );

  // Corriger les chemins : remplacer ../../ par ../../../../
  const correctedFiles = stateData.lastIndexedFiles.map((filePath) => {
    if (filePath.startsWith("../../Downloads/films/")) {
      const corrected = filePath.replace(
        "../../Downloads/films/",
        "../../../../Downloads/films/"
      );
      console.log(`🔄 ${filePath}`);
      console.log(`   -> ${corrected}`);
      return corrected;
    }
    return filePath;
  });

  // Sauvegarder le nouvel état
  const newState = {
    lastIndexedFiles: correctedFiles,
    lastIndexTime: stateData.lastIndexTime,
  };

  fs.writeFileSync(indexStateFile, JSON.stringify(newState, null, 2));
  console.log("✅ État d'indexation corrigé");

  console.log("\n📋 État final:");
  correctedFiles.forEach((file) => console.log(`   - ${file}`));
} else {
  console.log("❌ Fichier .movie-index-state.json non trouvé");
}
