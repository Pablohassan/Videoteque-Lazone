import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function analyzeSync() {
  // Films en DB avec localPath
  const dbMovies = await prisma.movie.findMany({
    where: { localPath: { not: null } },
    select: { id: true, title: true, localPath: true, filename: true },
  });

  console.log("📊 Analyse de la synchronisation :");
  console.log("=".repeat(50));
  console.log(`🎬 Films en DB avec localPath: ${dbMovies.length}`);

  // Charger l'état d'indexation
  const indexStateFile =
    "/Users/rusmirsadikovic/projetsperso/cine-scan-connect/.movie-index-state.json";

  let indexState = { lastIndexedFiles: [] };
  if (fs.existsSync(indexStateFile)) {
    indexState = JSON.parse(fs.readFileSync(indexStateFile, "utf-8"));
  }

  console.log(
    `📋 Fichiers dans l'état d'indexation: ${indexState.lastIndexedFiles.length}`
  );

  // Comparer
  const dbPaths = new Set(dbMovies.map((m) => m.localPath));
  const indexPaths = new Set(indexState.lastIndexedFiles);

  const inDbNotInIndex = Array.from(dbPaths).filter(
    (path) => !indexPaths.has(path)
  );
  const inIndexNotInDb = Array.from(indexPaths).filter(
    (path) => !dbPaths.has(path)
  );

  console.log("");
  console.log("🔍 Problèmes détectés :");
  console.log(`  ❌ En DB mais pas dans l'état: ${inDbNotInIndex.length}`);
  console.log(`  ❌ Dans l'état mais pas en DB: ${inIndexNotInDb.length}`);

  if (inDbNotInIndex.length > 0) {
    console.log("");
    console.log("Films en DB mais pas dans l'état :");
    inDbNotInIndex.forEach((path) => console.log(`  - ${path}`));
  }

  if (inIndexNotInDb.length > 0) {
    console.log("");
    console.log("Fichiers dans l'état mais pas en DB :");
    inIndexNotInDb.forEach((path) => console.log(`  - ${path}`));
  }

  await prisma.$disconnect();
}

analyzeSync();
