import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { adminLogger } from "../utils/logger.js";

async function createAdminUser() {
  try {
    adminLogger.info("Starting administrator user creation process");

    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return;
    }
    // Créer l'utilisateur administrateur avec variables d'environnement
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminName = process.env.ADMIN_NAME || "Administrateur";
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Vérifier que l'email admin est fourni
    if (!adminEmail) {
      adminLogger.error(
        "ADMIN_EMAIL environment variable is required for admin user creation"
      );
      adminLogger.info(
        "Example: ADMIN_EMAIL=admin@mon-domaine.com node scripts/createAdmin.ts"
      );
      process.exit(1);
    }

    // Vérifier que le mot de passe admin est fourni
    if (!adminPassword) {
      adminLogger.error(
        "ADMIN_PASSWORD environment variable is required for admin user creation"
      );
      adminLogger.info(
        "Example: ADMIN_PASSWORD=monMotDePasseSecret node scripts/createAdmin.ts"
      );
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
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
      "🔑 IMPORTANT: Changer ce mot de passe après la première connexion !"
    );
  } catch (error) {
    adminLogger.error(
      "Failed to create administrator user",
      error instanceof Error ? error : new Error(String(error))
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function resetAdminPassword() {
  try {
    adminLogger.info("Starting administrator password reset process");

    // Trouver l'admin existant
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!existingAdmin) {
      adminLogger.warn(
        "No administrator user found. Use create admin script first"
      );
      return;
    }

    // Nouveaux paramètres depuis les variables d'environnement
    const newEmail = process.env.ADMIN_EMAIL;
    const newPassword = process.env.ADMIN_PASSWORD;

    // Vérifier que l'email admin est fourni
    if (!newEmail) {
      adminLogger.error(
        "ADMIN_EMAIL environment variable is required for password reset"
      );
      adminLogger.info(
        "Example: ADMIN_EMAIL=admin@mon-domaine.com node scripts/createAdmin.ts --reset-password"
      );
      process.exit(1);
    }

    // Vérifier que le mot de passe admin est fourni
    if (!newPassword) {
      adminLogger.error(
        "ADMIN_PASSWORD environment variable is required for password reset"
      );
      adminLogger.info(
        "Example: ADMIN_PASSWORD=monMotDePasseSecret node scripts/createAdmin.ts --reset-password"
      );
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe et l'email
    const correctedEmail = newEmail;

    const updatedAdmin = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: correctedEmail,
        password: hashedPassword,
        isActive: true, // S'assurer que l'admin est actif
      },
    });

    console.log("✅ Mot de passe administrateur réinitialisé avec succès !");
    console.log(`   Email: ${updatedAdmin.email}`);
    console.log(`   Nom: ${updatedAdmin.name}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    console.log(`   Rôle: ${updatedAdmin.role}`);
    console.log(`   Statut: ${updatedAdmin.isActive ? "Actif" : "Inactif"}`);
    console.log("");
    console.log(
      "🔑 IMPORTANT: Connectez-vous avec ce mot de passe temporaire !"
    );
  } catch (error) {
    adminLogger.error(
      "Failed to reset administrator password",
      error instanceof Error ? error : new Error(String(error))
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  // Vérifier les arguments de ligne de commande
  const args = process.argv.slice(2);

  if (args.includes("--reset-password") || args.includes("-r")) {
    resetAdminPassword();
  } else {
    createAdminUser();
  }
}

async function checkAdminStatus() {
  try {
    adminLogger.info("Checking administrator status");

    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!existingAdmin) {
      return;
    }

    adminLogger.info("Administrator user found", {
      id: existingAdmin.id,
      email: existingAdmin.email,
      name: existingAdmin.name,
      role: existingAdmin.role,
      isActive: existingAdmin.isActive,
      createdAt: existingAdmin.createdAt,
      lastLoginAt: existingAdmin.lastLoginAt,
      passwordEnv: process.env.ADMIN_PASSWORD ? "SET" : "NOT_SET",
    });
  } catch (error) {
    adminLogger.error(
      "Failed to check administrator status",
      error instanceof Error ? error : new Error(String(error))
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  // Afficher l'aide si demandé
  if (args.includes("--help") || args.includes("-h")) {
    console.log("🔧 Script de gestion de l'administrateur");
    console.log("");
    console.log("Usage:");
    console.log(
      "  node scripts/createAdmin.ts                    # Créer un admin (si aucun n'existe)"
    );
    console.log(
      "  node scripts/createAdmin.ts --reset-password  # Réinitialiser le mot de passe admin"
    );
    console.log(
      "  node scripts/createAdmin.ts --check           # Vérifier le statut de l'admin"
    );
    console.log(
      "  node scripts/createAdmin.ts --help            # Afficher cette aide"
    );
    console.log("");
    console.log("Variables d'environnement requises:");
    console.log("  ADMIN_EMAIL=admin@mon-domaine.com      (obligatoire)");
    console.log("  ADMIN_PASSWORD=monMotDePasseSecret     (obligatoire)");
    console.log("  ADMIN_NAME=Mon Nom                     (optionnel)");
    process.exit(0);
  }

  if (args.includes("--reset-password") || args.includes("-r")) {
    resetAdminPassword();
  } else if (args.includes("--check") || args.includes("-c")) {
    checkAdminStatus();
  } else {
    createAdminUser();
  }
}

export { createAdminUser, resetAdminPassword, checkAdminStatus };
