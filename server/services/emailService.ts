import nodemailer from "nodemailer";

// Interface pour la configuration email
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Interface pour les données d'invitation utilisateur
interface UserInvitationData {
  email: string;
  name: string;
  tempPassword: string;
  loginUrl?: string;
}

export class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };

    this.transporter = nodemailer.createTransport(config);

    // Vérifier la configuration
    if (!config.auth.user || !config.auth.pass) {
      console.warn(
        "⚠️ Configuration email incomplète. Les emails ne seront pas envoyés."
      );
    }
  }

  /**
   * Envoie un email d'invitation à un nouvel utilisateur
   */
  async sendUserInvitation(data: UserInvitationData): Promise<boolean> {
    try {
      const { email, name, tempPassword, loginUrl } = data;

      console.log(`📧 Tentative d'envoi d'email d'invitation à ${email}`);

      // Vérifier la configuration SMTP
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpUser || !smtpPass) {
        console.error(
          `❌ Configuration SMTP incomplète: SMTP_USER=${!!smtpUser}, SMTP_PASS=${!!smtpPass}`
        );
        return false;
      }

      console.log(
        `📧 Configuration SMTP: HOST=${process.env.SMTP_HOST}, PORT=${process.env.SMTP_PORT}, SECURE=${process.env.SMTP_SECURE}`
      );

      const mailOptions = {
        from: `"CineScan Connect" <${smtpUser}>`,
        to: email,
        subject: "🎬 Bienvenue sur CineScan Connect - Vos identifiants d'accès",
        html: this.generateInvitationTemplate(
          name,
          email,
          tempPassword,
          loginUrl
        ),
        // Version texte au cas où le HTML ne fonctionne pas
        text: this.generateInvitationText(name, email, tempPassword, loginUrl),
      };

      console.log(`📧 Envoi de l'email avec les options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html,
        hasText: !!mailOptions.text,
      });

      const result = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email d'invitation envoyé avec succès à ${email}:`, {
        messageId: result.messageId,
        response: result.response,
        envelope: result.envelope,
      });

      return true;
    } catch (error) {
      const errorDetails = error as {
        code?: string;
        command?: string;
        response?: string;
      };
      console.error(
        `❌ Erreur détaillée lors de l'envoi d'email à ${data.email}:`,
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          code: errorDetails.code,
          command: errorDetails.command,
          response: errorDetails.response,
        }
      );
      return false;
    }
  }

  /**
   * Génère le template HTML d'invitation stylisé
   */
  private generateInvitationTemplate(
    name: string,
    email: string,
    tempPassword: string,
    loginUrl?: string
  ): string {
    const loginLink =
      loginUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}`;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur CineScan Connect</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e74c3c;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6c757d;
            font-size: 16px;
          }
          .welcome-message {
            font-size: 20px;
            color: #2c3e50;
            margin: 30px 0;
            text-align: center;
          }
          .credentials-box {
            background: #f8f9fa;
            border: 2px solid #e74c3c;
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
          }
          .credential-label {
            font-weight: bold;
            color: #495057;
            margin-bottom: 8px;
            display: block;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            color: #e74c3c;
            background: white;
            padding: 10px 20px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
            margin: 10px 0;
            display: inline-block;
            font-weight: bold;
          }
          .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 30px 0;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            transition: all 0.3s ease;
          }
          .login-button:hover {
            box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
            transform: translateY(-2px);
          }
          .instructions {
            background: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
          }
          .instructions h3 {
            color: #155724;
            margin-top: 0;
            margin-bottom: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeeba;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .feature {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 1px solid #dee2e6;
          }
          .feature-icon {
            font-size: 24px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎬 CineScan Connect</div>
            <div class="subtitle">Votre cinéma personnel</div>
          </div>

          <h1 class="welcome-message">
            Bienvenue ${name} ! 🎉
          </h1>

          <p style="text-align: center; font-size: 16px; color: #6c757d;">
            Vous avez été invité à rejoindre notre plateforme de gestion cinématographique.
            Découvrez votre collection personnelle de films !
          </p>

          <div class="credentials-box">
            <h3 style="color: #2c3e50; margin-top: 0;">Vos identifiants d'accès</h3>

            <div class="credential-label">Adresse email :</div>
            <div class="credential-value">${email}</div>

            <div class="credential-label">Mot de passe temporaire :</div>
            <div class="credential-value">${tempPassword}</div>
          </div>

          <div class="warning">
            <strong>⚠️ Sécurité :</strong> Ce mot de passe temporaire est valide pendant 24h.
            Veuillez le changer lors de votre première connexion.
          </div>

          <div style="text-align: center;">
            <a href="${loginLink}" class="login-button">
              🚀 Se connecter maintenant
            </a>
          </div>

          <div class="instructions">
            <h3>📋 Instructions pour votre première connexion :</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Cliquez sur le bouton "Se connecter maintenant" ci-dessus</li>
              <li>Utilisez votre adresse email et le mot de passe temporaire fourni</li>
              <li>Vous serez invité à changer votre mot de passe</li>
              <li>Commencez à explorer votre collection de films !</li>
            </ol>
          </div>

          <div class="features">
            <div class="feature">
              <div class="feature-icon">🎯</div>
              <h4>Collection Personnelle</h4>
              <p>Gérez votre bibliothèque de films personnelle</p>
            </div>
            <div class="feature">
              <div class="feature-icon">⭐</div>
              <div class="feature-icon">⭐</div>
              <h4>Notes & Avis</h4>
              <p>Notez et commentez vos films préférés</p>
            </div>
            <div class="feature">
              <div class="feature-icon">📊</div>
              <h4>Statistiques</h4>
              <p>Suivez vos habitudes de visionnage</p>
            </div>
          </div>

          <div class="footer">
            <p>
              Cet email a été envoyé automatiquement par CineScan Connect.<br>
              Si vous n'avez pas demandé cet accès, veuillez ignorer cet email.
            </p>
            <p style="margin-top: 15px;">
              <strong>CineScan Connect</strong> - Votre cinéma à portée de main 🎬
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Génère la version texte de l'email (fallback)
   */
  private generateInvitationText(
    name: string,
    email: string,
    tempPassword: string,
    loginUrl?: string
  ): string {
    const loginLink =
      loginUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}`;

    return `
🎬 Bienvenue sur CineScan Connect !

Bonjour ${name},

Vous avez été invité à rejoindre notre plateforme de gestion cinématographique.

=== VOS IDENTIFIANTS D'ACCÈS ===
Email: ${email}
Mot de passe temporaire: ${tempPassword}

⚠️ Sécurité: Ce mot de passe temporaire est valide pendant 24h.
Veuillez le changer lors de votre première connexion.

=== INSTRUCTIONS ===
1. Cliquez sur ce lien pour vous connecter: ${loginLink}
2. Utilisez votre adresse email et le mot de passe temporaire fourni
3. Vous serez invité à changer votre mot de passe
4. Commencez à explorer votre collection de films !

=== FONCTIONNALITÉS ===
• Collection personnelle de films
• Système de notation et commentaires
• Statistiques de visionnage
• Interface moderne et intuitive

Cet email a été envoyé automatiquement par CineScan Connect.
Si vous n'avez pas demandé cet accès, veuillez ignorer cet email.

CineScan Connect - Votre cinéma à portée de main 🎬
    `;
  }

  /**
   * Test de connexion SMTP
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("✅ Connexion SMTP établie avec succès");
      return true;
    } catch (error) {
      console.error("❌ Échec de la connexion SMTP:", error);
      return false;
    }
  }

  /**
   * Envoie un email générique
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"CineScan Connect" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé à ${to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi d'email à ${to}:`, error);
      return false;
    }
  }
}

// Instance singleton du service email
export const emailService = new EmailService();
