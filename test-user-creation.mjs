import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testDirectEmail() {
  console.log("🧪 Test d'envoi d'email direct avec nodemailer");

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

  console.log("📋 Configuration SMTP:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   User: ${config.auth.user ? "✅ Défini" : "❌ Non défini"}`);
  console.log(`   Pass: ${config.auth.pass ? "✅ Défini" : "❌ Non défini"}`);
  console.log("");

  if (!config.auth.user || !config.auth.pass) {
    console.error("❌ Configuration SMTP incomplète");
    return;
  }

  const transporter = nodemailer.createTransport(config);

  try {
    console.log("🔗 Test de connexion SMTP...");
    await transporter.verify();
    console.log("✅ Connexion SMTP réussie");
    console.log("");

    console.log("📧 Envoi d'email de test direct...");
    const result = await transporter.sendMail({
      from: `"CineScan Connect Test" <${config.auth.user}>`,
      to: config.auth.user,
      subject: "🧪 Test direct - CineScan Connect",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Test Direct</title>
        </head>
        <body style="font-family: Arial, sans-serif;">
          <h1 style="color: #28a745;">✅ Test réussi !</h1>
          <p>Ceci est un test d'envoi d'email direct depuis le script.</p>
          <p><strong>Détails:</strong></p>
          <ul>
            <li>Host: ${config.host}</li>
            <li>Port: ${config.port}</li>
            <li>Secure: ${config.secure}</li>
            <li>Date: ${new Date().toLocaleString("fr-FR")}</li>
          </ul>
          <p>Si vous recevez cet email, la configuration SMTP fonctionne parfaitement.</p>
        </body>
        </html>
      `,
      text: `Test réussi !

Ceci est un test d'envoi d'email direct depuis le script.

Détails:
- Host: ${config.host}
- Port: ${config.port}
- Secure: ${config.secure}
- Date: ${new Date().toLocaleString("fr-FR")}

Si vous recevez cet email, la configuration SMTP fonctionne parfaitement.`,
    });

    console.log("✅ Email envoyé avec succès !");
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(
      `📬 Vérifiez votre boîte mail (et les spams) à l'adresse: ${config.auth.user}`
    );
  } catch (error) {
    console.error("❌ Erreur SMTP:", error.message);
    console.log("");
    console.log("🔧 Conseils de dépannage:");
    console.log("1. Vérifiez vos identifiants SMTP");
    console.log("2. Pour Gmail: utilisez un mot de passe d'application");
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
  }
}

testDirectEmail();
