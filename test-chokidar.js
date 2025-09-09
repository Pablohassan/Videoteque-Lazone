import fs from 'fs';
import path from 'path';

// Test simple pour vérifier si Chokidar détecte les suppressions
const moviesFolder = '/Users/rusmirsadikovic/Downloads/films';

// Lister les fichiers avant
console.log('📋 Fichiers avant suppression:');
const filesBefore = fs.readdirSync(moviesFolder).filter(f =>
  ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'].includes(path.extname(f).toLowerCase())
);
console.log(filesBefore);

if (filesBefore.length > 0) {
  const fileToDelete = path.join(moviesFolder, filesBefore[0]);
  console.log(`\n🗑️ Suppression du fichier: ${filesBefore[0]}`);
  console.log(`📁 Chemin complet: ${fileToDelete}`);

  // Supprimer le fichier
  fs.unlinkSync(fileToDelete);
  console.log('✅ Fichier supprimé');

  // Attendre un peu pour que Chokidar détecte
  console.log('⏳ Attente de la détection Chokidar...');

  setTimeout(() => {
    console.log('\n📋 Fichiers après suppression:');
    const filesAfter = fs.readdirSync(moviesFolder).filter(f =>
      ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'].includes(path.extname(f).toLowerCase())
    );
    console.log(filesAfter);
    console.log(`\n📊 Résultat: ${filesBefore.length - 1} fichiers restants`);
  }, 2000);
} else {
  console.log('❌ Aucun fichier à supprimer');
}
