import { prisma } from "../utils/prisma.js";

async function migrateToRoles() {
  try {
    console.log("🔄 Migration vers le système de rôles...");

    // Vérifier si la migration a déjà été effectuée
    const usersWithRolesCount = await prisma.user.count({
      where: {
        role: {
          in: ["USER", "ADMIN"],
        },
      },
    });

    if (usersWithRolesCount > 0) {
      console.log("✅ La migration a déjà été effectuée");
      return;
    }

    // Mettre à jour tous les utilisateurs existants pour leur donner le rôle USER
    const result = await prisma.user.updateMany({
      data: {
        role: "USER" as const,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    console.log(
      `✅ Migration terminée : ${result.count} utilisateurs mis à jour`
    );

    // Créer un utilisateur administrateur par défaut s'il n'en existe pas
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminExists) {
      console.log("🔐 Création de l'utilisateur administrateur par défaut...");

      // Utiliser le premier utilisateur existant comme admin
      const firstUser = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
      });

      if (firstUser) {
        await prisma.user.update({
          where: { id: firstUser.id },
          data: {
            role: "ADMIN",
            name: "Administrateur",
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Utilisateur ${firstUser.email} promu administrateur`);
        console.log(
          "🔑 Connectez-vous avec cet utilisateur pour accéder au panneau d'administration"
        );
      }
    }

    console.log("🎉 Migration terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  migrateToRoles();
}

export { migrateToRoles };
