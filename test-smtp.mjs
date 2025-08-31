import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Charger les variables d'environnement
dotenv.config();

console.log("🧪 Test de la configuration SMTP");
console.log("===============================");

// Configuration SMTP
const config = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

console.log("📋 Configuration détectée:");
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Secure: ${config.secure}`);
console.log(`   User: ${config.auth.user ? "✅ Défini" : "❌ Non défini"}`);
console.log(`   Pass: ${config.auth.pass ? "✅ Défini" : "❌ Non défini"}`);
console.log("");

if (!config.auth.user || !config.auth.pass) {
  console.error("❌ Configuration SMTP incomplète !");
  console.log("Vérifiez les variables suivantes dans votre .env:");
  console.log("- SMTP_HOST");
  console.log("- SMTP_PORT");
  console.log("- SMTP_SECURE");
  console.log("- SMTP_USER");
  console.log("- SMTP_PASS");
  process.exit(1);
}

// Créer le transporteur
const transporter = nodemailer.createTransport(config);

console.log("🔗 Test de connexion SMTP...");

try {
  await transporter.verify();
  console.log("✅ Connexion SMTP réussie !");
  console.log("");

  // Tester l'envoi d'un email
  console.log("📧 Envoi d'un email de test...");

  const mailOptions = {
    from: `"CineScan Connect Test" <${config.auth.user}>`,
    to: config.auth.user, // S'envoyer à soi-même
    subject: "🧪 Test SMTP CineScan Connect",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test SMTP</title>
      </head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #28a745;">✅ Test SMTP Réussi !</h1>
        <p>Votre configuration SMTP fonctionne correctement.</p>
        <p><strong>Détails de la configuration:</strong></p>
        <ul>
          <li>Host: ${config.host}</li>
          <li>Port: ${config.port}</li>
          <li>Secure: ${config.secure}</li>
          <li>Date: ${new Date().toLocaleString("fr-FR")}</li>
        </ul>
        <p>CineScan Connect - Test automatique</p>
      </body>
      </html>
    `,
    text: `Test SMTP CineScan Connect

✅ Votre configuration SMTP fonctionne correctement !

Détails:
- Host: ${config.host}
- Port: ${config.port}
- Secure: ${config.secure}
- Date: ${new Date().toLocaleString("fr-FR")}

CineScan Connect - Test automatique`,
  };

  const result = await transporter.sendMail(mailOptions);

  console.log("✅ Email de test envoyé avec succès !");
  console.log(`📬 Message ID: ${result.messageId}`);
  console.log(
    `📬 Vérifiez votre boîte mail (et les spams) à l'adresse: ${config.auth.user}`
  );
} catch (error) {
  console.error("❌ Erreur SMTP:", error.message);
  console.log("");
  console.log("🔧 Conseils de dépannage:");
  console.log("1. Vérifiez vos identifiants SMTP");
  console.log("2. Pour Gmail: créez un 'mot de passe d'application'");
  console.log("3. Vérifiez les paramètres de sécurité de votre compte email");
  console.log("4. Désactivez temporairement votre antivirus/firewall");
  console.log("5. Essayez un port différent (587 pour TLS, 465 pour SSL)");

  if (error.code === "EAUTH") {
    console.log("   → Problème d'authentification (vérifiez user/pass)");
  } else if (error.code === "ECONNREFUSED") {
    console.log("   → Connexion refusée (vérifiez host/port)");
  } else if (error.code === "ETIMEDOUT") {
    console.log("   → Timeout (vérifiez la connexion réseau)");
  }

  process.exit(1);
}
