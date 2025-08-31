import dotenv from "dotenv";
import { emailService } from "../services/emailService.js";

// Charger les variables d'environnement
dotenv.config();

async function testEmailConfiguration() {
  console.log("🧪 Test de la configuration email SMTP");
  console.log("=====================================");

  // Vérifier les variables d'environnement
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpSecure = process.env.SMTP_SECURE;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log("📋 Configuration détectée:");
  console.log(`   SMTP_HOST: ${smtpHost || "❌ Non défini"}`);
  console.log(`   SMTP_PORT: ${smtpPort || "❌ Non défini"}`);
  console.log(`   SMTP_SECURE: ${smtpSecure || "❌ Non défini"}`);
  console.log(`   SMTP_USER: ${smtpUser ? "✅ Défini" : "❌ Non défini"}`);
  console.log(`   SMTP_PASS: ${smtpPass ? "✅ Défini" : "❌ Non défini"}`);
  console.log("");

  // Vérifier la configuration de base
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.error(
      "❌ Configuration SMTP incomplète. Vérifiez votre fichier .env"
    );
    process.exit(1);
  }

  // Tester la connexion SMTP
  console.log("🔗 Test de connexion SMTP...");
  const connectionOk = await emailService.testConnection();

  if (!connectionOk) {
    console.error("❌ Échec de la connexion SMTP. Vérifiez vos paramètres.");
    console.log("\n🔧 Conseils de dépannage:");
    console.log("   - Vérifiez que les identifiants SMTP sont corrects");
    console.log("   - Pour Gmail: utilisez un 'mot de passe d'application'");
    console.log(
      "   - Vérifiez que le port SMTP est ouvert (587 pour TLS, 465 pour SSL)"
    );
    console.log("   - Désactivez temporairement le firewall/antivirus");
    process.exit(1);
  }

  console.log("✅ Connexion SMTP réussie !");
  console.log("");

  // Demander si on veut envoyer un email de test
  console.log("📧 Voulez-vous envoyer un email de test ?");
  console.log(
    "   Entrez l'adresse email de destination (ou 'non' pour annuler):"
  );

  // Pour les tests automatisés, on peut utiliser une adresse par défaut
  const testEmail = smtpUser; // Utiliser l'adresse SMTP comme destinataire par défaut

  if (!testEmail || testEmail.toLowerCase() === "non") {
    console.log("Test annulé.");
    return;
  }

  console.log(`📧 Envoi d'un email de test à: ${testEmail}`);

  try {
    const emailSent = await emailService.sendEmail(
      testEmail,
      "🧪 Test CineScan Connect - Configuration SMTP",
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test CineScan Connect</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">🧪 Test Réussi !</h1>
        <p>Si vous recevez cet email, votre configuration SMTP fonctionne correctement.</p>
        <p><strong>Configuration testée:</strong></p>
        <ul>
          <li>SMTP Host: ${smtpHost}</li>
          <li>SMTP Port: ${smtpPort}</li>
          <li>SMTP Secure: ${smtpSecure}</li>
          <li>Date du test: ${new Date().toLocaleString("fr-FR")}</li>
        </ul>
        <p>CineScan Connect - Configuration validée ✅</p>
      </body>
      </html>
      `,
      `🧪 Test CineScan Connect

Si vous recevez cet email, votre configuration SMTP fonctionne correctement.

Configuration testée:
- SMTP Host: ${smtpHost}
- SMTP Port: ${smtpPort}
- SMTP Secure: ${smtpSecure}
- Date du test: ${new Date().toLocaleString("fr-FR")}

CineScan Connect - Configuration validée ✅`
    );

    if (emailSent) {
      console.log("✅ Email de test envoyé avec succès !");
      console.log("📬 Vérifiez votre boîte mail (et les spams)");
    } else {
      console.error("❌ Échec de l'envoi de l'email de test");
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi du test:", error);
  }
}

// Exécuter le test
testEmailConfiguration().catch((error) => {
  console.error("❌ Erreur lors du test:", error);
  process.exit(1);
});
