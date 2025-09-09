import fs from "fs";
import path from "path";

// Script de debug pour comprendre la reconstruction de l'état
const moviesFolder = "/Users/rusmirsadikovic/Downloads/films";

console.log("🔍 DEBUG - Analyse de l'état d'indexation");
console.log("==========================================");

// 1. Scanner tous les fichiers actuels
const currentFiles = new Set();
const scanDirectory = (dir) => {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
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
        const relativeFromMovies = path.relative(moviesFolder, fullPath);
        const dbFormatPath = `../../Downloads/films/${relativeFromMovies}`;
        currentFiles.add(dbFormatPath);
      }
    }
  }
};

console.log(`📁 Scanning: ${moviesFolder}`);
scanDirectory(moviesFolder);
console.log(`📊 Found ${currentFiles.size} files:`);
Array.from(currentFiles).forEach((file) => console.log(`   - ${file}`));

// 2. Vérifier chaque fichier
console.log("\n🔍 Vérification de l'existence des fichiers:");
for (const currentFile of currentFiles) {
  const relativePath = currentFile.replace("../../Downloads/films/", "");
  const absolutePath = path.join(moviesFolder, relativePath);
  const fileExists = fs.existsSync(absolutePath);

  console.log(`   📁 ${currentFile}`);
  console.log(`      -> ${absolutePath}`);
  console.log(`      -> EXISTS: ${fileExists}`);

  if (!fileExists) {
    console.log(`      ❌ FICHIER MANQUANT !`);
  } else {
    console.log(`      ✅ FICHIER PRÉSENT`);
  }
}

// 3. Reconstruction de l'état
console.log("\n🔄 Reconstruction de l'état:");
const newIndexState = new Set();

for (const currentFile of currentFiles) {
  const relativePath = currentFile.replace("../../Downloads/films/", "");
  const absolutePath = path.join(moviesFolder, relativePath);
  const fileExists = fs.existsSync(absolutePath);

  if (fileExists) {
    newIndexState.add(currentFile);
    console.log(`   ✅ Ajouté: ${currentFile}`);
  } else {
    console.log(`   ❌ Ignoré: ${currentFile}`);
  }
}

console.log(`\n📊 État final: ${newIndexState.size} fichiers`);
console.log("Contenu:", Array.from(newIndexState));
