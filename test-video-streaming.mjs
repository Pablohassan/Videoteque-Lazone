#!/usr/bin/env node

/**
 * Test script pour reproduire et diagnostiquer les problèmes de streaming vidéo
 * Teste les range requests et la compatibilité avec différents formats vidéo
 */

import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_VIDEO_PATH =
  "/Users/rusmirsadikovic/Downloads/films/The Good The Bad And The Ugly (1966) [1080p]/The.Good.the.Bad.and.the.Ugly.1966.1080p.BrRip.x264.YIFY.mp4";

console.log(
  "🔍 Test de streaming vidéo - Diagnostic des problèmes de seeking\n"
);

// Test 1: Vérifier si le fichier existe et ses propriétés
console.log("📁 Test 1: Vérification du fichier vidéo");
try {
  const stats = fs.statSync(TEST_VIDEO_PATH);
  console.log(`✅ Fichier trouvé:`);
  console.log(
    `   - Taille: ${(stats.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  );
  console.log(`   - Extension: ${path.extname(TEST_VIDEO_PATH)}`);
  console.log(`   - MIME type estimé: ${getMimeType(TEST_VIDEO_PATH)}`);
} catch (error) {
  console.log(`❌ Erreur: Fichier non trouvé - ${error.message}`);
  process.exit(1);
}

// Test 2: Tester les range requests manuellement
console.log("\n🌐 Test 2: Simulation des range requests");

function testRangeRequest(start, end, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: `/api/files/stream/film.mkv?path=${encodeURIComponent(
        TEST_VIDEO_PATH
      )}`,
      method: "GET",
      headers: {
        Range: `bytes=${start}-${end}`,
        "User-Agent": "Mozilla/5.0 (Test Browser)",
      },
    };

    console.log(`   Test: ${description}`);
    console.log(`   Range: bytes=${start}-${end}`);

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(
        `   Headers:`,
        JSON.stringify(
          {
            "content-range": res.headers["content-range"],
            "content-length": res.headers["content-length"],
            "content-type": res.headers["content-type"],
            "accept-ranges": res.headers["accept-ranges"],
          },
          null,
          2
        )
      );

      let dataLength = 0;
      res.on("data", (chunk) => {
        dataLength += chunk.length;
      });

      res.on("end", () => {
        console.log(`   Données reçues: ${dataLength} bytes`);
        resolve({ status: res.statusCode, dataLength, headers: res.headers });
      });
    });

    req.on("error", (error) => {
      console.log(`   ❌ Erreur: ${error.message}`);
      resolve({ error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log(`   ⏰ Timeout après 10 secondes`);
      req.destroy();
      resolve({ timeout: true });
    });

    req.end();
  });
}

// Test 3: Tester HEAD request pour vérifier les métadonnées
console.log("\n📋 Test 3: Vérification des métadonnées (HEAD request)");

function testHeadRequest() {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: `/api/files/stream/film.mkv?path=${encodeURIComponent(
        TEST_VIDEO_PATH
      )}`,
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (Test Browser)",
      },
    };

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(
        `   Headers:`,
        JSON.stringify(
          {
            "content-length": res.headers["content-length"],
            "content-type": res.headers["content-type"],
            "accept-ranges": res.headers["accept-ranges"],
          },
          null,
          2
        )
      );
      resolve({ status: res.statusCode, headers: res.headers });
    });

    req.on("error", (error) => {
      console.log(`   ❌ Erreur: ${error.message}`);
      resolve({ error: error.message });
    });

    req.end();
  });
}

// Test 4: Tester les différents scénarios de range requests
console.log(
  "\n🎯 Test 4: Tests des range requests (nécessite le serveur en cours d'exécution)"
);

// Fonction utilitaire pour déterminer le MIME type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".mp4": "video/mp4",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".wmv": "video/x-ms-wmv",
    ".flv": "video/x-flv",
    ".webm": "video/webm",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Instructions d'utilisation
console.log("\n📝 Instructions:");
console.log(
  "1. Assurez-vous que le serveur est en cours d'exécution sur le port 3000"
);
console.log("2. Exécutez ce script avec: node test-video-streaming.js");
console.log("3. Les tests vérifieront automatiquement les range requests");
console.log(
  "4. Consultez les logs du serveur pour voir les détails des requêtes"
);

// Test des différents scénarios
async function runTests() {
  console.log("\n🚀 Exécution des tests...\n");

  // Test HEAD
  await testHeadRequest();

  // Test range requests typiques du navigateur
  const fileSize = fs.statSync(TEST_VIDEO_PATH).size;

  // Test 1: Range request du début (comme fait par le navigateur pour le seeking)
  await testRangeRequest(0, 1023, "Range du début (0-1023)");

  // Test 2: Range request au milieu
  const middleStart = Math.floor(fileSize / 2);
  await testRangeRequest(middleStart, middleStart + 1023, "Range du milieu");

  // Test 3: Range request de fin
  await testRangeRequest(fileSize - 1024, fileSize - 1, "Range de fin");

  // Test 4: Range request invalide (pour tester la gestion d'erreur)
  await testRangeRequest(
    fileSize + 1000,
    fileSize + 2000,
    "Range invalide (au-delà de la taille)"
  );

  console.log("\n✨ Tests terminés!");
  console.log("\n🔧 Recommandations:");
  console.log(
    "1. Vérifiez que le serveur répond avec le bon status code (206 pour les ranges)"
  );
  console.log(
    "2. Assurez-vous que le Content-Range header est correctement formaté"
  );
  console.log('3. Vérifiez que l\'Accept-Ranges header est défini sur "bytes"');
  console.log(
    "4. Pour les vidéos MKV, considérez la conversion en MP4 pour une meilleure compatibilité"
  );
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testRangeRequest, testHeadRequest, runTests };
