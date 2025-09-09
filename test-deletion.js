import fs from 'fs';
import path from 'path';

// Chemin vers le dossier de films
const moviesFolder = '/Users/rusmirsadikovic/Downloads/films';

// Fichier à supprimer pour tester
const testFile = path.join(moviesFolder, 'die.hard.1988.720p.bluray.x264-nezu.mkv');

console.log('🧪 Test de suppression de fichier');
console.log(`📁 Fichier à supprimer: ${testFile}`);

// Vérifier si le fichier existe
if (fs.existsSync(testFile)) {
  console.log('✅ Le fichier existe, suppression en cours...');

  // Supprimer le fichier
  fs.unlinkSync(testFile);
  console.log('🗑️ Fichier supprimé avec succès');

  // Vérifier qu'il a bien été supprimé
  if (!fs.existsSync(testFile)) {
    console.log('✅ Confirmation: le fichier n\'existe plus');
  } else {
    console.log('❌ Erreur: le fichier existe encore');
  }
} else {
  console.log('❌ Le fichier n\'existe pas');
}

// Lister les fichiers restants
console.log('\n📋 Fichiers restants dans le dossier:');
const files = fs.readdirSync(moviesFolder);
const videoFiles = files.filter(file =>
  ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'].includes(path.extname(file).toLowerCase())
);

console.log(`📊 ${videoFiles.length} fichiers vidéo trouvés:`);
videoFiles.forEach(file => console.log(`   - ${file}`));
