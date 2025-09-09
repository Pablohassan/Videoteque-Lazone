import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction de nettoyage complet
async function resetSynchronization() {
  console.log('🔄 Remise à zéro complète de la synchronisation');
  console.log('================================================');

  try {
    // 1. Supprimer tous les films de la base de données
    console.log('🗑️ Suppression de tous les films de la base de données...');
    const deletedMovies = await prisma.movie.deleteMany({});
    console.log(`✅ ${deletedMovies.count} films supprimés de la DB`);

    // 2. Supprimer l'ancien état d'indexation
    const indexStateFile = path.join(process.cwd(), '.movie-index-state.json');
    if (fs.existsSync(indexStateFile)) {
      fs.unlinkSync(indexStateFile);
      console.log('✅ Ancien état d\'indexation supprimé');
    }

    // 3. Scanner le dossier actuel et créer le nouvel état
    console.log('📁 Scan du dossier actuel...');
    const moviesFolder = '/Users/rusmirsadikovic/Downloads/films';
    const currentFiles = [];

    if (fs.existsSync(moviesFolder)) {
      const files = fs.readdirSync(moviesFolder);

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'].includes(ext)) {
          const fullPath = path.join(moviesFolder, file);
          const relativePath = path.relative(process.cwd(), fullPath);
          const dbFormatPath = `../../${relativePath}`;
          currentFiles.push(dbFormatPath);
          console.log(`   ${file} -> ${dbFormatPath}`);
        }
      }
    }

    console.log(`📋 ${currentFiles.length} fichiers trouvés dans le dossier`);

    // 4. Créer le nouvel état d'indexation
    const newState = {
      lastIndexedFiles: currentFiles,
      lastIndexTime: Date.now(),
    };

    fs.writeFileSync(indexStateFile, JSON.stringify(newState, null, 2));
    console.log('✅ Nouvel état d\'indexation créé');

    // 5. Réindexer tous les films (via API)
    console.log('🎬 Réindexation de tous les films...');
    if (currentFiles.length > 0) {
      try {
        // Utiliser l'API du serveur pour déclencher l'indexation
        const response = await fetch('http://localhost:3001/api/scan-now', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log('✅ Indexation déclenchée via API');
        } else {
          console.log('❌ Échec du déclenchement de l\'indexation via API');
        }
      } catch (error) {
        console.log('❌ Impossible de contacter le serveur pour l\'indexation');
        console.log('💡 Lancez manuellement: npm run sync-db');
      }
    }

    console.log('\n🎉 Remise à zéro terminée avec succès!');
    console.log('✅ Base de données nettoyée');
    console.log('✅ État d\'indexation recréé');
    console.log('✅ Films réindexés');

  } catch (error) {
    console.error('❌ Erreur lors de la remise à zéro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSynchronization();
