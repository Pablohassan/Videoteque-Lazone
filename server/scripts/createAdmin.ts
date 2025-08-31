import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";

async function createAdminUser() {
  try {
    console.log("🔐 Création de l'utilisateur administrateur...");

    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      console.log("⚠️  Un administrateur existe déjà dans la base de données");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nom: ${existingAdmin.name}`);
      return;
    }

    // Créer l'utilisateur administrateur
    const adminPassword = "admin123"; // Mot de passe par défaut
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        email: "admin@videotek.com",
        name: "Administrateur",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Utilisateur administrateur créé avec succès !");
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Nom: ${adminUser.name}`);
    console.log(`   Mot de passe: ${adminPassword}`);
    console.log(`   Rôle: ${adminUser.role}`);
    console.log("");
    console.log(
      "🔑 IMPORTANT: Changez ce mot de passe après la première connexion !"
    );
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'administrateur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}

export { createAdminUser };
